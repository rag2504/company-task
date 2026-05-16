// User Management System for Production
// This handles user registration, authentication, and role management

export const USER_ROLES = {
  OWNER: 'Owner',
  STAFF: 'Staff'
};

export const AUTH_TOKEN_KEY = 'quickbill_auth_token';

export const STORAGE_KEYS = {
  USERS: 'provisionStore_users',
  CURRENT_USER: 'provisionStore_currentUser',
  USER_COUNTER: 'provisionStore_userCounter'
};

// Generate user-specific storage keys
export const getUserStorageKey = (userId, dataType) => {
  return `provisionStore_user_${userId}_${dataType}`;
};

// Data types for user-specific storage
export const DATA_TYPES = {
  PRODUCTS: 'products',
  BILLS: 'bills',
  STATS: 'stats'
};

// Initialize default owner if no users exist
const initializeDefaultOwner = () => {
  const users = getAllUsers();
  if (users.length === 0) {
    const defaultOwner = {
      id: 1,
      email: 'owner@provisionstore.com',
      password: 'admin123', // In production, this should be hashed
      name: 'Store Owner',
      role: USER_ROLES.OWNER,
      organizationId: 1, // Owner creates their own organization
      ownerId: null, // Owners don't have an owner
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([defaultOwner]));
    localStorage.setItem(STORAGE_KEYS.USER_COUNTER, '1');
    
    // Initialize data for default owner with sample products
    initializeUserData(defaultOwner.id);
    
    return [defaultOwner];
  }
  return users;
};

// Get all users from localStorage
export const getAllUsers = () => {
  try {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error retrieving users:', error);
    return [];
  }
};

// Get next user ID
const getNextUserId = () => {
  const currentCounter = parseInt(localStorage.getItem(STORAGE_KEYS.USER_COUNTER) || '0');
  const nextId = currentCounter + 1;
  localStorage.setItem(STORAGE_KEYS.USER_COUNTER, nextId.toString());
  return nextId;
};

// Save users to localStorage
const saveUsers = (users) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  if (password.length > 50) {
    return { isValid: false, message: 'Password must be less than 50 characters' };
  }
  return { isValid: true, message: '' };
};

// Check if email already exists
export const emailExists = (email) => {
  const users = getAllUsers();
  return users.some(user => user.email.toLowerCase() === email.toLowerCase());
};

// Register a new user (only for Owners in public registration)
export const registerUser = (userData) => {
  const { email, password, name, role, ownerId = null } = userData;
  
  // Validation
  if (!validateEmail(email)) {
    return { success: false, message: 'Invalid email format' };
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { success: false, message: passwordValidation.message };
  }
  
  if (!name || name.trim().length < 2) {
    return { success: false, message: 'Name must be at least 2 characters long' };
  }
  
  if (!Object.values(USER_ROLES).includes(role)) {
    return { success: false, message: 'Invalid role selected' };
  }
  
  // Check if email already exists
  if (emailExists(email)) {
    return { success: false, message: 'Email already registered' };
  }
  
  // Create new user
  const users = getAllUsers();
  
  // Determine organization structure
  let organizationId, actualOwnerId;
  if (role === USER_ROLES.OWNER) {
    // New Owner gets their own organization
    const maxOrgId = users.reduce((max, user) => {
      return user.organizationId > max ? user.organizationId : max;
    }, 0);
    organizationId = maxOrgId + 1;
    actualOwnerId = null;
  } else {
    // Staff member - must have an ownerId
    if (!ownerId) {
      return { success: false, message: 'Staff members must be created by an Owner' };
    }
    const owner = users.find(u => u.id === ownerId && u.role === USER_ROLES.OWNER);
    if (!owner) {
      return { success: false, message: 'Invalid owner specified' };
    }
    organizationId = owner.organizationId;
    actualOwnerId = ownerId;
  }
  
  const newUser = {
    id: getNextUserId(),
    email: email.toLowerCase().trim(),
    password: password, // In production, this should be hashed
    name: name.trim(),
    role: role,
    organizationId: organizationId,
    ownerId: actualOwnerId,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    isActive: true
  };
  
  users.push(newUser);
  
  if (saveUsers(users)) {
    // Initialize data for the new user
    if (newUser.role === USER_ROLES.OWNER) {
      // Owners get their own products and data
      initializeUserData(newUser.id);
    } else {
      // Staff members only get their own bills, they share products with owner
      setUserData(newUser.id, DATA_TYPES.BILLS, []);
      setUserData(newUser.id, DATA_TYPES.STATS, {
        totalProducts: 0,
        totalBills: 0,
        totalRevenue: 0,
        lowStockProducts: 0
      });
    }
    
    return { 
      success: true, 
      message: 'User registered successfully',
      user: { ...newUser, password: undefined } // Don't return password
    };
  } else {
    return { success: false, message: 'Failed to save user data' };
  }
};

