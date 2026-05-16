import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Receipt, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Eye,
  X,
  CheckCircle,
  Clock,
  MessageCircle,
  Download,
  Sparkles,
  BrainCircuit,
  LayoutGrid
} from 'lucide-react';
import ViewBillModal from './ViewBillModal';
import SignIn from './SignIn';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';
import StaffManagement from './StaffManagement';
import { 
  getCurrentUser, signOutUser, USER_ROLES, getAuthToken,
  getUserProducts, setUserProducts, getUserBills, setUserBills, 
  getUserStats, updateUserStats
} from './utils/userManager';
import { productsApi, billsApi, statsApi } from './utils/mockApi';
import { api, checkApiHealth } from './services/client';
import { getAvailableUnits, validateBillStock } from './utils/stockUtils';
import AIDashboard from './components/ai/AIDashboard';
import AIChatPanel from './components/ai/AIChatPanel';
import StockPredictionPanel from './components/ai/StockPredictionPanel';
import SmartSearchPanel from './components/ai/SmartSearchPanel';
import ReportsHub from './components/ai/ReportsHub';
import NotificationBell from './components/ai/NotificationBell';


const PRODUCT_CATEGORIES = [
  'Spices & Masalas',
  'Rice, Dal & Grains',
  'Bakery & Dairy',
  'Snacks & Biscuits',
  'Packaged Foods',
  'Edible Oils & Ghee',
  'Chocolates',
  'Beverages',
  'Personal Care',
  'Household Items',
  'Baby Products',
  'Hotel Amenities & Supplies',
  'Miscellaneous Items',
];

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [viewingBill, setViewingBill] = useState(null);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUserState] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Authentication functions
  const handleSignIn = (user) => {
    setCurrentUserState(user);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    setShowSignUp(false);
    setToast({ message: `Welcome back, ${user.name}!`, type: 'success' });
  };

  const handleSignUp = (user, message, signedInRemote = false) => {
    setShowSignUp(false);
    if (signedInRemote && user) {
      setCurrentUserState(user);
      setIsAuthenticated(true);
      setActiveTab('ai-dashboard');
    }
    setToast({ message: message || 'Account created successfully!', type: 'success' });
  };

  const handleSignOut = () => {
    signOutUser();
    setCurrentUserState(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setShowSignUp(false);
    setToast({ message: 'Signed out successfully', type: 'success' });
  };

  const handleSwitchToSignUp = () => {
    setShowSignUp(true);
  };

  const handleSwitchToSignIn = () => {
    setShowSignUp(false);
    setShowForgotPassword(false);
  };

  const handleSwitchToForgotPassword = () => {
    setShowForgotPassword(true);
    setShowSignUp(false);
  };

  // Helper functions for updating user data
  const updateUserProducts = useCallback((newProducts) => {
    if (!currentUser?.id) return false;
    
    try {
      setUserProducts(currentUser.id, newProducts);
      setProducts(newProducts);
      // Update stats after products change
      const newStats = updateUserStats(currentUser.id);
      setStats(newStats);
      return true;
    } catch (error) {
      console.error('Error updating user products:', error);
      return false;
    }
  }, [currentUser?.id]);

  const updateUserBills = useCallback((newBills) => {
    if (!currentUser?.id) return false;
    
    try {
      setUserBills(currentUser.id, newBills);
      setBills(newBills);
      // Update stats after bills change
      const newStats = updateUserStats(currentUser.id);
      setStats(newStats);
      return true;
    } catch (error) {
      console.error('Error updating user bills:', error);
      return false;
    }
  }, [currentUser?.id]);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = getCurrentUser();
        if (user && user.email) {
          setCurrentUserState(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        signOutUser();
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch user-specific products
  const fetchProducts = useCallback(async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const userProducts = await productsApi.getAll();
      setProducts(userProducts);
      setToast(null);
    } catch (error) {
      setToast({ message: `Error loading products: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  const fetchBills = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const userBills = await billsApi.getAll();
      setBills(userBills);
      setToast(null);
    } catch (error) {
      setToast({ message: `Error loading bills: ${error.message}`, type: 'error' });
    }
  }, [currentUser?.id]);

  const fetchStats = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const userStats = await statsApi.get();
      setStats(userStats);
      setToast(null);
    } catch (error) {
      setToast({ message: `Error loading stats: ${error.message}`, type: 'error' });
    }
  }, [currentUser?.id]);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated && currentUser?.id) {
      fetchProducts();
      fetchBills();
      fetchStats();
    }
  }, [isAuthenticated, currentUser?.id, fetchProducts, fetchBills, fetchStats]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (getAuthToken()) return;

    checkApiHealth()
      .then(() => {
        setToast({
          message:
            'API is online but you are in offline mode. Sign out and sign in again (use your MongoDB account) for stock sync & AI.',
          type: 'error',
        });
      })
      .catch(() => {
        setToast({
          message:
            'Backend not reachable at http://localhost:5000 — run "npm run dev" in the backend folder.',
          type: 'error',
        });
      });
  }, [isAuthenticated]);

  // Event listener for viewing bills from customer section
  useEffect(() => {
    const handleViewBill = (event) => {
      setViewingBill(event.detail);
    };

    window.addEventListener('viewBill', handleViewBill);
    return () => window.removeEventListener('viewBill', handleViewBill);
  }, []);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Spinner />
      </div>
    );
  }

  // Show SignIn/SignUp page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {showForgotPassword ? (
          <ForgotPassword 
            onBackToSignIn={handleSwitchToSignIn}
            darkMode={darkMode} 
          />
        ) : showSignUp ? (
          <SignUp 
            onSignUp={handleSignUp} 
            onSwitchToSignIn={handleSwitchToSignIn}
            darkMode={darkMode} 
          />
        ) : (
          <SignIn 
            onSignIn={handleSignIn} 
            onSwitchToSignUp={handleSwitchToSignUp}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
            darkMode={darkMode} 
          />
        )}
      </>
    );
  }

  return (
    <div className={
      `min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} font-sans transition-all duration-500 ease-in-out`
    }>
      {loading && <Spinner />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* Header */}
      <header className={`shadow-sm border-b transition-all duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} sticky top-0 z-40 backdrop-blur-sm bg-opacity-95`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Package className={`h-8 w-8 transition-all duration-300 ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:scale-110 hover:rotate-12`} />
              <div>
                <h1 className="text-2xl font-bold transition-all duration-300 hover:scale-105 tracking-tight">
                  Quickbill
                </h1>
                <p className={`text-[11px] uppercase tracking-[0.2em] ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Point of Sale System
                </p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-2 sm:space-x-8 items-center justify-center sm:justify-end">
              <button
                onClick={() => setActiveTab('ai-dashboard')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  activeTab === 'ai-dashboard'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>AI Hub</span>
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-100 text-blue-700 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Overview</span>
              </button>
              {/* Products - Only accessible by Owners */}
              {currentUser?.role === USER_ROLES.OWNER && (
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    activeTab === 'products' 
                      ? 'bg-blue-100 text-blue-700 shadow-md' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  <span>Products</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('billing')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  activeTab === 'billing' 
                    ? 'bg-blue-100 text-blue-700 shadow-md' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Receipt className="h-4 w-4" />
                <span>Billing</span>
              </button>
              <button
                onClick={() => setActiveTab('ai-chat')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  activeTab === 'ai-chat'
                    ? 'bg-fuchsia-100 text-fuchsia-800 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>AI Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('ai-stock')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  activeTab === 'ai-stock'
                    ? 'bg-cyan-100 text-cyan-800 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BrainCircuit className="h-4 w-4" />
                <span>Stock AI</span>
              </button>
              <button
                onClick={() => setActiveTab('ai-search')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  activeTab === 'ai-search'
                    ? 'bg-amber-100 text-amber-800 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Search className="h-4 w-4" />
                <span>Smart Search</span>
              </button>
              <button
                onClick={() => setActiveTab('ai-reports')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  activeTab === 'ai-reports'
                    ? 'bg-teal-100 text-teal-800 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Download className="h-4 w-4" />
                <span>Reports</span>
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  activeTab === 'customers'
                    ? 'bg-yellow-100 text-yellow-700 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>👤 Customers</span>
              </button>
              {/* Staff Management - Only accessible by Owners */}
              {currentUser?.role === USER_ROLES.OWNER && (
                <button
                  onClick={() => setActiveTab('staff')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    activeTab === 'staff'
                      ? 'bg-purple-100 text-purple-700 shadow-md'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>👥 Staff</span>
                </button>
              )}
              {getAuthToken() && (
                <NotificationBell darkMode={darkMode} />
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-3 py-2 rounded-md text-sm font-medium border transition-all duration-300 hover:scale-105 hover:shadow-lg ${darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                title="Toggle dark mode"
              >
                {darkMode ? '🌙 Dark' : '☀️ Light'}
              </button>
              
              {/* User Info & Sign Out */}
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-300">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <div className="font-medium">{currentUser?.name}</div>
                  <div className="text-xs">{currentUser?.role}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                  title="Sign out"
                >
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="animate-fadeIn">
        {activeTab === 'ai-dashboard' && <AIDashboard darkMode={darkMode} />}
        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats} 
            products={products} 
            bills={bills} 
            darkMode={darkMode} 
            setActiveTab={setActiveTab}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'ai-chat' && <AIChatPanel darkMode={darkMode} />}
        {activeTab === 'ai-stock' && <StockPredictionPanel darkMode={darkMode} />}
        {activeTab === 'ai-search' && <SmartSearchPanel darkMode={darkMode} />}
        {activeTab === 'ai-reports' && <ReportsHub darkMode={darkMode} />}
        {activeTab === 'products' && currentUser?.role === USER_ROLES.OWNER && (
          <ProductSection 
            products={products} 
            setProducts={setProducts}
            updateUserProducts={updateUserProducts}
            fetchProducts={fetchProducts}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'billing' && (
          <BillingSection 
            bills={bills} 
            setBills={setBills}
            products={products}
            updateUserBills={updateUserBills}
            fetchBills={fetchBills}
            fetchProducts={fetchProducts}
            fetchStats={fetchStats}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'customers' && (
            <CustomersSection 
              bills={bills} 
              updateUserBills={updateUserBills}
              fetchBills={fetchBills}
              currentUser={currentUser}
            />
        )}
        {activeTab === 'staff' && currentUser?.role === USER_ROLES.OWNER && (
          <StaffManagement 
            currentUser={currentUser}
            darkMode={darkMode}
          />
        )}
        </div>
      </main>

      {/* View Bill Modal */}
      {viewingBill && (
        <ViewBillModal
          bill={viewingBill}
          onClose={() => setViewingBill(null)}
        />
      )}
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ stats, products, bills, darkMode, setActiveTab }) => {
  const recentBills = bills.slice(0, 5);
  const lowStockProducts = products.filter(p => p.units < 10);
  const totalRevenue = stats.totalRevenue || 0;
  const monthlyRevenue = bills
    .filter(bill => {
      const billDate = new Date(bill.createdAt);
      const currentDate = new Date();
      return billDate.getMonth() === currentDate.getMonth() && 
             billDate.getFullYear() === currentDate.getFullYear();
    })
    .reduce((sum, bill) => sum + bill.totalAmount, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Operational pulse for your Quickbill workspace — billing, stock, and AI insights.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts || 0}
          icon={<Package className="h-6 w-6" />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          darkMode={darkMode}
          onClick={() => setActiveTab('products')}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Total Bills"
          value={stats.totalBills || 0}
          icon={<Receipt className="h-6 w-6" />}
          color="bg-gradient-to-br from-green-500 to-green-600"
          darkMode={darkMode}
          onClick={() => setActiveTab('billing')}
          trend="+8%"
          trendUp={true}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          darkMode={darkMode}
          onClick={() => setActiveTab('billing')}
          trend="+15%"
          trendUp={true}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="bg-gradient-to-br from-red-500 to-red-600"
          darkMode={darkMode}
          onClick={() => setActiveTab('products')}
          trend=""
          trendUp={false}
        />
      </div>

      {/* Monthly Revenue Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Monthly Revenue</h3>
            <p className="text-3xl font-bold">₹{monthlyRevenue.toLocaleString()}</p>
            <p className="text-indigo-100 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl mb-1">📈</div>
            <div className="text-sm text-indigo-100">This Month</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bills */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bills</h3>
                <button
                  onClick={() => setActiveTab('billing')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
                >
                  View All →
                </button>
              </div>
            </div>
            <div className="p-6">
            {recentBills.length > 0 ? (
                <div className="space-y-4">
                  {recentBills.map((bill, index) => (
                    <div 
                      key={bill.id || bill._id || bill.billNumber} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 cursor-pointer border border-gray-200 hover:border-blue-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-blue-600" />
                        </div>
                  <div>
                          <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200">
                            {bill.billNumber}
                          </p>
                    <p className="text-sm text-gray-500">{bill.customerName}</p>
                  </div>
                </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">₹{bill.totalAmount}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(bill.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-gray-500">No bills yet</p>
                  <button
                    onClick={() => setActiveTab('billing')}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Create First Bill
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => setActiveTab('billing')}
                className="w-full flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-200 hover:scale-105 text-left"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create Bill</p>
                  <p className="text-sm text-gray-500">Generate new invoice</p>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('products')}
                className="w-full flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 hover:scale-105 text-left"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add Product</p>
                  <p className="text-sm text-gray-500">Add new inventory</p>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('customers')}
                className="w-full flex items-center space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-200 hover:scale-105 text-left"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">👤</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Customers</p>
                  <p className="text-sm text-gray-500">Manage customer data</p>
                </div>
              </button>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
            </div>
            <div className="p-6">
              {lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 5).map((product, index) => (
                    <div 
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 animate-pulse"
                      style={{ animationDelay: `${index * 200}ms` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-red-600">Only {product.units} left</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{lowStockProducts.length - 5} more items
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="text-gray-500">All items in stock</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <span className="text-sm text-gray-500">This Month</span>
          </div>
          <div className="space-y-3">
            {products.slice(0, 3).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{product.name}</span>
                </div>
                <span className="text-sm text-gray-500">₹{product.price}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Status</h3>
            <span className="text-sm text-gray-500">Overview</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Paid</span>
              <span className="font-semibold text-green-600">
                {bills.filter(b => b.paymentStatus === 'paid').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">
                {bills.filter(b => b.paymentStatus === 'pending').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Partial</span>
              <span className="font-semibold text-blue-600">
                {bills.filter(b => b.paymentStatus === 'partial').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            <span className="text-sm text-green-500">● Online</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="text-green-500">● Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Status</span>
              <span className="text-green-500">● Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Backup</span>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, darkMode, onClick, trend, trendUp }) => (
  <button
    className={`rounded-lg shadow-lg p-6 w-full text-left transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fadeIn focus:outline-none focus:ring-4 focus:ring-opacity-50 ${color} ${darkMode ? 'text-gray-100' : 'text-white'}`}
    style={{ minHeight: 120 }}
    onClick={onClick}
    tabIndex={0}
    aria-label={title}
  >
    <div className="flex items-center">
      <div className="rounded-lg p-3 bg-white bg-opacity-20 mr-4 transition-all duration-300 hover:scale-110 hover:rotate-3">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium transition-all duration-200">{title}</p>
        <p className="text-2xl font-semibold transition-all duration-200">{value}</p>
        {trend && (
          <p className={`text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  </button>
);

// Product Section Component
const ProductSection = ({ products, setProducts, fetchProducts }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'price' || sortBy === 'units') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    } else {
      aValue = (aValue || '').toLowerCase();
      bValue = (bValue || '').toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleCategoryClick = (category) => {
    if (selectedCategory === category) {
      setSelectedCategory(''); // Clear filter if same category clicked
    } else {
      setSelectedCategory(category);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsApi.delete(id);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Spices & Masalas': '🌶️',
      'Rice, Dal & Grains': '🌾',
      'Bakery & Dairy': '🥛',
      'Snacks & Biscuits': '🍪',
      'Packaged Foods': '📦',
      'Edible Oils & Ghee': '🫒',
      'Chocolates': '🍫',
      'Beverages': '🥤',
      'Personal Care': '🧴',
      'Household Items': '🏠',
      'Baby Products': '👶',
      'Hotel Amenities & Supplies': '🏨',
      'Miscellaneous Items': '📋'
    };
    return icons[category] || '📦';
  };

  const lowStockProducts = products.filter(p => p.units < 10);
  const outOfStockProducts = products.filter(p => p.units === 0);
  const highStockProducts = products.filter(p => p.units >= 50).sort((a, b) => b.units - a.units);
  const expiringProducts = products.filter(p => {
    if (!p.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(p.expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  });
  const expiredProducts = products.filter(p => {
    if (!p.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(p.expiryDate);
    return expiry < today;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              Product Inventory
            </h2>
            <p className="text-gray-600">Manage your store's product catalog and inventory</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-3">
              {/* Stock Status Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>In Stock: {products.filter(p => p.units > 10).length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Low Stock: {lowStockProducts.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Out of Stock: {outOfStockProducts.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>High Stock: {highStockProducts.length}</span>
                </div>
              </div>
              {/* Expiry Status Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Expiring Soon: {expiringProducts.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span>Expired: {expiredProducts.length}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 flex items-center space-x-2 font-semibold text-lg disabled:opacity-50 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50"
              disabled={formLoading}
            >
              <Plus className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            />
          </div>

          {/* Sort */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
              <option value="price">Sort by Price</option>
              <option value="units">Sort by Stock</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-end space-x-4 text-sm">
            <span className="text-gray-600">Total: <span className="font-semibold text-blue-600">{products.length}</span></span>
            <span className="text-gray-600">Showing: <span className="font-semibold text-green-600">{filteredProducts.length}</span></span>
          </div>
        </div>
      </div>

      {/* Enhanced Categories Display */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-700 mr-2 animate-fadeIn">Filter by Category:</span>
          {PRODUCT_CATEGORIES.map((category, index) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 hover:scale-105 cursor-pointer animate-fadeIn ${
                selectedCategory === category 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg transform scale-105' 
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:shadow-md hover:border-gray-300'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="mr-2">{getCategoryIcon(category)}</span>
              {category}
            </button>
          ))}
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-all duration-300 hover:scale-105 cursor-pointer animate-fadeIn"
            >
              ✕ Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Product Count and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-xl shadow-lg border border-gray-100 p-4">
        <div className="text-sm text-gray-600 mb-2 sm:mb-0">
          {selectedCategory ? (
            <span>
              Showing <span className="font-semibold text-blue-600">{filteredProducts.length}</span> products in 
              <span className="font-semibold text-blue-600 ml-1">"{selectedCategory}"</span>
            </span>
          ) : (
            <span>
              Showing <span className="font-semibold text-blue-600">{filteredProducts.length}</span> of <span className="font-semibold text-gray-700">{products.length}</span> products
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
            >
              View All Products
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-green-600 hover:text-green-800 underline transition-colors duration-200"
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* Enhanced Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={(product) => {
              setEditingProduct(product);
              setShowForm(true);
            }}
            onDelete={() => handleDelete(product.id)}
            index={index}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first product'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Add Your First Product
          </button>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSave={async () => {
            setFormLoading(true);
            try {
              await fetchProducts();
              setToast({ message: editingProduct ? 'Product updated successfully!' : 'Product added successfully!', type: 'success' });
            } catch {
              setToast({ message: 'Error saving product', type: 'error' });
            } finally {
              setFormLoading(false);
            }
          }}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onEdit, onDelete, index }) => {
  const getStockStatus = (units) => {
    if (units === 0) return { status: 'Out of Stock', color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50' };
    if (units < 10) return { status: 'Low Stock', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { status: 'In Stock', color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50' };
  };
  
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'Expired', color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50' };
    if (daysUntilExpiry <= 7) return { status: `Expires in ${daysUntilExpiry} days`, color: 'bg-orange-500', textColor: 'text-orange-600', bgColor: 'bg-orange-50' };
    if (daysUntilExpiry <= 30) return { status: `Expires in ${daysUntilExpiry} days`, color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { status: `Expires in ${daysUntilExpiry} days`, color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50' };
  };
  
  const getStockUsagePercent = () => {
    const initialStock = product.initialStock || product.units;
    const currentStock = product.units;
    if (initialStock <= 0) return 0;
    return Math.round(((initialStock - currentStock) / initialStock) * 100);
  };

  const stockInfo = getStockStatus(product.units);
  const expiryInfo = getExpiryStatus(product.expiryDate);
  const usagePercent = getStockUsagePercent();

  return (
    <div 
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 border border-gray-100 hover:border-blue-300 group relative overflow-hidden animate-fadeIn"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Status Badges */}
      <div className="absolute top-4 right-4 flex flex-col items-end space-y-1">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${stockInfo.color}`}></div>
          <span className={`text-xs font-medium ${stockInfo.textColor}`}>
            {stockInfo.status}
          </span>
        </div>
        {expiryInfo && (
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${expiryInfo.color}`}></div>
            <span className={`text-xs font-medium ${expiryInfo.textColor}`}>
              {expiryInfo.status}
            </span>
          </div>
        )}
      </div>

      {/* Product Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-1">
            {product.name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
              {product.category}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">
              {product.weight} {product.weightUnit || 'kg'}
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <button
            onClick={() => onEdit(product)}
            className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-all duration-200 hover:scale-110 shadow-sm"
            title="Edit Product"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50 transition-all duration-200 hover:scale-110 shadow-sm"
            title="Delete Product"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Product Details */}
      <div className="space-y-3">
        {/* Price */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 group-hover:border-green-200 transition-all duration-200">
          <span className="text-sm font-medium text-gray-700">Price</span>
          <span className="text-xl font-bold text-green-600 group-hover:text-green-700 transition-colors duration-200">
            ₹{product.price}
          </span>
        </div>

        {/* Stock Level */}
        <div className={`flex items-center justify-between p-3 rounded-lg ${stockInfo.bgColor} border transition-all duration-200 ${
          product.units === 0 ? 'border-red-200' : 
          product.units < 10 ? 'border-yellow-200' : 'border-green-200'
        }`}>
          <span className="text-sm font-medium text-gray-700">Stock Level</span>
          <div className="flex items-center space-x-2">
            <span className={`font-bold text-lg ${stockInfo.textColor}`}>
              {product.units}
            </span>
            {product.units < 10 && product.units > 0 && (
              <span className="text-xs text-yellow-600 animate-pulse">⚠️</span>
            )}
            {product.units === 0 && (
              <span className="text-xs text-red-600">🚫</span>
            )}
          </div>
        </div>

        {/* Stock Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Stock Level</span>
            <span>{product.units} units</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                product.units === 0 ? 'bg-red-500' :
                product.units < 10 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((product.units / Math.max(product.initialStock || product.units, 1)) * 100, 100)}%` }}
            ></div>
          </div>
          
          {/* Stock Analytics */}
          {product.initialStock && product.initialStock !== product.units && (
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Initial Stock:</span>
                <span className="font-medium">{product.initialStock} units</span>
              </div>
              <div className="flex justify-between">
                <span>Used:</span>
                <span className="font-medium text-red-600">{product.initialStock - product.units} units ({usagePercent}%)</span>
              </div>
              {product.stockAddedDate && (
                <div className="flex justify-between">
                  <span>Added on:</span>
                  <span className="font-medium">{new Date(product.stockAddedDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Expiry Date Information */}
          {product.expiryDate && (
            <div className={`text-xs p-2 rounded ${expiryInfo?.bgColor || 'bg-gray-50'} border ${expiryInfo?.color?.replace('bg-', 'border-') || 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium">Expiry Date:</span>
                <span className={`${expiryInfo?.textColor || 'text-gray-600'} font-bold`}>
                  {new Date(product.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all duration-200 hover:scale-105"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-100 transition-all duration-200 hover:scale-105"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

// Product Form Component
const ProductForm = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    units: product?.units || '',
    weight: product?.weight || '',
    weightUnit: product?.weightUnit || 'kg',
    price: product?.price || '',
    cost: product?.cost ?? '',
    category: product?.category || '',
    description: product?.description || '',
    expiryDate: product?.expiryDate || '',
    initialStock: product?.initialStock || product?.units || '',
    stockAddedDate: product?.stockAddedDate || new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});

  const validateStep = (currentStep) => {
    const errors = {};
    
    if (currentStep >= 1) {
      if (!formData.name.trim()) errors.name = 'Product name is required';
      if (!formData.category) errors.category = 'Please select a category';
    }
    
    if (currentStep >= 2) {
      if (!formData.units || formData.units <= 0) errors.units = 'Stock units must be greater than 0';
      if (!formData.weight || formData.weight <= 0) errors.weight = 'Weight must be greater than 0';
      if (!formData.price || formData.price <= 0) errors.price = 'Price must be greater than 0';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const generateWithAi = async () => {
    if (!formData.name.trim()) {
      window.alert('Enter a product name first.');
      return;
    }
    setAiBusy(true);
    try {
      const { data } = await api.post('/ai/product-description', {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price) || 0,
        weight: Number(formData.weight) || 0,
        description: formData.description,
      });
      setFormData((fd) => ({
        ...fd,
        description: data.description || fd.description,
      }));
    } catch (err) {
      window.alert(err.response?.data?.message || err.message);
    } finally {
      setAiBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(2)) return;
    
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        units: Number(formData.units),
        weight: Number(formData.weight),
        price: Number(formData.price),
        category: formData.category,
        description: formData.description || '',
        cost: formData.cost === '' ? 0 : Number(formData.cost),
      };
      if (product) {
        await productsApi.update(product.id, payload);
      } else {
        await productsApi.create(payload);
      }
      await onSave();
      onClose();
    } catch (err) {
      setError('Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Spices & Masalas': '🌶️',
      'Rice, Dal & Grains': '🌾',
      'Bakery & Dairy': '🥛',
      'Snacks & Biscuits': '🍪',
      'Packaged Foods': '📦',
      'Edible Oils & Ghee': '🫒',
      'Chocolates': '🍫',
      'Beverages': '🥤',
      'Personal Care': '🧴',
      'Household Items': '🏠',
      'Baby Products': '👶',
      'Hotel Amenities & Supplies': '🏨',
      'Miscellaneous Items': '📋'
    };
    return icons[category] || '📦';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl animate-scaleIn">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center ring-2 ring-white/30">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {product ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {product ? 'Update your product information' : 'Create a new product for your inventory'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white hover:bg-white/20 p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4 mt-6">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step >= 1 ? 'bg-white text-blue-600' : 'bg-white/20 text-white/70'
                }`}>
                  1
                </div>
                <span className="text-white/90 text-sm font-medium">Basic Info</span>
              </div>
              <div className={`h-0.5 w-12 transition-all duration-300 ${
                step >= 2 ? 'bg-white' : 'bg-white/30'
              }`}></div>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step >= 2 ? 'bg-white text-blue-600' : 'bg-white/20 text-white/70'
                }`}>
                  2
                </div>
                <span className="text-white/90 text-sm font-medium">Details & Pricing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-3 animate-shake">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium">Error occurred</p>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Product Information</h4>
                  <p className="text-gray-600">Let's start with the basic details of your product</p>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <span>Product Name</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (validationErrors.name) {
                        setValidationErrors({ ...validationErrors, name: '' });
                      }
                    }}
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-base placeholder-gray-400 ${
                      validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Enter product name (e.g., Basmati Rice, Olive Oil)"
                  />
                  {validationErrors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{validationErrors.name}</span>
                    </p>
                  )}
                </div>
                
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <span>Product Category</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto border-2 rounded-xl p-4 ${
                    validationErrors.category ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, category: cat });
                          if (validationErrors.category) {
                            setValidationErrors({ ...validationErrors, category: '' });
                          }
                        }}
                        className={`flex items-center space-x-3 p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md border-2 ${
                          formData.category === cat 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500 text-white shadow-lg scale-[1.02]' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{getCategoryIcon(cat)}</span>
                        <span className="text-sm font-medium">{cat}</span>
                        {formData.category === cat && (
                          <CheckCircle className="h-5 w-5 text-white ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                  {validationErrors.category && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{validationErrors.category}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Details & Pricing */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Inventory & Pricing</h4>
                  <p className="text-gray-600">Set stock quantities, weight, and pricing information</p>
                </div>

                {/* Selected Category Display */}
                {formData.category && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryIcon(formData.category)}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{formData.name || 'Product Name'}</p>
                        <p className="text-sm text-gray-600">{formData.category}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Stock and Weight Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                      <span>Stock Units</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.units}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setFormData({ 
                          ...formData, 
                          units: newValue,
                          initialStock: !product ? newValue : formData.initialStock
                        });
                        if (validationErrors.units) {
                          setValidationErrors({ ...validationErrors, units: '' });
                        }
                      }}
                      className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-base ${
                        validationErrors.units ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                      }`}
                      placeholder="0"
                    />
                    {!product && (
                      <p className="text-xs text-blue-600 mt-2 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>This will be set as initial stock</span>
                      </p>
                    )}
                    {validationErrors.units && (
                      <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{validationErrors.units}</span>
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                      <span>Weight</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.weight}
                        onChange={(e) => {
                          setFormData({ ...formData, weight: e.target.value });
                          if (validationErrors.weight) {
                            setValidationErrors({ ...validationErrors, weight: '' });
                          }
                        }}
                        className={`flex-1 px-4 py-4 border-2 rounded-l-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-base ${
                          validationErrors.weight ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                        }`}
                        placeholder="0.00"
                      />
                      <select
                        value={formData.weightUnit}
                        onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}
                        className="px-4 py-4 border-2 border-l-0 rounded-r-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-base bg-gray-50 border-gray-300"
                      >
                        <option value="kg">kg</option>
                        <option value="gram">gram</option>
                        <option value="liter">liter</option>
                        <option value="ml">ml</option>
                        <option value="piece">piece</option>
                      </select>
                    </div>
                    {validationErrors.weight && (
                      <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{validationErrors.weight}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <span>Selling Price</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-semibold">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value });
                        if (validationErrors.price) {
                          setValidationErrors({ ...validationErrors, price: '' });
                        }
                      }}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-base ${
                        validationErrors.price ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {validationErrors.price && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{validationErrors.price}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Cost price (optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border-2 rounded-xl border-gray-300 bg-gray-50"
                        placeholder="For profit analytics"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={generateWithAi}
                      disabled={aiBusy}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      {aiBusy ? 'Generating…' : 'Generate description with AI'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-sm"
                    placeholder="Editable AI-assisted description…"
                  />
                </div>
                
                {/* Optional Dates Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-base bg-gray-50"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-2">Leave empty if no expiry date</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Stock Added Date
                    </label>
                    <input
                      type="date"
                      value={formData.stockAddedDate}
                      onChange={(e) => setFormData({ ...formData, stockAddedDate: e.target.value })}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-base bg-gray-50"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105 font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105 font-medium flex items-center space-x-2"
                  disabled={submitting}
                >
                  <span>← Back</span>
                </button>
              )}
              
              <div className="flex space-x-3">
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <span>Next Step</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 disabled:opacity-50 transition-all duration-200 hover:scale-105 font-medium shadow-lg hover:shadow-xl"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>{product ? 'Update Product' : 'Create Product'}</span>
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Billing Section Component
const BillingSection = ({
  bills,
  setBills,
  products,
  fetchBills,
  fetchProducts,
  fetchStats,
  currentUser,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [viewingBill, setViewingBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);

  const filteredBills = bills.filter(bill => {
    const matchesSearch = (bill.billNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (bill.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (bill.customerPhone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || (bill.paymentStatus || 'pending') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort bills
  const sortedBills = [...filteredBills].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'amount':
        aValue = a.totalAmount;
        bValue = b.totalAmount;
        break;
      case 'customer':
        aValue = (a.customerName || '').toLowerCase();
        bValue = (b.customerName || '').toLowerCase();
        break;
      case 'status':
        aValue = a.paymentStatus || 'pending';
        bValue = b.paymentStatus || 'pending';
        break;
      default: // date
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      setIsLoading(true);
      try {
        await billsApi.delete(id);
        await fetchBills();
        await fetchProducts();
        if (fetchStats) await fetchStats();
      } catch (error) {
        console.error('Error deleting bill:', error);
        alert('Error deleting bill. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
      case 'partial': return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
      default: return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
    }
  };

  const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const paidAmount = bills.filter(b => b.paymentStatus === 'paid').reduce((sum, bill) => sum + bill.totalAmount, 0);
  const pendingAmount = bills.filter(b => b.paymentStatus !== 'paid').reduce((sum, bill) => sum + bill.totalAmount, 0);

  // Calculate additional stats
  const todayBills = bills.filter(bill => {
    const today = new Date().toDateString();
    return new Date(bill.createdAt).toDateString() === today;
  });
  const todayRevenue = todayBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

  // Export bills to CSV
  const exportBillsToCSV = () => {
    if (bills.length === 0) {
      alert('No bills data to export!');
      return;
    }

    // CSV headers
    let csv = 'Bill Number,Date,Time,Customer Name,Customer Phone,Payment Status,Payment Method,Total Amount,Items Count,Item Details\n';
    
    // Add each bill to CSV
    bills.forEach(bill => {
      const billDate = new Date(bill.createdAt);
      const dateStr = billDate.toLocaleDateString();
      const timeStr = billDate.toLocaleTimeString();
      
      // Format items details
      const itemsDetails = (bill.items || []).map(item => 
        `${item.productName || 'Unknown'} (Qty: ${item.quantity || 0} @ ₹${item.unitPrice || 0})`
      ).join('; ');
      
      // Escape commas and quotes in text fields
      const escapeCsvField = (field) => {
        if (field == null) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      csv += `${escapeCsvField(bill.billNumber || 'N/A')},${dateStr},${timeStr},${escapeCsvField(bill.customerName || 'Unknown')},${escapeCsvField(bill.customerPhone || 'N/A')},${escapeCsvField(bill.paymentStatus || 'pending')},${escapeCsvField(bill.paymentMethod || 'cash')},${bill.totalAmount || 0},${(bill.items || []).length},"${itemsDetails}"\n`;
    });
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Enhanced Header with Stats */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <Receipt className="h-8 w-8 text-green-600 mr-3" />
              Billing Management
            </h2>
            <p className="text-gray-600">Create and manage customer invoices and payments</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Download CSV Button - Only visible to Owners */}
            {currentUser?.role === 'Owner' && (
              <button
                onClick={exportBillsToCSV}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center space-x-2 font-semibold text-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50"
                title="Download all bills data as CSV"
              >
                <Download className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                <span>Download CSV</span>
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center space-x-2 font-semibold text-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-opacity-50"
            >
              <Plus className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
              <span>Create Bill</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{paidAmount.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-red-600">₹{pendingAmount.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-blue-600">₹{todayRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search bills, customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
          </select>

          {/* Sort */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="customer">Sort by Customer</option>
              <option value="status">Sort by Status</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-end space-x-4 text-sm">
            <span className="text-gray-600">Total: <span className="font-semibold text-green-600">{bills.length}</span></span>
            <span className="text-gray-600">Showing: <span className="font-semibold text-blue-600">{filteredBills.length}</span></span>
          </div>
        </div>
      </div>

      {/* Enhanced Bills Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Bill Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Customer Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                {currentUser?.role === USER_ROLES.OWNER && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created By
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedBills.length === 0 ? (
                <tr>
                  <td colSpan={currentUser?.role === USER_ROLES.OWNER ? "7" : "6"} className="px-6 py-12 text-center">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No bills found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'Create your first bill to get started'
                      }
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        Create First Bill
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                sortedBills.map((bill, index) => {
                  const statusColors = getStatusColor(bill.paymentStatus);
                  return (
                    <tr key={bill.id} className="hover:bg-gray-50 transition-all duration-200 hover:shadow-sm animate-fadeIn group" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <Receipt className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                              {bill.billNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {bill.items?.length || 0} items
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                            {bill.customerName}
                          </div>
                          <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
                            📱 {bill.customerPhone || 'No phone'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-green-600 group-hover:text-green-700 transition-colors duration-200">
                          ₹{bill.totalAmount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-200 hover:scale-105 ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                          {bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}
                        </span>
                      </td>
                      {currentUser?.role === USER_ROLES.OWNER && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                              bill.createdByRole === USER_ROLES.OWNER 
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {bill.createdByRole === USER_ROLES.OWNER ? '👑' : '👤'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {bill.createdBy || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {bill.createdByRole || 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                        <div>
                          <div className="font-medium">
                            {new Date(bill.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(bill.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setViewingBill(bill)}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 hover:scale-110 transition-all duration-200 shadow-md text-white relative group"
                            title="View Bill Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {bill.customerPhone && (
                            <a
                              href={`https://wa.me/91${bill.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Hello ${bill.customerName},\nHere are your bill details:\nBill No: ${bill.billNumber}\nAmount: ₹${bill.totalAmount}\nStatus: ${bill.paymentStatus}\nThank you for shopping with us!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 hover:scale-110 transition-all duration-200 shadow-md text-white"
                              title="Send bill via WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(bill.id)}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 hover:scale-110 transition-all duration-200 shadow-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Bill"
                          >
                            {isLoading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Form Modal */}
      {showForm && (
        <BillForm
          bill={editingBill}
          products={products}
          bills={bills}
          onClose={() => {
            setShowForm(false);
            setEditingBill(null);
          }}
          onSave={async () => {
            await fetchBills();
            await fetchProducts();
            if (fetchStats) await fetchStats();
            setShowForm(false);
            setEditingBill(null);
          }}
        />
      )}

      {/* View Bill Modal */}
      {viewingBill && (
        <ViewBillModal
          bill={viewingBill}
          onClose={() => setViewingBill(null)}
        />
      )}
    </div>
  );
};

// Bill Form Component
const BillForm = ({ bill, products, bills, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    customerName: bill?.customerName || '',
    customerPhone: bill?.customerPhone || '',
    paymentMethod: bill?.paymentMethod || 'cash',
    paymentStatus: bill?.paymentStatus || 'pending',
    items: bill?.items || []
  });
  const [newItem, setNewItem] = useState({ productId: '', quantity: 1 });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [customerType, setCustomerType] = useState(bill?.customerName && bill?.customerPhone ? 'existing' : 'new');
  const [step, setStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});
  const [paymentStepReady, setPaymentStepReady] = useState(false);

  useEffect(() => {
    if (step !== 3) {
      setPaymentStepReady(false);
      return undefined;
    }
    setPaymentStepReady(false);
    const timer = setTimeout(() => setPaymentStepReady(true), 350);
    return () => clearTimeout(timer);
  }, [step]);

  // Get unique customers from existing bills
  const existingCustomers = React.useMemo(() => {
    const customers = new Map();
    bills.forEach(bill => {
      if (bill.customerName && bill.customerPhone) {
        const key = `${bill.customerName}-${bill.customerPhone}`;
        if (!customers.has(key)) {
          customers.set(key, {
            name: bill.customerName,
            phone: bill.customerPhone
          });
        }
      }
    });
    return Array.from(customers.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [bills]);

  // Handle customer type change
  const handleCustomerTypeChange = (type) => {
    setCustomerType(type);
    setFormErrors({});
    if (type === 'existing') {
      setFormData({ ...formData, customerName: '', customerPhone: '' });
    } else {
      setFormData({ ...formData, customerName: '', customerPhone: '' });
    }
  };

  // Handle existing customer select
  const handleExistingCustomerSelect = (customerKey) => {
    if (customerKey) {
      const [name, phone] = customerKey.split(' - ');
      setFormData({ ...formData, customerName: name, customerPhone: phone });
    } else {
      setFormData({ ...formData, customerName: '', customerPhone: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    const warnings = {};
    
    // Customer validation (these are now warnings, not blocking errors)
    if (customerType === 'new') {
      if (!formData.customerName.trim()) {
        warnings.customerName = 'Customer name is recommended';
      } else if (formData.customerName.trim().length < 2) {
        errors.customerName = 'Customer name must be at least 2 characters long';
      }
      
      if (!formData.customerPhone.trim()) {
        warnings.customerPhone = 'Phone number is recommended for bill records';
      } else {
        const cleanPhone = formData.customerPhone.replace(/\D/g, '');
        if (cleanPhone.length > 0 && cleanPhone.length < 10) {
          warnings.customerPhone = `Phone number seems short (${cleanPhone.length} digits). Indian numbers usually have 10 digits.`;
        } else if (cleanPhone.length > 10) {
          warnings.customerPhone = `Phone number seems long (${cleanPhone.length} digits). Indian numbers usually have 10 digits.`;
        }
        // Remove the strict validation that blocks submission
      }
    } else {
      if (!formData.customerName || !formData.customerPhone) {
        warnings.existingCustomer = 'Please select a customer for better record keeping';
      }
    }
    
    // Items validation (this is required)
    if (!formData.items || formData.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      const stockCheck = validateBillStock(products, formData.items);
      if (!stockCheck.ok) {
        errors.items = stockCheck.message;
      }
    }

    setFormErrors({ ...errors, ...warnings });
    // Only return false for actual errors, not warnings
    return Object.keys(errors).length === 0;
  };

  const addItem = () => {
    if (!newItem.productId) return;

    const product = products.find(
      (p) => String(p.id) === String(newItem.productId)
    );
    if (!product) return;

    const qty = Number(newItem.quantity);
    if (!qty || qty < 1) {
      setFormErrors({ ...formErrors, items: 'Quantity must be at least 1.' });
      return;
    }

    const available = getAvailableUnits(
      products,
      product.id,
      formData.items
    );
    if (qty > available) {
      setFormErrors({
        ...formErrors,
        items: `Only ${available} unit(s) of "${product.name}" available (you entered ${qty}).`,
      });
      return;
    }

    const item = {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice: Number(product.price),
      totalPrice: Number(product.price) * qty,
    };

    setFormData({
      ...formData,
      items: [...formData.items, item],
    });

    setNewItem({ productId: '', quantity: 1 });
    setFormErrors({ ...formErrors, items: null });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);

  const goToStep = (next) => {
    if (next === 3) setPaymentStepReady(false);
    setStep(next);
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (step !== 3) {
      return;
    }

    if (!paymentStepReady) {
      return;
    }

    if (submitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    setBackendError('');
    
    const isValid = validateForm();
    console.log('Validation result:', isValid, { formErrors });
    
    if (!isValid) {
      console.log('Validation failed, not proceeding');
      return;
    }
    
    console.log('Validation passed, starting submission...');
    setSubmitting(true);
    try {
      // Only send required fields, do NOT send billNumber
      const billData = {
        customerName: formData.customerName || 'Walk-in Customer',
        customerPhone: formData.customerPhone || '',
        items: formData.items.map(item => ({
          productId: typeof item.productId === 'object' ? (item.productId.id || item.productId._id) : item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })),
        totalAmount,
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod
      };
      
      console.log('Bill data to be sent:', billData);

      // Use mock API
      const isEdit = !!bill && !!bill.id;
      console.log('Is edit mode:', isEdit);
      
      if (isEdit) {
        console.log('Updating existing bill...');
        const updatedBill = await billsApi.update(bill.id, billData);
        console.log('Bill updated:', updatedBill);
      } else {
        console.log('Creating new bill...');
        const createdBill = await billsApi.create(billData);
        console.log('Bill created:', createdBill);
      }
      
      console.log('Bill creation successful! Calling callbacks...');
      
      await onSave();
      onClose();
    } catch (error) {
      console.error('Error creating/updating bill:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        formData,
        totalAmount
      });
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Network error. Start backend with: cd backend && npm run dev';
      setBackendError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Pure validation for button disabling (does NOT set state)
  // eslint-disable-next-line no-unused-vars
  const isFormValid = () => {
    // Allow button to be enabled if at least items are added
    if (!formData.items || formData.items.length === 0) return false;
    return true;
  };

  const validateStep = (currentStep) => {
    console.log('validateStep called for step:', currentStep, 'with data:', { items: formData.items.length, customerType, customerName: formData.customerName, step });
    const errors = {};
    
    // Only validate step 1 - step 2 and 3 should always be accessible
    if (currentStep === 1) {
      if (formData.items.length === 0) {
        errors.items = 'Please add at least one item to your bill before continuing. Use the "Add New Item" section above to select products.';
      } else {
        const stockCheck = validateBillStock(products, formData.items);
        if (!stockCheck.ok) errors.items = stockCheck.message;
      }
    }

    console.log('Validation errors:', errors);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // eslint-disable-next-line no-unused-vars
  const handleNextStep = () => {
    console.log('handleNextStep called, current step:', step);
    if (validateStep(step)) {
      goToStep(step + 1);
    } else {
      console.log('Step validation failed, staying on step:', step);
    }
  };

  const handlePrevStep = () => {
    goToStep(step - 1);
  };

  const getStepIcon = (stepNum) => {
    if (stepNum === 1) return <Receipt className="h-6 w-6" />;
    if (stepNum === 2) return <MessageCircle className="h-6 w-6" />;
    if (stepNum === 3) return <DollarSign className="h-6 w-6" />;
    return <CheckCircle className="h-6 w-6" />;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl animate-scaleIn">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 px-6 py-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center ring-2 ring-white/30">
                  <Receipt className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {bill ? 'Edit Bill' : 'Create New Bill'}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {bill ? 'Update bill information' : 'Generate a new invoice for your customer'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white hover:bg-white/20 p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-8 max-w-md">
              {[1, 2, 3].map((stepNum, index) => (
                <React.Fragment key={stepNum}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step >= stepNum 
                        ? 'bg-white text-green-600 shadow-lg' 
                        : 'bg-white/20 text-white/70'
                    }`}>
                      {step > stepNum ? <CheckCircle className="h-5 w-5" /> : getStepIcon(stepNum)}
                    </div>
                    <span className="text-white/90 text-sm font-medium hidden sm:block">
                      {stepNum === 1 && 'Items'}
                      {stepNum === 2 && 'Customer'}
                      {stepNum === 3 && 'Payment'}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`h-0.5 w-16 transition-all duration-300 ${
                      step > stepNum ? 'bg-white' : 'bg-white/30'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
          {(backendError || formErrors.submit) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-3 animate-shake">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium">Error occurred</p>
                <p className="text-red-600">{backendError || formErrors.submit}</p>
              </div>
            </div>
          )}
          <form 
            onSubmit={(e) => e.preventDefault()} 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            {/* Step 1: Add Items */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Receipt className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Add Items to Bill</h4>
                  <p className="text-gray-600">Start by adding at least one product to create your bill</p>
                  <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    💡 <strong>Step 1 of 3:</strong> Add products → Customer info → Payment details
                  </div>
                  <div className="mt-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    🐛 Debug: Currently on Step {step} of 3 - Add Items
                  </div>
                </div>

                {/* Add Items Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-blue-600" />
                    <span>Add New Item</span>
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Select Product
                      </label>
                      <select
                        value={newItem.productId}
                        onChange={(e) => setNewItem({ ...newItem, productId: e.target.value })}
                        className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-base bg-white"
                      >
                        <option value="">🛍️ Choose a product...</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            📦 {product.name} - ₹{product.price} (Stock: {product.units})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Quantity
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          min="1"
                          max={
                            newItem.productId
                              ? getAvailableUnits(
                                  products,
                                  newItem.productId,
                                  formData.items
                                ) || 1
                              : undefined
                          }
                          value={newItem.quantity}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              quantity: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="flex-1 px-4 py-4 border-2 border-gray-300 rounded-l-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-base"
                          placeholder="1"
                        />
                        <button
                          type="button"
                          onClick={addItem}
                          disabled={!newItem.productId}
                          className="px-6 py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-r-xl hover:from-blue-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 font-medium shadow-lg flex items-center space-x-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="hidden sm:block">Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {(formErrors.items || validationErrors.items) && (
                    <p className="mt-3 text-sm text-red-600 flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{formErrors.items || validationErrors.items}</span>
                    </p>
                  )}
                </div>

                {/* Items List */}
                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <span>📋 Items List</span>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {formData.items.length} items
                        </span>
                      </h4>
                      {totalAmount > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="text-xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {formData.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₹{Number(item.unitPrice).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                ₹{Number(item.totalPrice).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-all duration-200 hover:scale-110"
                                  title="Remove item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No items added yet</h3>
                      <p className="text-gray-500 mb-4">Use the "Add New Item" section above to select products and add them to your bill. You need at least 1 item to continue.</p>
                    </div>
                  )}
                </div>

                {/* Total Summary */}
                {totalAmount > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Bill Summary</h3>
                        <p className="text-gray-600">Total items: {formData.items.length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-3xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Step 2: Customer Information */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Customer Information</h4>
                  <p className="text-gray-600">Add customer details for better record keeping (Optional)</p>
                  <div className="mt-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                    💡 <strong>Step 2 of 3:</strong> Customer details are optional - you can skip this step
                  </div>
                  <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                    🐛 Debug: Currently on Step {step} of 3 - Customer Information
                  </div>
                </div>

                {/* Customer Type Selection */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-gray-900">Customer Type</h4>
                    <span className="text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                      {existingCustomers.length} existing customers
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleCustomerTypeChange('existing')}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                        customerType === 'existing'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white shadow-lg'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Existing Customer</p>
                          <p className={`text-sm ${customerType === 'existing' ? 'text-purple-100' : 'text-gray-500'}`}>
                            Select from previous customers
                          </p>
                        </div>
                        {customerType === 'existing' && (
                          <CheckCircle className="h-6 w-6 text-white ml-auto" />
                        )}
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleCustomerTypeChange('new')}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                        customerType === 'new'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white shadow-lg'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">👤+</span>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">New Customer</p>
                          <p className={`text-sm ${customerType === 'new' ? 'text-purple-100' : 'text-gray-500'}`}>
                            Add new customer details
                          </p>
                        </div>
                        {customerType === 'new' && (
                          <CheckCircle className="h-6 w-6 text-white ml-auto" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Existing Customer Selection */}
                {customerType === 'existing' && (
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Select Existing Customer
                    </label>
                    <select
                      value={formData.customerName && formData.customerPhone ? `${formData.customerName} - ${formData.customerPhone}` : ''}
                      onChange={e => handleExistingCustomerSelect(e.target.value)}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:border-gray-400 text-base bg-white"
                    >
                      <option value="">👤 Choose an existing customer...</option>
                      {existingCustomers.map((customer) => (
                        <option key={`${customer.name}-${customer.phone}`} value={`${customer.name} - ${customer.phone}`}>
                          📱 {customer.name} - {customer.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* New Customer Form */}
                {customerType === 'new' && (
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={formData.customerName}
                          onChange={e => {
                            setFormData({ ...formData, customerName: e.target.value });
                            if (validationErrors.customerName) {
                              setValidationErrors({ ...validationErrors, customerName: '' });
                            }
                          }}
                          className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:border-gray-400 text-base ${
                            validationErrors.customerName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                          }`}
                          placeholder="👤 Enter customer name"
                        />
                        {validationErrors.customerName && (
                          <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{validationErrors.customerName}</span>
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                          Phone Number (10 digits)
                        </label>
                        <input
                          type="tel"
                          value={formData.customerPhone}
                          onChange={e => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 10) {
                              setFormData({ ...formData, customerPhone: value });
                            }
                            if (validationErrors.customerPhone) {
                              setValidationErrors({ ...validationErrors, customerPhone: '' });
                            }
                          }}
                          className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:border-gray-400 text-base ${
                            validationErrors.customerPhone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                          }`}
                          placeholder="📱 Enter 10-digit phone number"
                          maxLength="10"
                        />
                        {validationErrors.customerPhone && (
                          <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{validationErrors.customerPhone}</span>
                          </p>
                        )}
                        {formData.customerPhone && !validationErrors.customerPhone && (
                          <p className={`mt-2 text-sm flex items-center space-x-1 ${
                            formData.customerPhone.length === 10 ? 'text-green-600' : 'text-purple-600'
                          }`}>
                            <span>{formData.customerPhone.length === 10 ? '✅' : '📱'}</span>
                            <span>
                              {formData.customerPhone.length === 10 
                                ? 'Valid phone number!' 
                                : `${formData.customerPhone.length}/10 digits entered`
                              }
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Skip Customer Info */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Skip button clicked, current step:', step);
                      setFormData({ ...formData, customerName: 'Walk-in Customer', customerPhone: '' });
                      goToStep(3);
                    }}
                    className="text-gray-500 hover:text-gray-700 underline transition-colors duration-200"
                  >
                    Skip customer details and continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Information */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Payment Information</h4>
                  <p className="text-gray-600">Set payment method and status for this bill</p>
                  <div className="mt-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                    🎉 <strong>Final Step (3/3):</strong> Choose payment method and status, then create your bill!
                  </div>
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    🐛 Debug: Currently on Step {step} of 3
                  </div>
                  <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                    ⚠️ If you're seeing the bill being created without reaching step 3, please check browser console for logs
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill Summary</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Customer: {formData.customerName || 'Walk-in Customer'}</p>
                        {formData.customerPhone && <p>Phone: {formData.customerPhone}</p>}
                        <p>Items: {formData.items.length} products</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-4xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { value: 'cash', label: 'Cash', icon: '💵' },
                        { value: 'card', label: 'Card', icon: '💳' },
                        { value: 'upi', label: 'UPI', icon: '📱' },
                        { value: 'credit', label: 'Credit', icon: '📄' }
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] text-left ${
                            formData.paymentMethod === method.value
                              ? 'bg-gradient-to-r from-blue-500 to-green-500 border-blue-500 text-white shadow-lg'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{method.icon}</span>
                            <span className="font-medium">{method.label}</span>
                            {formData.paymentMethod === method.value && (
                              <CheckCircle className="h-5 w-5 text-white ml-auto" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Payment Status
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { value: 'paid', label: 'Paid', icon: '✅', color: 'from-green-500 to-teal-500' },
                        { value: 'pending', label: 'Pending', icon: '⏳', color: 'from-yellow-500 to-orange-500' },
                        { value: 'partial', label: 'Partial', icon: '⚡', color: 'from-blue-500 to-purple-500' }
                      ].map((status) => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentStatus: status.value })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] text-left ${
                            formData.paymentStatus === status.value
                              ? `bg-gradient-to-r ${status.color} border-transparent text-white shadow-lg`
                              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{status.icon}</span>
                            <span className="font-medium">{status.label}</span>
                            {formData.paymentStatus === status.value && (
                              <CheckCircle className="h-5 w-5 text-white ml-auto" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Form Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105 font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105 font-medium flex items-center space-x-2"
                  disabled={submitting}
                >
                  <span>← Back</span>
                </button>
              )}
              
              <div className="flex space-x-3">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (step === 1) {
                        if (validateStep(step)) goToStep(2);
                      } else if (step === 2) {
                        setTimeout(() => goToStep(3), 0);
                      }
                    }}
                    disabled={step === 1 && formData.items.length === 0}
                    className={`px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105 font-medium shadow-lg hover:shadow-xl flex items-center space-x-2 ${
                      step === 1 && formData.items.length === 0
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600'
                    }`}
                    title={step === 1 && formData.items.length === 0 ? 'Add at least one item to continue' : ''}
                  >
                    <span>
                      {step === 1 ? 'Continue to Customer Info' : 
                       step === 2 ? 'Continue to Payment' : 'Next Step'}
                    </span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 disabled:opacity-50 transition-all duration-200 hover:scale-105 font-medium shadow-lg hover:shadow-xl"
                    disabled={submitting || !paymentStepReady}
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Bill...</span>
                      </div>
                    ) : !paymentStepReady ? (
                      <div className="flex items-center space-x-2">
                        <span>Review payment options…</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>{bill ? 'Update Bill' : 'Create Bill'}</span>
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
        </form>
        </div>
      </div>
    </div>
  );
};

// Customers Section Component
const CustomersSection = ({ bills, fetchBills }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Group bills by customerName + customerPhone
  const customers = {};
  bills.forEach(bill => {
    const key = (bill.customerName || 'Unknown') + '|' + (bill.customerPhone || '');
    if (!customers[key]) {
      customers[key] = {
        name: bill.customerName || 'Unknown',
        phone: bill.customerPhone,
        bills: [],
      };
    }
    customers[key].bills.push(bill);
  });
  let customerList = Object.values(customers);

  // Search/filter
  customerList = customerList.filter(c =>
    ((c.name || '').toLowerCase().includes(search.toLowerCase()) ||
     (c.phone || '').includes(search)) &&
    (statusFilter === 'all' || c.bills.some(b => b.paymentStatus === statusFilter))
  );

  // Sort customers
  customerList.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'totalPaid':
        aValue = a.bills.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0);
        bValue = b.bills.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0);
        break;
      case 'totalPending':
        aValue = a.bills.filter(b => b.paymentStatus !== 'paid').reduce((s, b) => s + b.totalAmount, 0);
        bValue = b.bills.filter(b => b.paymentStatus !== 'paid').reduce((s, b) => s + b.totalAmount, 0);
        break;
      case 'billCount':
        aValue = a.bills.length;
        bValue = b.bills.length;
        break;
      default: // name
        aValue = (a.name || '').toLowerCase();
        bValue = (b.name || '').toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Summary
  const totalPaid = customerList.reduce((sum, c) => sum + c.bills.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0), 0);
  const totalPending = customerList.reduce((sum, c) => sum + c.bills.filter(b => b.paymentStatus !== 'paid').reduce((s, b) => s + b.totalAmount, 0), 0);

  // Update payment status
  const updatePaymentStatus = async (billId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await billsApi.update(billId, { paymentStatus: newStatus });
      await fetchBills(); // Refresh bills data
    } catch (error) {
      console.error('Error updating payment status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Export to CSV
  const exportCSV = () => {
    let csv = 'Customer Name,Phone,Bill Number,Status,Amount\n';
    customerList.forEach(c => {
      c.bills.forEach(bill => {
        csv += `${c.name},${c.phone || ''},${bill.billNumber},${bill.paymentStatus},${bill.totalAmount}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <span className="text-3xl mr-3">👥</span>
              Customer Management
            </h2>
            <p className="text-gray-600">Manage customer relationships and payment tracking</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={exportCSV}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center space-x-2 font-semibold text-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-50"
            >
              <span>📊</span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
          </select>

          {/* Sort */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            >
              <option value="name">Sort by Name</option>
              <option value="totalPaid">Sort by Total Paid</option>
              <option value="totalPending">Sort by Total Pending</option>
              <option value="billCount">Sort by Bill Count</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-end space-x-4 text-sm">
            <span className="text-gray-600">Total: <span className="font-semibold text-purple-600">{Object.keys(customers).length}</span></span>
            <span className="text-gray-600">Showing: <span className="font-semibold text-blue-600">{customerList.length}</span></span>
          </div>
        </div>
      </div>

      {/* Enhanced Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customerList.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600 mb-6">
              {search || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Customers will appear here once bills are created'
              }
            </p>
          </div>
        )}
        
        {customerList.map((customer, idx) => {
          const totalPaid = customer.bills.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0);
          const totalPending = customer.bills.filter(b => b.paymentStatus !== 'paid').reduce((s, b) => s + b.totalAmount, 0);
          const paidBills = customer.bills.filter(b => b.paymentStatus === 'paid').length;
          const pendingBills = customer.bills.filter(b => b.paymentStatus !== 'paid').length;
          
          return (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-300 group animate-fadeIn relative overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
              onClick={() => { setSelectedCustomer(customer); setShowModal(true); }}
            >
              {/* Customer Avatar */}
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                    {customer.name}
                  </h3>
                  {customer.phone && (
                    <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
                      📱 {customer.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200 group-hover:border-green-300 transition-all duration-200">
                  <span className="text-sm font-medium text-gray-700">Total Paid</span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 group-hover:text-green-700 transition-colors duration-200">
                      ₹{totalPaid.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600">{paidBills} bills</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200 group-hover:border-red-300 transition-all duration-200">
                  <span className="text-sm font-medium text-gray-700">Total Pending</span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600 group-hover:text-red-700 transition-colors duration-200">
                      ₹{totalPending.toLocaleString()}
                    </div>
                    <div className="text-xs text-red-600">{pendingBills} bills</div>
                  </div>
                </div>
              </div>

              {/* Recent Bills */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700 mb-2 group-hover:text-gray-800 transition-colors duration-200">
                  Recent Bills ({customer.bills.length})
                </h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {customer.bills.slice(0, 3).map((bill, billIndex) => (
                    <div key={bill.id || bill._id || bill.billNumber} className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <span className="font-medium text-gray-900 hover:text-blue-600 transition-colors duration-200 truncate">
                        {bill.billNumber}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:scale-105 ${
                          bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' :
                          bill.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' :
                          'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                        }`}>
                          {bill.paymentStatus}
                        </span>
                        <span className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200">
                          ₹{bill.totalAmount}
                        </span>
                      </div>
                    </div>
                  ))}
                  {customer.bills.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{customer.bills.length - 3} more bills
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedCustomer.name}
                    </h3>
                    {selectedCustomer.phone && (
                      <p className="text-gray-600">📱 {selectedCustomer.phone}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200 hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Customer Summary */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-sm">
                  <h4 className="text-sm font-medium text-green-700 mb-1">Total Paid</h4>
                  <p className="text-2xl font-bold text-green-900">
                    ₹{totalPaid.toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-200 shadow-sm">
                  <h4 className="text-sm font-medium text-red-700 mb-1">Total Pending</h4>
                  <p className="text-2xl font-bold text-red-900">
                    ₹{totalPending.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Total Bills</h4>
                  <p className="text-2xl font-bold text-blue-900">
                    {selectedCustomer.bills.length}
                  </p>
                </div>
              </div>

              {/* Bills List */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Bill History</h4>
                <div className="space-y-3">
                  {selectedCustomer.bills.map((bill, index) => (
                    <div key={bill.id || bill._id || bill.billNumber} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200">
                            {bill.billNumber}
                          </h5>
                          <p className="text-sm text-gray-500">
                            {new Date(bill.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:scale-105 ${
                            bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' :
                            bill.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' :
                            'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                          }`}>
                            {bill.paymentStatus}
                          </span>
                          <span className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200">
                            ₹{bill.totalAmount}
                          </span>
                        </div>
                      </div>
                      
                      {/* Payment Status Update */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Update Status:</span>
                          <select
                            value={bill.paymentStatus}
                            onChange={(e) => updatePaymentStatus(bill.id || bill._id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={updatingStatus}
                          >
                            <option value="pending">Pending</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                          </select>
                          {updatingStatus && (
                            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.dispatchEvent(new CustomEvent('viewBill', { detail: bill }));
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 hover:scale-110 transition-all duration-200 shadow-md text-white"
                            title="View Bill Details"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          {selectedCustomer.phone && (
                            <a
                              href={`https://wa.me/91${selectedCustomer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Hello ${selectedCustomer.name},\nHere are your bill details:\nBill No: ${bill.billNumber}\nAmount: ₹${bill.totalAmount}\nStatus: ${bill.paymentStatus}\nThank you for shopping with us!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 hover:scale-110 transition-all duration-200 shadow-md text-white"
                              title="Send via WhatsApp"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageCircle className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Toast Component
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm animate-fadeIn ${
    type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
  }`}>
    <div className="flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
);

// Spinner Component
const Spinner = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default App;