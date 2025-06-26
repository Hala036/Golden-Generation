import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import useSignupStore from '../../store/signupStore';
import { debounce } from 'lodash';
import { toast } from 'react-hot-toast';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { Star, Users } from 'lucide-react';
import PasswordInput from '../PasswordInput';

const Credentials = ({ onComplete, editMode = false, data }) => {
  const [errors, setErrors] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const { credentialsData, updateCredentialsData } = useSignupStore();

  // Prefill form in edit mode
  useEffect(() => {
    if (editMode && data && Object.keys(data).length > 0) {
      updateCredentialsData(data);
    }
    // eslint-disable-next-line
  }, [editMode, data]);

  // Debounced email check
  const checkEmailAvailability = debounce(async (email) => {
    if (!email) return;
    setIsChecking(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('credentials.email', '==', email.toLowerCase()), where("role", "==", "retiree"));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setErrors(prev => ({ ...prev, email: 'Email is already registered' }));
        toast.error('Email is already registered');
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

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'username' && value.length >= 3) {
      checkUsernameAvailability(value);
    } else if (name === 'email') {
      checkEmailAvailability(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { email, password, confirmPassword, username } = credentialsData;

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!username) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

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

    setIsChecking(true);
    toast.loading('Validating credentials...', { id: 'credentials-check' });

    try {
      const [formIsValid, usernameAvailable] = await Promise.all([
        validateForm(),
        checkUsernameFinal(credentialsData.username)
      ]);

      if (!formIsValid) {
        toast.error('Please fix the form errors', { id: 'credentials-check' });
        return;
      }

      if (!usernameAvailable) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
        toast.error('Username is already taken', { id: 'credentials-check' });
        return;
      }

      try {
        const methods = await fetchSignInMethodsForEmail(auth, credentialsData.email);
        if (methods.length > 0) {
          setErrors(prev => ({ ...prev, email: 'Email is already registered' }));
          toast.error('Email is already registered', { id: 'credentials-check' });
          return;
        }
      } catch (error) {
        console.error('Firebase email check error:', error);
        if (error.code === 'auth/invalid-email') {
          setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
          toast.error('Invalid email format', { id: 'credentials-check' });
          return;
        }
        throw error;
      }

      toast.success('Credentials validated successfully', { id: 'credentials-check' });
      onComplete();
    } catch (error) {
      console.error('Error in credentials validation:', error);
      toast.error('Error validating credentials', { id: 'credentials-check' });
    } finally {
      setIsChecking(false);
    }
  };

  const checkUsernameFinal = async (username) => {
    if (!username || username.length < 3) return false;
    const usernameRef = doc(db, 'usernames', username.toLowerCase());
    const usernameDoc = await getDoc(usernameRef);
    return !usernameDoc.exists();
  };

  // Floating background elements for visual consistency
  const FloatingElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-32 h-32 top-10 left-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '0s' }} />
      <div className="absolute w-24 h-24 top-1/3 right-20 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute w-40 h-40 bottom-20 left-1/4 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '4s' }} />
      <div className="absolute w-20 h-20 bottom-1/3 right-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '6s' }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 relative">
      <FloatingElements />

      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-yellow-500 mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Account Credentials
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create your account credentials to join the community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <div className="flex items-center mb-6">
              <Star className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Set Your Credentials
                </h3>
                <p className="text-gray-600 text-lg">Choose your username, email, and password</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Email Field */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={credentialsData.email || ''}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded-xl shadow-sm text-base pr-10 transition-colors duration-200 ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-yellow-400 focus:ring-yellow-100'
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
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Username Field */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={credentialsData.username || ''}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded-xl shadow-sm text-base pr-10 transition-colors duration-200 ${
                      errors.username
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-yellow-400 focus:ring-yellow-100'
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
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.username}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Username must be at least 3 characters and can only contain letters, numbers, and underscores
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <PasswordInput
                  name="password"
                  value={credentialsData.password || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-xl shadow-sm text-base transition-colors duration-200 ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-yellow-400 focus:ring-yellow-100'
                  }`}
                  placeholder="Enter your password"
                  error={errors.password}
                  autoComplete="new-password"
                  showStrengthIndicator={true}
                />
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <PasswordInput
                  name="confirmPassword"
                  value={credentialsData.confirmPassword || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-xl shadow-sm text-base transition-colors duration-200 ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-yellow-400 focus:ring-yellow-100'
                  }`}
                  placeholder="Confirm your password"
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          {/* Submit Button - only show if not in editMode */}
          {!editMode && (
            <div className="text-center pt-8">
              <button
                type="submit"
                disabled={isChecking}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95 flex items-center justify-center gap-2"
              >
                {isChecking ? (
                  <>
                    <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-6 h-6" />
                    <span>Continue</span>
                    <Star className="w-6 h-6" />
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Credentials;