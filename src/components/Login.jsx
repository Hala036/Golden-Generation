import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, getUserData } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast, Toaster } from "react-hot-toast";
import coupleimage from "../assets/couple.png";
import useSignupStore from '../store/signupStore';
import { useLanguage } from '../context/LanguageContext'; // Use your custom hook for translations

const roleMap = {
  user: 'retiree',
  admin: 'admin'
};

const LoginPage = () => {
  const { t } = useLanguage();
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
        throw new Error(t('no Role'));
      }

      // Only allow login if attempting to login as the correct role type
      if (selectedLoginType === 'admin' && userData.role !== 'admin' && userData.role !== 'superadmin') {
        throw new Error(t('invalid Admin'));
      } else if (selectedLoginType === 'user' && userData.role !== 'retiree') {
        throw new Error(t('invalid User'));
      }

      setRole(userData.role); // Set global role state
      toast.success(t('login success'));
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || t('login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    navigate('/sign up', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-b from-gray-100 to-gray-200">
      <Toaster position="top-right" />
      
      {/* Left - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Logo or Brand Name - Visible on mobile */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#FFD966]">{t('brand')}</h1>
          </div>

          {/* Header */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            {t('login Title')}
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
              {t('user')}
            </button>
            <button
              onClick={() => setSelectedLoginType("admin")}
              className={`px-4 sm:px-6 py-2 text-sm sm:text-base font-semibold transition duration-200 ${
                selectedLoginType === "admin"
                  ? "bg-[#FFD966] text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              } rtl:rounded-l-full ltr:rounded-r-full`}
            >
              {t('admin')}
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
                  placeholder={t('email')}
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
                  placeholder={t('password')}
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
                {t('forgot Password')}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#FFD966] text-gray-900 rounded-lg text-sm sm:text-base font-semibold hover:bg-yellow-400 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isLoading ? t('signingIn') : t('signIn')}
            </button>

            {/* Footer Text */}
            <div className="text-center text-sm sm:text-base space-x-1">
              <span className="text-gray-600">{t('newAccount')}</span>
              <button
                type="button"
                onClick={handleSignUp}
                className="font-semibold text-[#FFD966] hover:text-yellow-500 transition duration-200"
              >
                {t('signUp')}
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
            alt={t('login Image')}
            className="w-full h-full object-cover object-[center_10%]"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