// Authenticate user
export const authenticateUser = (email, password) => {
  const users = initializeDefaultOwner(); // Ensure default owner exists
  
  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase().trim() && 
         u.password === password &&
         u.isActive
  );
  
  if (user) {
    // Update last login
    const updatedUsers = users.map(u => 
      u.id === user.id 
        ? { ...u, lastLogin: new Date().toISOString() }
        : u
    );
    saveUsers(updatedUsers);
    
    // Return user without password
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: new Date().toISOString()
      }
    };
  }
  
  return { success: false, message: 'Invalid email or password' };
};

// Get current logged-in user
export const getCurrentUser = () => {
  try {
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return currentUser ? JSON.parse(currentUser) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Set current logged-in user
export const setCurrentUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error setting current user:', error);
    return false;
  }
};

export const getAuthToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setRemoteAuthSession = (user, token) => {
  setCurrentUser(user);
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

// Sign out current user
export const signOutUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error signing out user:', error);
    return false;
  }
};

// Check if current user has specific role
export const hasRole = (requiredRole) => {
  const currentUser = getCurrentUser();
  return currentUser && currentUser.role === requiredRole;
};

// Check if current user is owner
export const isOwner = () => hasRole(USER_ROLES.OWNER);

// Check if current user is staff
export const isStaff = () => hasRole(USER_ROLES.STAFF);

// Get all users statistics (for admin purposes)
export const getAllUsersStats = () => {
  const users = getAllUsers();
  return {
    total: users.length,
    owners: users.filter(u => u.role === USER_ROLES.OWNER && u.isActive).length,
    staff: users.filter(u => u.role === USER_ROLES.STAFF && u.isActive).length,
    inactive: users.filter(u => !u.isActive).length
  };
};

// Change user password
export const changePassword = (userId, currentPassword, newPassword) => {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, message: 'User not found' };
  }
  
  const user = users[userIndex];
  
  if (user.password !== currentPassword) {
    return { success: false, message: 'Current password is incorrect' };
  }
  
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return { success: false, message: passwordValidation.message };
  }
  
  users[userIndex].password = newPassword;
  
  if (saveUsers(users)) {
    return { success: true, message: 'Password changed successfully' };
  } else {
    return { success: false, message: 'Failed to update password' };
  }
};

// Reset password (for forgot password functionality)
export const resetPassword = (email, newPassword) => {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (userIndex === -1) {
    return { success: false, message: 'Email not found' };
  }
  
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return { success: false, message: passwordValidation.message };
  }
  
  users[userIndex].password = newPassword;
  
  if (saveUsers(users)) {
    return { success: true, message: 'Password reset successfully' };
  } else {
    return { success: false, message: 'Failed to reset password' };
  }
};

// User-specific data management functions

// Get user-specific data
export const getUserData = (userId, dataType) => {
  try {
    const key = getUserStorageKey(userId, dataType);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error retrieving ${dataType} for user ${userId}:`, error);
    return [];
  }
};

// Set user-specific data
export const setUserData = (userId, dataType, data) => {
  try {
    const key = getUserStorageKey(userId, dataType);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${dataType} for user ${userId}:`, error);
    return false;
  }
};

