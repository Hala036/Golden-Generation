import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Global cache for data
const dataCache = new Map();
const cacheTimeout = 10 * 60 * 1000; // 10 minutes

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const useOptimizedData = (collectionName, options = {}) => {
  const {
    filters = [],
    orderByField = null,
    orderDirection = 'asc',
    limitCount = null,
    realtime = false,
    cacheKey = null,
    debounceMs = 300,
    dependencies = []
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const abortControllerRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Generate cache key
  const effectiveCacheKey = useMemo(() => {
    if (cacheKey) return cacheKey;
    return `${collectionName}_${JSON.stringify(filters)}_${orderByField}_${orderDirection}_${limitCount}`;
  }, [collectionName, filters, orderByField, orderDirection, limitCount, cacheKey]);

  // Build query
  const buildQuery = useCallback(() => {
    let q = collection(db, collectionName);
    
    // Apply filters
    filters.forEach(filter => {
      if (filter.field && filter.operator && filter.value !== undefined) {
        q = query(q, where(filter.field, filter.operator, filter.value));
      }
    });
    
    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    // Apply limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    return q;
  }, [collectionName, filters, orderByField, orderDirection, limitCount]);

  // Fetch data with caching
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = dataCache.get(effectiveCacheKey);
        if (cached && Date.now() - cached.timestamp < cacheTimeout) {
          setData(cached.data);
          setLastUpdated(cached.timestamp);
          setLoading(false);
          setError(null);
          return cached.data;
        }
      }

      setLoading(true);
      setError(null);

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const q = buildQuery();
      const snapshot = await getDocs(q);
      
      const fetchedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cache the data
      dataCache.set(effectiveCacheKey, {
        data: fetchedData,
        timestamp: Date.now()
      });

      setData(fetchedData);
      setLastUpdated(Date.now());
      setLoading(false);
      setError(null);

      return fetchedData;
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      console.error(`Error fetching data from ${collectionName}:`, err);
      setError(err.message);
      setLoading(false);
    }
  }, [collectionName, effectiveCacheKey, buildQuery]);

  // Debounced fetch function
  const debouncedFetch = useMemo(
    () => debounce(fetchData, debounceMs),
    [fetchData, debounceMs]
  );

  // Real-time listener
  const setupRealtimeListener = useCallback(() => {
    if (!realtime) return;

    // Clean up previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    try {
      const q = buildQuery();
      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
          const fetchedData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Update cache
          dataCache.set(effectiveCacheKey, {
            data: fetchedData,
            timestamp: Date.now()
          });

          setData(fetchedData);
          setLastUpdated(Date.now());
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error(`Error in realtime listener for ${collectionName}:`, err);
          setError(err.message);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(`Error setting up realtime listener for ${collectionName}:`, err);
      setError(err.message);
      setLoading(false);
    }
  }, [realtime, buildQuery, effectiveCacheKey, collectionName]);

  // Main effect for data fetching
  useEffect(() => {
    if (realtime) {
      setupRealtimeListener();
    } else {
      debouncedFetch();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [realtime, setupRealtimeListener, debouncedFetch, ...dependencies]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Clear cache for this collection
  const clearCache = useCallback(() => {
    dataCache.delete(effectiveCacheKey);
  }, [effectiveCacheKey]);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    dataCache.clear();
  }, []);

  // Get cache info
  const getCacheInfo = useCallback(() => {
    const cached = dataCache.get(effectiveCacheKey);
    return {
      hasCache: !!cached,
      timestamp: cached?.timestamp,
      age: cached ? Date.now() - cached.timestamp : null,
      isValid: cached ? (Date.now() - cached.timestamp < cacheTimeout) : false
    };
  }, [effectiveCacheKey]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    clearCache,
    clearAllCache,
    getCacheInfo,
    // Additional utilities
    isEmpty: data.length === 0,
    count: data.length,
    hasData: data.length > 0
  };
};

// Specialized hooks for common use cases
export const useSettlements = (options = {}) => {
  return useOptimizedData('settlements', {
    orderByField: 'name',
    orderDirection: 'asc',
    ...options
  });
};

export const useUsers = (filters = [], options = {}) => {
  return useOptimizedData('users', {
    filters,
    orderByField: 'personalDetails.firstName',
    orderDirection: 'asc',
    ...options
  });
};

export const useEvents = (filters = [], options = {}) => {
  return useOptimizedData('events', {
    filters,
    orderByField: 'startDate',
    orderDirection: 'desc',
    ...options
  });
};

export const useJobRequests = (filters = [], options = {}) => {
  return useOptimizedData('jobRequests', {
    filters,
    orderByField: 'createdAt',
    orderDirection: 'desc',
    ...options
  });
};

export const useServiceRequests = (filters = [], options = {}) => {
  return useOptimizedData('serviceRequests', {
    filters,
    orderByField: 'createdAt',
    orderDirection: 'desc',
    ...options
  });
};

export default useOptimizedData; 