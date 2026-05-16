import React, { useState } from 'react';
import { Package, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { resetPassword, validateEmail, emailExists } from './utils/userManager';

const ForgotPassword = ({ onBackToSignIn, darkMode }) => {
  const [step, setStep] = useState(1); // 1: Email input, 2: New password input, 3: Success
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (step === 1) {
      // Email validation
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else if (step === 2) {
      // Password validation
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters long';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
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

    // Simulate API delay
    setTimeout(() => {
      if (step === 1) {
        // Check if email exists
        if (emailExists(formData.email)) {
          setStep(2);
        } else {
          setErrors({
            email: 'Email not found in our records'
          });
        }
      } else if (step === 2) {
        // Reset password
        const result = resetPassword(formData.email, formData.newPassword);
        
        if (result.success) {
          setStep(3);
        } else {
          setErrors({
            general: result.message
          });
        }
      }
      
      setIsLoading(false);
    }, 800);
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
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-red-50'
    }`}>
      <div className="w-full max-w-md">
        {/* Main Reset Password Card */}
        <div className={`rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-white/20'
        }`}>
          
          {/* Back Button */}
          <button
            onClick={onBackToSignIn}
            className={`flex items-center space-x-2 mb-6 text-sm transition-colors hover:underline ${
              darkMode ? 'text-gray-300 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
            }`}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sign In</span>
          </button>

          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all duration-300 hover:scale-110 ${
              step === 3 
                ? 'bg-green-600'
                : darkMode 
                  ? 'bg-purple-600' 
                  : 'bg-gradient-to-br from-purple-500 to-purple-600'
            }`}>
              {step === 3 ? (
                <CheckCircle className="h-8 w-8 text-white" />
              ) : (
                <Package className="h-8 w-8 text-white" />
              )}
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {step === 1 ? 'Reset Password' : step === 2 ? 'New Password' : 'Password Reset!'}
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {step === 1 
                ? 'Enter your email to reset your password'
                : step === 2 
                  ? 'Enter your new password'
                  : 'Your password has been reset successfully'}
            </p>
          </div>

          {step === 3 ? (
            // Success step
            <div className="text-center">
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-700">
                  Your password has been reset successfully! You can now sign in with your new password.
                </p>
              </div>
              <button
                onClick={onBackToSignIn}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105"
              >
                Continue to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* General Error Message */}
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 animate-fadeIn">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{errors.general}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 ? (
                  // Step 1: Email Input
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                        errors.email 
                          ? 'border-red-300 bg-red-50' 
                          : darkMode
                            ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                            : 'border-gray-300 bg-white'
                      } ${darkMode ? 'hover:border-gray-500' : 'hover:border-gray-400'}`}
                      placeholder="Enter your registered email address"
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  // Step 2: New Password Input
                  <>
                    <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Resetting password for: <strong>{formData.email}</strong>
                      </p>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        New Password *
                      </label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                          errors.newPassword 
                            ? 'border-red-300 bg-red-50' 
                            : darkMode
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                              : 'border-gray-300 bg-white'
                        } ${darkMode ? 'hover:border-gray-500' : 'hover:border-gray-400'}`}
                        placeholder="Enter new password (min 6 characters)"
                        disabled={isLoading}
                      />
                      {errors.newPassword && (
                        <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.newPassword}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                          errors.confirmPassword 
                            ? 'border-red-300 bg-red-50' 
                            : darkMode
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                              : 'border-gray-300 bg-white'
                        } ${darkMode ? 'hover:border-gray-500' : 'hover:border-gray-400'}`}
                        placeholder="Confirm your new password"
                        disabled={isLoading}
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.confirmPassword}</span>
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-50 ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 hover:scale-105 hover:shadow-lg active:scale-95'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{step === 1 ? 'Checking...' : 'Resetting...'}</span>
                    </div>
                  ) : (
                    <span>{step === 1 ? 'Continue' : 'Reset Password'}</span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
