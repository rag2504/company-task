import React, { useState } from 'react';
import { Package, Eye, EyeOff, AlertCircle } from 'lucide-react';
import {
  authenticateUser,
  setCurrentUser,
  setRemoteAuthSession,
  validateEmail,
  validatePassword,
} from './utils/userManager';
import { api } from './services/client';

const SignIn = ({ onSignIn, onSwitchToSignUp, onSwitchToForgotPassword, darkMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      setRemoteAuthSession(data.user, data.token);
      onSignIn(data.user);
    } catch (err) {
      const status = err.response?.status;
      const noResponse = !err.response && err.request;

      if (status === 401 || status === 403) {
        const offline = authenticateUser(formData.email, formData.password);
        if (offline.success) {
          setCurrentUser(offline.user);
          onSignIn(offline.user);
          return;
        }
        setErrors({
          general:
            err.response?.data?.message || 'Invalid email or password.',
        });
        return;
      }

      if (
        noResponse ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ERR_NETWORK'
      ) {
        await new Promise((r) => setTimeout(r, 200));
        const result = authenticateUser(formData.email, formData.password);
        if (result.success) {
          setCurrentUser(result.user);
          onSignIn(result.user);
        } else {
          setErrors({
            general:
              'Cannot reach the Quickbill API (is it running on port 5000?). Offline login also failed — check credentials.',
          });
        }
        return;
      }

      const msg =
        err.response?.data?.message || err.message || 'Login failed.';
      setErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-all duration-500 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="w-full max-w-md">
        {/* Main Sign In Card */}
        <div className={`rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-white/20'
        }`}>
          
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all duration-300 hover:scale-110 ${
              darkMode ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}>
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Sign In
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Welcome back to Provision Store
            </p>
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{errors.general}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.email 
                      ? 'border-red-300 bg-red-50' 
                      : darkMode
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                        : 'border-gray-300 bg-white'
                  } ${darkMode ? 'hover:border-gray-500' : 'hover:border-gray-400'}`}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.password 
                      ? 'border-red-300 bg-red-50' 
                      : darkMode
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                        : 'border-gray-300 bg-white'
                  } ${darkMode ? 'hover:border-gray-500' : 'hover:border-gray-400'}`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105 hover:shadow-lg active:scale-95'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className={`text-sm font-medium transition-colors hover:underline ${
                  darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                }`}
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignUp}
                  className={`font-medium transition-colors hover:underline ${
                    darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                  }`}
                  disabled={isLoading}
                >
                  Create Account
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Initial Setup Info */}
        <div className={`mt-6 rounded-lg p-4 ${
          darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/60 backdrop-blur-sm border border-white/30'
        }`}>
          <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            🚀 First Time Setup
          </h3>
          <div className={`text-xs space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>Default Owner: <strong>owner@provisionstore.com</strong> / <strong>admin123</strong></p>
            <p className="italic">Use this account to get started, then create staff accounts as needed.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
