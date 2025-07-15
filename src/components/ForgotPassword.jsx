import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import coupleimage from '../assets/couple.png';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(t('auth.forgotPassword.success'));
      // Optionally navigate back to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error(error.message || t('auth.forgotPassword.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-b from-gray-100 to-gray-200">
      {/* Left - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#FFD966]">{t('auth.forgotPassword.logo')}</h1>
          </div>

          {/* Header */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            {t('auth.forgotPassword.title')}
          </h2>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-4 mt-8">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.forgotPassword.emailPlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFD966] focus:border-transparent transition duration-200"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#FFD966] text-gray-900 rounded-lg text-sm sm:text-base font-semibold hover:bg-yellow-400 transition duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendLink')}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm sm:text-base font-medium text-gray-600 hover:text-gray-800 transition duration-200"
            >
              {t('auth.forgotPassword.backToLogin')}
            </button>
          </div>
        </div>
      </div>

      {/* Right - Image Section */}
      <div className="hidden lg:block lg:w-1/2 bg-[#FFD966] relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={coupleimage}
            alt={t('auth.login.imageAlt')}
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 