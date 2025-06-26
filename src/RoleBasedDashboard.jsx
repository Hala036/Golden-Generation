import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getUserData } from './firebase';

import Dashboard from './components/RetireeProfile/RetireeDashboard';
import Shared from './components/SharedDashboard/SharedDashboard';
import AdminDashboard from './components/AdminProfile/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminProfile/SuperAdminDashboard';
import Login from './components/Login';

const RoleBasedDashboard = () => {
  const { currentUser, loading } = useAuth(); // from AuthContext
  const { role, setRole } = useSignupStore(); // from Zustand store
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !role) {
      getUserData(currentUser.uid).then(userData => {
        if (userData?.role) setRole(userData.role);
      });
    }
  }, [currentUser, role, setRole]);


  if (loading) return <div className="p-4">Loading dashboard...</div>;

  switch (role) {
    case 'superadmin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'retiree':
      return <Dashboard />;
    case undefined:
      return <Login />;
    default:
      return <div className="p-4">Unauthorized or unknown role.</div>;
  }
};

export default RoleBasedDashboard;
