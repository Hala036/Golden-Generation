import React, { useState, useEffect } from 'react';
import EnhancedToast from './EnhancedToast';

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Listen for custom toast events
    const handleToast = (event) => {
      const { type, message, title, duration, action, actionLabel, persistent } = event.detail;
      addToast({ type, message, title, duration, action, actionLabel, persistent });
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleToastClose = (id) => {
    removeToast(id);
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 1000 - index
          }}
        >
          <EnhancedToast
            {...toast}
            onClose={() => handleToastClose(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Helper function to show toasts
export const showToast = (options) => {
  const event = new CustomEvent('show-toast', { detail: options });
  window.dispatchEvent(event);
};

// Convenience functions
export const showSuccessToast = (message, title = 'Success', options = {}) => {
  showToast({ type: 'success', message, title, ...options });
};

export const showErrorToast = (message, title = 'Error', options = {}) => {
  showToast({ type: 'error', message, title, ...options });
};

export const showWarningToast = (message, title = 'Warning', options = {}) => {
  showToast({ type: 'warning', message, title, ...options });
};

export const showInfoToast = (message, title = 'Info', options = {}) => {
  showToast({ type: 'info', message, title, ...options });
};

export const showLoadingToast = (message, title = 'Processing', options = {}) => {
  showToast({ 
    type: 'info', 
    message, 
    title, 
    persistent: true, 
    duration: 0,
    ...options 
  });
};

export default ToastManager; 