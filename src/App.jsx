import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LanguageProvider } from './context/LanguageContext';

import Login from './components/Login';
import SignUp from './components/SignUp/SignUp';
import Dashboard from './components/RetireeProfile/RetireeDashboard';
import ForgotPassword from './components/ForgotPassword';

import './App.css';
import AppRoutes from './AppRoutes';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return currentUser ? children : <Navigate to="/login" />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return !currentUser ? children : <Navigate to="/dashboard" />;
};

const App = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Toaster position="top-right" />
          <AppRoutes />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