// Initialize empty data for a new user
export const initializeUserData = (userId) => {
  try {
    // Initialize with some sample products so users can create bills immediately
    const sampleProducts = [
      {
        id: '1',
        name: 'Rice (1kg)',
        price: 45,
        units: 50,
        category: 'Rice, Dal & Grains',
        weight: 1,
        description: 'Premium quality rice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2', 
        name: 'Cooking Oil (1L)',
        price: 120,
        units: 30,
        category: 'Edible Oils & Ghee',
        weight: 1,
        description: 'Refined cooking oil',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Sugar (1kg)', 
        price: 40,
        units: 25,
        category: 'Packaged Foods',
        weight: 1,
        description: 'Fine granulated sugar',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Milk (1L)',
        price: 60,
        units: 20,
        category: 'Bakery & Dairy',
        weight: 1,
        description: 'Fresh milk',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Bread',
        price: 25,
        units: 15,
        category: 'Bakery & Dairy',
        weight: 0.5,
        description: 'White bread loaf',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setUserData(userId, DATA_TYPES.PRODUCTS, sampleProducts);
    setUserData(userId, DATA_TYPES.BILLS, []);
    setUserData(userId, DATA_TYPES.STATS, {
      totalProducts: 0,
      totalBills: 0,
      totalRevenue: 0,
      lowStockProducts: 0
    });
    return true;
  } catch (error) {
    console.error(`Error initializing data for user ${userId}:`, error);
    return false;
  }
};

// Clear all user data (for account deletion or reset)
export const clearUserData = (userId) => {
  try {
    Object.values(DATA_TYPES).forEach(dataType => {
      const key = getUserStorageKey(userId, dataType);
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error(`Error clearing data for user ${userId}:`, error);
    return false;
  }
};

// Get user's products (shared within organization for staff)
export const getUserProducts = (userId) => {
  console.log('getUserProducts called for userId:', userId);
  
  const user = getAllUsers().find(u => u.id === userId);
  console.log('Found user:', user);
  
  if (!user) {
    console.log('No user found!');
    return [];
  }
  
  // If user is staff, use their owner's products
  if (user.role === USER_ROLES.STAFF && user.ownerId) {
    console.log('User is staff, getting products from owner:', user.ownerId);
    const ownerProducts = getUserData(user.ownerId, DATA_TYPES.PRODUCTS);
    console.log('Owner products:', ownerProducts);
    return ownerProducts;
  }
  
  // If user is owner, use their own products
  console.log('User is owner, getting their own products');
  const ownProducts = getUserData(userId, DATA_TYPES.PRODUCTS);
  console.log('Own products:', ownProducts);
  return ownProducts;
};

// Set user's products (shared within organization for staff)
export const setUserProducts = (userId, products) => {
  const user = getAllUsers().find(u => u.id === userId);
  if (!user) return false;
  
  // If user is staff, update their owner's products
  if (user.role === USER_ROLES.STAFF && user.ownerId) {
    return setUserData(user.ownerId, DATA_TYPES.PRODUCTS, products);
  }
  
  // If user is owner, update their own products
  return setUserData(userId, DATA_TYPES.PRODUCTS, products);
};

// Get user's bills (owners see all organization bills, staff see only their own)
export const getUserBills = (userId) => {
  const user = getAllUsers().find(u => u.id === userId);
  if (!user) return [];
  
  // If user is owner, get all bills from their organization (their own + all staff bills)
  if (user.role === USER_ROLES.OWNER) {
    const allUsers = getAllUsers();
    const organizationUsers = allUsers.filter(u => 
      u.organizationId === user.organizationId && u.isActive
    );
    
    let allBills = [];
    organizationUsers.forEach(orgUser => {
      const userBills = getUserData(orgUser.id, DATA_TYPES.BILLS);
      // Add creator info to each bill
      const billsWithCreator = userBills.map(bill => ({
        ...bill,
        createdBy: orgUser.name,
        createdByRole: orgUser.role,
        createdById: orgUser.id
      }));
      allBills = allBills.concat(billsWithCreator);
    });
    
    return allBills;
  }
  
  // If user is staff, only see their own bills
  const staffBills = getUserData(userId, DATA_TYPES.BILLS);
  return staffBills.map(bill => ({
    ...bill,
    createdBy: user.name,
    createdByRole: user.role,
    createdById: user.id
  }));
};

// Set user's bills
export const setUserBills = (userId, bills) => {
  return setUserData(userId, DATA_TYPES.BILLS, bills);
};

// Get user's stats
export const getUserStats = (userId) => {
  const stats = getUserData(userId, DATA_TYPES.STATS);
  // If stats don't exist, calculate them from products and bills
  if (!stats || Object.keys(stats).length === 0) {
    const products = getUserProducts(userId);
    const bills = getUserBills(userId);
    
    const calculatedStats = {
      totalProducts: products.length,
      totalBills: bills.length,
      totalRevenue: bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
      lowStockProducts: products.filter(p => (p.units || 0) < 10).length
    };
    
    // Save calculated stats for next time
    setUserData(userId, DATA_TYPES.STATS, calculatedStats);
    return calculatedStats;
  }
  
  return stats;
};

// Update user's stats (organization-wide for owners)
export const updateUserStats = (userId) => {
  const products = getUserProducts(userId);
  const bills = getUserBills(userId);
  
  const stats = {
    totalProducts: products.length,
    totalBills: bills.length,
    totalRevenue: bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
    lowStockProducts: products.filter(p => (p.units || 0) < 10).length
  };
  
  // For owners, store stats in their own data
  // For staff, stats are calculated on-demand and not stored separately
  const user = getAllUsers().find(u => u.id === userId);
  if (user && user.role === USER_ROLES.OWNER) {
    setUserData(userId, DATA_TYPES.STATS, stats);
  }
  
  return stats;
};

// Staff Management Functions

// Create staff member (only by Owner)
export const createStaffMember = (ownerUserId, staffData) => {
  const { name, email, password } = staffData;
  
  // Verify the creator is an Owner
  const owner = getAllUsers().find(u => u.id === ownerUserId && u.role === USER_ROLES.OWNER);
  if (!owner) {
    return { success: false, message: 'Only Owners can create staff members' };
  }
  
  // Create staff member under this owner
  return registerUser({
    name,
    email,
    password,
    role: USER_ROLES.STAFF,
    ownerId: ownerUserId
  });
};

// Get all staff members for an Owner
export const getOwnerStaff = (ownerUserId) => {
  const users = getAllUsers();
  const owner = users.find(u => u.id === ownerUserId && u.role === USER_ROLES.OWNER);
  
  if (!owner) {
    return [];
  }
  
  // Return all staff members in the same organization
  return users.filter(u => 
    u.role === USER_ROLES.STAFF && 
    u.organizationId === owner.organizationId &&
    u.isActive
  );
};

// Remove/deactivate staff member
export const removeStaffMember = (ownerUserId, staffUserId) => {
  const users = getAllUsers();
  const owner = users.find(u => u.id === ownerUserId && u.role === USER_ROLES.OWNER);
  const staffMember = users.find(u => u.id === staffUserId && u.role === USER_ROLES.STAFF);
  
  if (!owner) {
    return { success: false, message: 'Only Owners can remove staff members' };
  }
  
  if (!staffMember) {
    return { success: false, message: 'Staff member not found' };
  }
  
  // Verify the staff member belongs to this owner's organization
  if (staffMember.organizationId !== owner.organizationId) {
    return { success: false, message: 'You can only remove staff from your organization' };
  }
  
  // Deactivate the staff member
  const updatedUsers = users.map(u => 
    u.id === staffUserId ? { ...u, isActive: false } : u
  );
  
  if (saveUsers(updatedUsers)) {
    // Clear the staff member's data
    clearUserData(staffUserId);
    return { success: true, message: 'Staff member removed successfully' };
  } else {
    return { success: false, message: 'Failed to remove staff member' };
  }
};

// Update staff member details
export const updateStaffMember = (ownerUserId, staffUserId, updates) => {
  const users = getAllUsers();
  const owner = users.find(u => u.id === ownerUserId && u.role === USER_ROLES.OWNER);
  const staffMember = users.find(u => u.id === staffUserId && u.role === USER_ROLES.STAFF);
  
  if (!owner) {
    return { success: false, message: 'Only Owners can update staff members' };
  }
  
  if (!staffMember) {
    return { success: false, message: 'Staff member not found' };
  }
  
  // Verify the staff member belongs to this owner's organization
  if (staffMember.organizationId !== owner.organizationId) {
    return { success: false, message: 'You can only update staff from your organization' };
  }
  
  // Validate updates
  const allowedUpdates = ['name', 'email', 'isActive'];
  const validUpdates = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      validUpdates[key] = updates[key];
    }
  });
  
  // Update the staff member
  const updatedUsers = users.map(u => 
    u.id === staffUserId ? { ...u, ...validUpdates, updatedAt: new Date().toISOString() } : u
  );
  
  if (saveUsers(updatedUsers)) {
    return { success: true, message: 'Staff member updated successfully' };
  } else {
    return { success: false, message: 'Failed to update staff member' };
  }
};

// Get organization statistics for Owner
export const getOrganizationStats = (ownerUserId) => {
  const users = getAllUsers();
  const owner = users.find(u => u.id === ownerUserId && u.role === USER_ROLES.OWNER);
  
  if (!owner) {
    return null;
  }
  
  const organizationUsers = users.filter(u => u.organizationId === owner.organizationId);
  
  return {
    totalStaff: organizationUsers.filter(u => u.role === USER_ROLES.STAFF && u.isActive).length,
    inactiveStaff: organizationUsers.filter(u => u.role === USER_ROLES.STAFF && !u.isActive).length,
    organizationId: owner.organizationId,
    createdAt: owner.createdAt
  };
};
