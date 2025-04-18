import React, { useState } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import useSignupStore from '../../store/signupStore';
import { debounce } from 'lodash';
import { toast } from 'react-hot-toast';

const Credentials = ({ onComplete }) => {
  const [errors, setErrors] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const { credentialsData, updateCredentialsData } = useSignupStore();

  // Debounced email check
  const checkEmailAvailability = debounce(async (email) => {
    if (!email) return;
    
    setIsChecking(true);
    try {
      // Check in users collection for email in credentials.email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('credentials.email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setErrors(prev => ({ ...prev, email: 'Email is already registered' }));
        toast.error('Email is already registered');
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
        if (email.length > 0 && /\S+@\S+\.\S+/.test(email)) {
          toast.success('Email is available');
        }
      }
    } catch (error) {
      console.error('Error checking email:', error);
      toast.error('Error checking email availability');
    } finally {
      setIsChecking(false);
    }
  }, 500);

  // Debounced username check
  const checkUsernameAvailability = debounce(async (username) => {
    if (!username || username.length < 3) return;
    
    setIsChecking(true);
    try {
      const usernameRef = doc(db, 'usernames', username.toLowerCase());
      const usernameDoc = await getDoc(usernameRef);
      
      if (usernameDoc.exists()) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
        toast.error('Username is already taken');
      } else {
        setErrors(prev => ({ ...prev, username: '' }));
        if (username.length >= 3) {
          toast.success('Username is available');
        }
      }
    } catch (error) {
      console.error('Error checking username:', error);
      toast.error('Error checking username availability');
    } finally {
      setIsChecking(false);
    }
  }, 500);

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateCredentialsData({ [name]: value });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Check availability
    if (name === 'username' && value.length >= 3) {
      checkUsernameAvailability(value);
    } else if (name === 'email') {
      checkEmailAvailability(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { email, password, confirmPassword, username } = credentialsData;

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    // Username validation
    if (!username) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isChecking) {
      toast.error('Please wait while we verify your information');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    // Final availability check before submission
    setIsChecking(true);
    try {
      // Check both email and username one last time
      const [emailAvailable, usernameAvailable] = await Promise.all([
        checkEmailFinal(credentialsData.email),
        checkUsernameFinal(credentialsData.username)
      ]);

      if (!emailAvailable) {
        setErrors(prev => ({ ...prev, email: 'Email is already registered' }));
        toast.error('Email is already registered');
        return;
      }

      if (!usernameAvailable) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
        toast.error('Username is already taken');
        return;
      }

      // If both are available, proceed
      toast.success('Credentials validated successfully');
      onComplete();
    } catch (error) {
      console.error('Error in final validation:', error);
      toast.error('Error validating credentials');
    } finally {
      setIsChecking(false);
    }
  };

  // Final check functions that return promises
  const checkEmailFinal = async (email) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('credentials.email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const checkUsernameFinal = async (username) => {
    const usernameRef = doc(db, 'usernames', username.toLowerCase());
    const usernameDoc = await getDoc(usernameRef);
    return !usernameDoc.exists();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-md mt-4 sm:mt-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Account Credentials</h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600">Create your account credentials</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Email Field */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={credentialsData.email || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-3 rounded-lg shadow-sm text-sm sm:text-base pr-10 transition-colors duration-200 ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
                }`}
                placeholder="Enter your email address"
              />
              {isChecking ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                </div>
              ) : errors.email ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : credentialsData.email && !errors.email ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : null}
            </div>
            {errors.email && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          {/* Username Field */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={credentialsData.username || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-3 rounded-lg shadow-sm text-sm sm:text-base pr-10 transition-colors duration-200 ${
                  errors.username
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
                }`}
                placeholder="Choose a unique username"
              />
              {isChecking ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                </div>
              ) : errors.username ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : credentialsData.username && !errors.username ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : null}
            </div>
            {errors.username && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.username}
              </p>
            )}
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Username must be at least 3 characters and can only contain letters, numbers, and underscores
            </p>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={credentialsData.password || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-3 rounded-lg shadow-sm text-sm sm:text-base transition-colors duration-200 ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
                }`}
                placeholder="Enter your password"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password}
              </p>
            )}
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Password must be at least 8 characters and include uppercase, lowercase, and numbers
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                value={credentialsData.confirmPassword || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-3 rounded-lg shadow-sm text-sm sm:text-base transition-colors duration-200 ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
                }`}
                placeholder="Confirm your password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isChecking}
            className="w-full sm:w-auto min-w-[150px] px-6 py-3 bg-green-500 text-white rounded-lg text-sm sm:text-base font-medium transition-all duration-200 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            {isChecking ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Checking...</span>
              </div>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Credentials; 