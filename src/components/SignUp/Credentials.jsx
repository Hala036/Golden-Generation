import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import useSignupStore from '../../store/signupStore';
import { debounce } from 'lodash';
import { toast } from 'react-hot-toast';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { Star, Users } from 'lucide-react';
import { validateEmail, validateUsername, validatePassword, validateConfirmPassword } from '../../utils/validation';
import PasswordInput from '../PasswordInput';


const Credentials = ({ onComplete }) => {
  const { t } = useLanguage();

  const [errors, setErrors] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const { credentialsData, updateCredentialsData } = useSignupStore();

  // Debounced email check
  const checkEmailAvailability = debounce(async (email) => {
    if (!email) return;
    setIsChecking(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('credentials.email', '==', email.toLowerCase()), where("role", "==", "retiree"));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setErrors(prev => ({ ...prev, email: t('auth.credentials.email.inUse') }));
        toast.error(t('auth.credentials.email.inUse'));
      }
    } catch (error) {
      console.error('Error checking email:', error);
      toast.error(t('auth.credentials.validation.error'));
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
        setErrors(prev => ({ ...prev, username: t('auth.credentials.username.inUse') }));
        toast.error(t('auth.credentials.username.inUse'));
      }
    } catch (error) {
      console.error('Error checking username:', error);
      toast.error(t('auth.credentials.validation.error'));
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

    // Explicit translation-based validation (added)
    if (!email) {
      newErrors.email = t('auth.credentials.email.required');
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      newErrors.email = t('auth.credentials.email.invalid');
    }

    // Username
    const usernameError = validateUsername(username);
    if (usernameError) newErrors.username = t(usernameError);

    // Password
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = t(passwordError);

    // Confirm Password
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = t(confirmPasswordError);

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isChecking) {
      toast.error(t('auth.credentials.validation.wait'));
      return;
    }

    setIsChecking(true);
    toast.loading(t('auth.credentials.validation.processing'), { id: 'credentials-check' });

    try {
      const [validationResult, usernameAvailable] = await Promise.all([
        validateForm(),
        checkUsernameFinal(credentialsData.username)
      ]);

      if (!validationResult.isValid) {
        toast.error(t('auth.credentials.validation.fix'), { id: 'credentials-check' });
        // Focus the first error field
        const firstErrorField = Object.keys(validationResult.errors)[0];
        if (firstErrorField) {
          const element = document.querySelector(`[name="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
          }
        }
        return;
      }

      if (!usernameAvailable) {
        setErrors(prev => ({ ...prev, username: t('auth.credentials.username.inUse') }));
        toast.error(t('auth.credentials.username.inUse'), { id: 'credentials-check' });
        return;
      }

      try {
        const methods = await fetchSignInMethodsForEmail(auth, credentialsData.email);
        if (methods.length > 0) {
          setErrors(prev => ({ ...prev, email: t('auth.credentials.email.inUse') }));
          toast.error(t('auth.credentials.email.inUse'), { id: 'credentials-check' });
          return;
        }
      } catch (error) {
        console.error('Firebase email check error:', error);
        if (error.code === 'auth/invalid-email') {
          setErrors(prev => ({ ...prev, email: t('auth.credentials.email.invalid') }));
          toast.error(t('auth.credentials.email.invalid'), { id: 'credentials-check' });
          return;
        }
        throw error;
      }

      toast.success(t('auth.credentials.validation.success'), { id: 'credentials-check' });
      onComplete();
    } catch (error) {
      console.error('Error in credentials validation:', error);
      toast.error(t('auth.credentials.validation.error'), { id: 'credentials-check' });
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
              {t('auth.credentials.title')}
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('auth.credentials.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <div className="flex items-center mb-6">
              <Star className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('auth.signup.setYourCredentials')}
                </h3>
                <p className="text-gray-600 text-lg">
                  {t('auth.signup.chooseUsernameEmailAndPassword')}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.credentials.email.label')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={credentialsData.email || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('auth.credentials.email.placeholder')}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
                {isChecking && (
                  <p className="mt-1 text-sm text-yellow-600">{t('auth.credentials.validation.wait')}</p>
                )}
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.credentials.username.label')}
                </label>
                <input
                  type="text"
                  name="username"
                  value={credentialsData.username || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('auth.credentials.username.placeholder')}
                  required
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
                {isChecking && (
                  <p className="mt-1 text-sm text-yellow-600">{t('auth.credentials.validation.wait')}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.credentials.password.label')}
                </label>
                <PasswordInput
                  name="password"
                  value={credentialsData.password || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('auth.credentials.password.placeholder')}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('auth.credentials.password.requirements') || 'Password must be at least 8 characters and contain uppercase, lowercase, and a number.'}
                </p>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}

              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.credentials.confirmPassword.label')}
                </label>
                <PasswordInput
                  name="confirmPassword"
                  value={credentialsData.confirmPassword || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('auth.credentials.confirmPassword.placeholder')}
                  required
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}

              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isChecking}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  <span>{t('auth.credentials.validation.wait')}</span>
                </>
              ) : (
                <>
                  <Star className="w-6 h-6" />
                  <span>{t('common.continue')}</span>
                  <Star className="w-6 h-6" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      <style>{`
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