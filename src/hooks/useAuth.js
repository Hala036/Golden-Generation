import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const fetchUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setRole(userData.role);
        setError(null);
        retryCountRef.current = 0;
        return userData.role;
      } else {
        console.error('User doc not found');
        setError('User profile not found');
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      
      if (error.message && error.message.includes('offline')) {
        setError('You are currently offline. Please check your internet connection.');
        
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          console.log(`Retrying role fetch in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
          
          setTimeout(() => {
            fetchUserRole(uid);
          }, delay);
          return null;
        } else {
          setError('Unable to connect to the server after multiple attempts.');
        }
      } else {
        setError('An error occurred while loading your profile.');
      }
      
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        setLoading(true);
        await fetchUserRole(user.uid);
      } else {
        setRole(null);
        setError(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const retryFetchRole = () => {
    if (user) {
      retryCountRef.current = 0;
      setLoading(true);
      fetchUserRole(user.uid).finally(() => setLoading(false));
    }
  };

  return {
    user,
    role,
    loading,
    error,
    retryFetchRole,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isSuperAdmin: role === 'superadmin',
    isRetiree: role === 'retiree'
  };
}; 