import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import LoginPage from './components/Login';
import SignUp from './components/SignUp/SignUp';
import ForgotPassword from './components/ForgotPassword';
import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useLocation } from "react-router-dom";
import RoleBasedDashboard from './RoleBasedDashboard';
import ViewProfileDashboard from './components/ViewProfile/ViewProfileDashboard';
import AdminDashboard from './components/AdminProfile/AdminDashboard';
import AdminManagement from './components/SuperAdminProfile/Admins.jsx';
import AdminSettlements from './components/SignUp/AdminSettlements';

const AppRoutes = () => {
  const { language } = useLanguage();

  // Set document direction based on language
  useEffect(() => {
    const rtlLanguages = ['he', 'ar'];
    document.documentElement.dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isViewProfile = location.pathname.startsWith("/view-profile");

  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboard && !isViewProfile && (
        <div className="fixed top-2 right-2 z-50">
          <LanguageSwitcher />
        </div>
      )}
      
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } 
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleBasedDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/view-profile"
          element={
            <ProtectedRoute>
              <ViewProfileDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/admins"
          element={
            <ProtectedRoute>
              <AdminManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/settlements"
          element={
            <ProtectedRoute>
              <AdminSettlements />
            </ProtectedRoute>
          }
        />
        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

export default AppRoutes; 