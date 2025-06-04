import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import Dashboard from './components/RetireeProfile/Dashboard';
import AdminDashboard from './components/AdminProfile/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminProfile/SuperAdminDashboard';
import Login from './components/Login';

const RoleBasedDashboard = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          console.error('User doc not found');
          navigate('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [navigate]);

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
