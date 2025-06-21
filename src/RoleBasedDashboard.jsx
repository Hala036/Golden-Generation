import useSignupStore from './store/signupStore';
import { useAuth } from './context/AuthContext'; // Use context for user session
import { useNavigate } from 'react-router-dom';

import Dashboard from './components/RetireeProfile/Dashboard';
import AdminDashboard from './components/AdminProfile/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminProfile/SuperAdminDashboard';
import Login from './components/Login';

const RoleBasedDashboard = () => {
  const { currentUser, loading } = useAuth(); // from AuthContext
  const { role } = useSignupStore(); // from Zustand store
  const navigate = useNavigate();

  if (loading) return <div className="p-4">Loading dashboard...</div>;

  // Redirect to login if no user
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  
  switch (role) {
    case 'superadmin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'retiree':
      return <Dashboard />;
    default:
      // If role is not set, it might be a new login.
      // We could wait or redirect. For now, showing unauthorized.
      return <div className="p-4">Unauthorized or role not found.</div>;
  }
};

export default RoleBasedDashboard;
