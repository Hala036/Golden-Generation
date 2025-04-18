import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set persistence to local
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error('Error setting auth persistence:', error);
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { currentUser, loading, signOut };
}; 