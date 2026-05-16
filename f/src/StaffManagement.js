import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Users, Edit, Trash2, Eye, EyeOff, 
  AlertCircle, Search,
  Mail, Calendar, Shield, UserCheck
} from 'lucide-react';
import { 
  createStaffMember, getOwnerStaff, removeStaffMember, 
  updateStaffMember, getOrganizationStats, validateEmail, 
  validatePassword 
} from './utils/userManager';

const StaffManagement = ({ currentUser, darkMode }) => {
  const [staff, setStaff] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [organizationStats, setOrganizationStats] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadData = () => {
      if (currentUser?.id) {
        const staffList = getOwnerStaff(currentUser.id);
        setStaff(staffList);
        const stats = getOrganizationStats(currentUser.id);
        setOrganizationStats(stats);
      }
    };
    
    loadData();
  }, [currentUser?.id]);

  const loadStaffData = () => {
    if (currentUser?.id) {
      const staffList = getOwnerStaff(currentUser.id);
      setStaff(staffList);
    }
  };

  const loadOrganizationStats = () => {
    if (currentUser?.id) {
      const stats = getOrganizationStats(currentUser.id);
      setOrganizationStats(stats);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (only for new staff)
    if (!editingStaff) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm the password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (editingStaff) {
        // Update existing staff member
        const result = updateStaffMember(currentUser.id, editingStaff.id, {
          name: formData.name,
          email: formData.email
        });

        if (result.success) {
          loadStaffData();
          setEditingStaff(null);
          setShowAddForm(false);
          resetForm();
        } else {
          setErrors({ general: result.message });
        }
      } else {
        // Create new staff member
        const result = createStaffMember(currentUser.id, {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        if (result.success) {
          loadStaffData();
          loadOrganizationStats();
          setShowAddForm(false);
          resetForm();
        } else {
          setErrors({ general: result.message });
        }
      }
      
      setIsLoading(false);
    }, 800);
  };

  const handleRemoveStaff = (staffMember) => {
    if (window.confirm(`Are you sure you want to remove ${staffMember.name} from your staff? This action cannot be undone.`)) {
      setIsLoading(true);
      
      setTimeout(() => {
        const result = removeStaffMember(currentUser.id, staffMember.id);
        
        if (result.success) {
          loadStaffData();
          loadOrganizationStats();
        } else {
          alert(result.message);
        }
        
        setIsLoading(false);
      }, 500);
    }
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      password: '',
      confirmPassword: ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setEditingStaff(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              Staff Management
            </h2>
            <p className="text-gray-600">Manage your team members and their access</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setShowAddForm(true);
                resetForm();
              }}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center space-x-2 font-semibold"
              disabled={isLoading}
            >
              <UserPlus className="h-5 w-5" />
              <span>Add Staff Member</span>
            </button>
          </div>
        </div>

        {/* Organization Stats */}
        {organizationStats && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Staff</p>
                  <p className="text-2xl font-bold text-purple-600">{organizationStats.totalStaff}</p>
                </div>
                <UserCheck className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Organization ID</p>
                  <p className="text-2xl font-bold text-purple-600">#{organizationStats.organizationId}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Since</p>
                  <p className="text-lg font-bold text-purple-600">
                    {new Date(organizationStats.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Staff Members ({filteredStaff.length})</h3>
        </div>
        
        {filteredStaff.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {staff.length === 0 ? 'No staff members yet' : 'No staff members match your search'}
            </h3>
            <p className="text-gray-500 mb-6">
              {staff.length === 0 
                ? 'Add your first staff member to get started with team management'
                : 'Try adjusting your search terms'
              }
            </p>
            {staff.length === 0 && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  resetForm();
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add First Staff Member
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredStaff.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{member.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {member.email}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Joined {new Date(member.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditStaff(member)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                      disabled={isLoading}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleRemoveStaff(member)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Staff Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                disabled={isLoading}
              >
                ×
              </button>
            </div>

            {errors.general && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter staff member's full name"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter staff member's email"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password (only for new staff) */}
              {!editingStaff && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Create password for staff member"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Confirm the password"
                      disabled={isLoading}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{editingStaff ? 'Updating...' : 'Adding...'}</span>
                    </div>
                  ) : (
                    <span>{editingStaff ? 'Update Staff Member' : 'Add Staff Member'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
