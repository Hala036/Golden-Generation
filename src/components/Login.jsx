import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, getUserData } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast, Toaster } from "react-hot-toast";
import coupleimage from "../assets/couple.png";
import useSignupStore from '../store/signupStore';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const { t } = useTranslation();
  const { setRole } = useSignupStore();
  const navigate = useNavigate();

  const [selectedLoginType, setSelectedLoginType] = useState("user");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const userData = await getUserData(userCredential.user.uid);

      if (!userData?.role) throw new Error('User role not found');

      if (
        (selectedLoginType === 'admin' && userData.role !== 'admin' && userData.role !== 'superadmin') ||
        (selectedLoginType === 'user' && userData.role !== 'retiree')
      ) {
        throw new Error(`Invalid login type. Please login as ${selectedLoginType}`);
      }

      setRole(userData.role);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    navigate('/signup', { replace: true });
  };

  const eyeOpen = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWV5ZS1pY29uIGx1Y2lkZS1leWUiPjxwYXRoIGQ9Ik0yLjI2MiAxMi4wMDFjMS4yNjctNC41OTYgNS41MzgtOC4wMDEgOS43MzczLTggNC4xOTUgMCA4LjIxMiAzLjI1OSA5LjU0NiA3Ljc4MSIvPjxwYXRoIGQ9Ik0yMS43MzggMTIuMDAxYy0xLjI2NyA0LjU5Ni01LjUzOCA4LjAwMS05LjczOCA4LjAwMS00LjE5NSAwLTguMjEyLTMuMjU5LTkuNTQ2LTcuNzgxIi8+PHBhdGggZD0iTTEyIDE1YTMgMyAwIDEgMCAwLTYgMyAzIDAgMCAwIDAgNiIvPjwvc3ZnPg==";
  const eyeClosed = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWV5ZS1jbG9zZWQtaWNvbiBsdWNpZGUtZXllLWNsb3NlZCI+PHBhdGggZD0ibTE1IDE4LS43MjItMy4yNSIvPjxwYXRoIGQ9Ik0yIDhhMTAuNjQ1IDEwLjY0NSAwIDAgMCAyMCAwIi8+PHBhdGggZD0ibTIwIDE1LTEuNzI2LTIuMDUiLz48cGF0aCBkPSJtNCAxNSAxLjcyNi0yLjA1Ii8+PHBhdGggZD0ibTkgMTggLjcyMi0zLjI1Ii8+PC9zdmc+";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-b from-gray-100 to-gray-200">
      <Toaster position="top-right" />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#FFD966]">Golden Generation</h1>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            {t('auth.login.title')}
          </h2>

          <div className="flex justify-center bg-white rounded-full w-fit mx-auto shadow-md">
            {["user", "admin"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedLoginType(type)}
                className={`px-4 sm:px-6 py-2 text-sm sm:text-base font-semibold transition duration-200 ${
                  selectedLoginType === type
                    ? "bg-[#FFD966] text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                } ${type === "user" ? "rtl:rounded-r-full ltr:rounded-l-full" : "rtl:rounded-l-full ltr:rounded-r-full"}`}
              >
                {t(`auth.login.${type}`)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-8">
            <div className="space-y-4">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('auth.login.email')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFD966] focus:border-transparent transition duration-200"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.login.password')}
                  className="w-full pr-12 pl-4 py-3 rounded-lg border border-gray-300 bg-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFD966] focus:border-transparent transition duration-200"
                  required
                />
                {formData.password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center"
                    tabIndex={-1}
                  >
                    <img
                      src={showPassword ? eyeClosed : eyeOpen}
                      alt="Toggle visibility"
                      className="h-5 w-5 opacity-70 hover:opacity-100 transition"
                    />
                  </button>
                )}
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
