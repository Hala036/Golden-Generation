import { useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

// Cache for user data
const userDataCache = new Map();
const cacheTimeout = 5 * 60 * 1000; // 5 minutes

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized user ID
  const userId = useMemo(() => user?.uid, [user?.uid]);

  // Fetch user data with caching
  const fetchUserData = useCallback(async (uid) => {
    try {
      // Check cache first
      const cached = userDataCache.get(uid);
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        setUserData(cached.data);
        return cached.data;
      }

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = { id: userDoc.id, ...userDoc.data() };
        
        // Cache the data
        userDataCache.set(uid, {
          data,
          timestamp: Date.now()
        });
        
        setUserData(data);
        return data;
      } else {
        setError('User data not found');
        return null;
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Real-time user data listener
  useEffect(() => {
    if (!userId) {
      setUserData(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (doc) => {
        if (doc.exists()) {
          const data = { id: doc.id, ...doc.data() };
          
          // Update cache
          userDataCache.set(userId, {
            data,
            timestamp: Date.now()
          });
          
          setUserData(data);
          setError(null);
        } else {
          setUserData(null);
          setError('User data not found');
        }
      },
      (err) => {
        console.error('Error listening to user data:', err);
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setLoading(true);
        setError(null);
        
        if (firebaseUser) {
          setUser(firebaseUser);
          await fetchUserData(firebaseUser.uid);
        } else {
          setUser(null);
          setUserData(null);
          // Clear cache when user logs out
          userDataCache.clear();
        }
        
        setLoading(false);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fetchUserData]);

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await signOut(auth);
      // Clear cache on logout
      userDataCache.clear();
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoized computed values
  const isAuthenticated = useMemo(() => !!user, [user]);
  const isAdmin = useMemo(() => userData?.role === 'admin', [userData?.role]);
  const isSuperAdmin = useMemo(() => userData?.role === 'superadmin', [userData?.role]);
  const isRetiree = useMemo(() => userData?.role === 'retiree', [userData?.role]);
  const userRole = useMemo(() => userData?.role || 'guest', [userData?.role]);
  const userSettlement = useMemo(() => userData?.idVerification?.settlement, [userData?.idVerification?.settlement]);

  // Clear cache function
  const clearCache = useCallback(() => {
    userDataCache.clear();
  }, []);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (userId) {
      // Remove from cache to force refresh
      userDataCache.delete(userId);
      await fetchUserData(userId);
    }
  }, [userId, fetchUserData]);

  return {
    user,
    userData,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isRetiree,
    userRole,
    userSettlement,
    logout,
    clearCache,
    refreshUserData,
    userId
  };
};

export default useAuth; 