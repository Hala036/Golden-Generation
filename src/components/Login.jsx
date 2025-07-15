import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, getUserData } from "../firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { toast, Toaster } from "react-hot-toast";
import coupleimage from "../assets/couple.png";
import useSignupStore from '../store/signupStore';
import { useTranslation } from 'react-i18next';
import PasswordInput from './PasswordInput';
import Modal from './Modal';
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";

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
  const [showRoleErrorModal, setShowRoleErrorModal] = useState(false);
  const [roleErrorMessage, setRoleErrorMessage] = useState('');

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
      // Fetch user document by email first
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('credentials.email', '==', formData.email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setRoleErrorMessage(t('auth.login.errors.noAccountFound'));
        setShowRoleErrorModal(true);
        setIsLoading(false);
        return;
      }
      const userData = querySnapshot.docs[0].data();
      if (!userData?.role) {
        setRoleErrorMessage(t('auth.login.errors.userRoleNotFound'));
        setShowRoleErrorModal(true);
        setIsLoading(false);
        return;
      }
      // Only allow login if attempting to login as the correct role type
      if (selectedLoginType === 'admin' && userData.role !== 'admin' && userData.role !== 'superadmin') {
        setRoleErrorMessage(t('auth.login.errors.accessDeniedWrongRole'));
        setShowRoleErrorModal(true);
        setIsLoading(false);
        return;
      } else if (selectedLoginType === 'user' && userData.role !== 'retiree') {
        setRoleErrorMessage(t('auth.login.errors.accessDeniedWrongRole'));
        setShowRoleErrorModal(true);
        setIsLoading(false);
        return;
      }
      // If role matches, proceed to sign in
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      setRole(userData.role); // Set global role state
      toast.success(t('auth.login.success'));
      navigate('/dashboard');
    } catch (error) {
      let errorMessage = '';
      if (error.code === 'auth/user-not-found') {
        errorMessage = t('auth.login.errors.userNotFound') || 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = t('auth.login.errors.wrongPassword') || 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.login.errors.invalidEmail') || 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('auth.login.errors.tooManyRequests') || 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = t('auth.login.errors.invalidCredential') || 'Incorrect email or password. Please try again.';
      } else {
        errorMessage = error.message || t('auth.login.errors.generic') || 'Failed to login. Please check your credentials.';
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    navigate('/signup', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-b from-gray-100 to-gray-200">
      <Toaster position="top-right" />
      {/* Hebrew Title - Always Visible, Ordered Presentation */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
        <div className="w-full text-center mt-8 mb-4 flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2" style={{ direction: 'rtl' }}>
            {t('auth.login.mainTitle')}
          </h1>
          <div className="w-24 border-b-2 border-yellow-400 mb-2"></div>
          <h2 className="text-xl sm:text-2xl font-medium text-gray-700" style={{ direction: 'rtl' }}>
            {t('auth.login.subTitle')}
          </h2>
        </div>
        {/* Centered Form Section */}
        <div className="w-full max-w-md flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full space-y-4 sm:space-y-6">
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
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('auth.login.email')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFD966] focus:border-transparent transition duration-200"
                    required
                  />
                </div>
                <div>
                  <PasswordInput
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t("auth.login.password")}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFD966] focus:border-transparent transition duration-200"
                    autoComplete="current-password"
                    required
                  />
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-sm sm:text-base font-medium text-gray-600 hover:text-gray-800 transition duration-200"
                    >
                      {t('auth.login.forgotPassword')}
                    </button>
                  </div>
                </div>
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
                  className="font-semibold text-yellow-700 hover:text-yellow-800 transition duration-200"
                >
                  {t('auth.login.signUp')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Right - Image Section (only on large screens) */}
      <div className="hidden lg:block lg:w-1/2 bg-[#FFD966] relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={coupleimage}
            alt="Couple enjoying event"
            className="w-full h-full object-cover object-[center_10%]"
          />
        </div>
      </div>
      {/* Modal for Role Error */}
      <Modal
        title={t('auth.login.modal.accessDenied')}
        onClose={() => setShowRoleErrorModal(false)}
        show={showRoleErrorModal}
      >
        <div className="text-center">
          <p className="mb-4">{roleErrorMessage || t('auth.login.errors.defaultRoleError')}</p>
          <button
            className="px-4 py-2 bg-yellow-400 rounded text-gray-900 font-semibold hover:bg-yellow-500 transition"
            onClick={() => setShowRoleErrorModal(false)}
          >
            {t('common.ok')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;


