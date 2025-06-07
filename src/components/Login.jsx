import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, getUserData } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast, Toaster } from "react-hot-toast";
import coupleimage from "../assets/couple.png";
import useSignupStore from '../store/signupStore';
import { useTranslation } from 'react-i18next';

const roleMap = {
  user: 'retiree',
  admin: 'admin'
};

const LoginPage = () => {
  const { t } = useTranslation();
  const { setRole } = useSignupStore();
  const navigate = useNavigate();
  const [selectedLoginType, setSelectedLoginType] = useState("user");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const userData = await getUserData(userCredential.user.uid);
      
      if (!userData?.role) {
        throw new Error('User role not found');
      }

      // Only allow login if attempting to login as the correct role type
      if (selectedLoginType === 'admin' && userData.role !== 'admin' && userData.role !== 'superadmin') {
        throw new Error('Invalid login type. Please login as admin');
      } else if (selectedLoginType === 'user' && userData.role !== 'retiree') {
        throw new Error('Invalid login type. Please login as user');
      }

      setRole(userData.role); // Set global role state
      toast.success('Login successful!');
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    navigate('/signup', { replace: true });
  };

  // After successful login and getting user data:
const handleLogin = async () => {
  try {
    const userDoc = await getUserData(user.uid);
    setRole(userDoc.role); // Set the role in the store
  } catch (error) {
    console.error('Error during login:', error);
  }
};

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-b from-gray-100 to-gray-200">
      <Toaster position="top-right" />
      
      {/* Left - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Logo or Brand Name - Visible on mobile */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#FFD966]">Golden Generation</h1>
          </div>

          {/* Header */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            {t('auth.login.title')}
          </h2>

          {/* Role Switcher */}
          <div className="flex justify-center bg-white rounded-full w-fit mx-auto shadow-md">
            <button
              onClick={() => setSelectedLoginType("user")}
              className={`px-4 sm:px-6 py-2 text-sm sm:text-base font-semibold transition duration-200 ${
                selectedLoginType === "user"
                  ? "bg-[#FFD966] text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              } rtl:rounded-r-full ltr:rounded-l-full`}
            >
              {t('auth.login.user')}
            </button>
            <button
              onClick={() => setSelectedLoginType("admin")}
              className={`px-4 sm:px-6 py-2 text-sm sm:text-base font-semibold transition duration-200 ${
                selectedLoginType === "admin"
                  ? "bg-[#FFD966] text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              } rtl:rounded-l-full ltr:rounded-r-full`}
            >
              {t('auth.login.admin')}
            </button>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-8">
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('auth.login.email')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFD966] focus:border-transparent transition duration-200"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.login.password')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFD966] focus:border-transparent transition duration-200"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm sm:text-base font-medium text-gray-600 hover:text-gray-800 transition duration-200"
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#FFD966] text-gray-900 rounded-lg text-sm sm:text-base font-semibold hover:bg-yellow-400 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
            </button>

            {/* Footer Text */}
            <div className="text-center text-sm sm:text-base space-x-1">
              <span className="text-gray-600">{t('auth.login.newAccount')}</span>
              <button
                type="button"
                onClick={handleSignUp}
                className="font-semibold text-[#FFD966] hover:text-yellow-500 transition duration-200"
              >
                {t('auth.login.signUp')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right - Image Section */}
      <div className="hidden lg:block lg:w-1/2 bg-[#FFD966] relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={coupleimage}
            alt="Couple enjoying event"
            className="w-full h-full object-cover object-[center_10%]"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
