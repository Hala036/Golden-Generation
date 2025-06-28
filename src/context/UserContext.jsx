import React, { createContext, useState, useEffect, useCallback } from "react";
import { auth, getUserData } from "../firebase";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (user) => {
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      console.debug('[UserContext] Fetching user data for:', user.uid);
      const data = await getUserData(user.uid);
      console.debug('[UserContext] User data fetched:', data);
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setLoading(true);
      await fetchUserData(currentUser);
    }
  }, [fetchUserData]);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      await fetchUserData(user);
    });
    return () => unsubscribe();
  }, [fetchUserData]);

  return (
    <UserContext.Provider value={{ userData, loading, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
};
