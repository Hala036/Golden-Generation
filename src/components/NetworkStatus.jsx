import { useState, useEffect } from 'react';
import { FaWifi, FaWifiSlash } from 'react-icons/fa';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-3 z-50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FaWifiSlash className="text-lg" />
        <span>You are currently offline. Some features may not work properly.</span>
      </div>
      <button
        onClick={() => setShowOfflineBanner(false)}
        className="text-white hover:text-gray-200 text-sm"
      >
        ×
      </button>
    </div>
  );
};

export default NetworkStatus; 