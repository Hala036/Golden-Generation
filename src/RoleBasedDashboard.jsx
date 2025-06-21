import { useAuth } from './hooks/useAuth';
import { useNavigate } from 'react-router-dom';

import Dashboard from './components/RetireeProfile/Dashboard';
import AdminDashboard from './components/AdminProfile/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminProfile/SuperAdminDashboard';
import Login from './components/Login';

const RoleBasedDashboard = () => {
  const { user, role, loading, error, retryFetchRole } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if no user
  if (!user && !loading) {
    navigate('/login');
    return null;
  }

  // Show error message if there's an error
  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Connection Error</p>
          <p>{error}</p>
          <button 
            onClick={retryFetchRole} 
            className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
