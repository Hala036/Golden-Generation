import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

import Dashboard from './components/RetireeProfile/RetireeDashboard';
import Shared from './components/SharedDashboard/SharedDashboard';
import AdminDashboard from './components/AdminProfile/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminProfile/SuperAdminDashboard';
import Login from './components/Login';

// Enhanced Unauthorized Page as a standalone component
const UnauthorizedPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/login', { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-yellow-50 to-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <div className="mb-4">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto text-yellow-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Unauthorized</h1>
        <p className="mb-4 text-gray-700">You do not have permission to view this page.<br/>Please log in with an authorized account.</p>
        <button
          onClick={async () => {
            const auth = getAuth();
            await signOut(auth);
            window.location.href = '/login';
          }}
          className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded font-semibold shadow"
        >
          Go back to login
        </button>
      </div>
    </div>
  );
};

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
          const firestoreRole = userDoc.data().role;
          setRole(firestoreRole ? firestoreRole.toLowerCase() : undefined);
          console.log('User role:', firestoreRole ? firestoreRole.toLowerCase() : undefined);
        } else {
          console.debug('User doc not found for UID:', currentUser.uid, '(This is normal during user creation)');
          // Don't navigate to login immediately, give some time for the document to be created
          // This can happen during the signup process
          let retryCount = 0;
          const maxRetries = 3;
          
          const retryFetchUserRole = async () => {
            if (retryCount >= maxRetries) {
              console.error('User doc still not found after', maxRetries, 'retries');
              navigate('/login');
              return;
            }
            
            retryCount++;
            console.log(`Retrying user role fetch (attempt ${retryCount}/${maxRetries})...`);
            
            setTimeout(async () => {
              try {
                const retryDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (retryDoc.exists()) {
                  const retryRole = retryDoc.data().role;
                  setRole(retryRole ? retryRole.toLowerCase() : undefined);
                  console.log('User role found on retry:', retryRole ? retryRole.toLowerCase() : undefined);
                } else {
                  retryFetchUserRole();
                }
              } catch (error) {
                console.error('Error during retry:', error);
                retryFetchUserRole();
              }
            }, 1000 * retryCount); // Increasing delay for each retry
          };
          
          retryFetchUserRole();
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

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/login', { replace: true });
      }
    });
    return () => unsubscribe();
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
      return <div className="p-4">Unauthorized or unknown user.</div>;
  }
};

export default RoleBasedDashboard;
