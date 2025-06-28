import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaSpinner } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const EnhancedToast = ({ 
  type = 'info', 
  message, 
  title, 
  duration = 5000, 
  onClose, 
  action, 
  actionLabel,
  persistent = false 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const { language } = useLanguage();
  const isRTL = ['he', 'ar'].includes(language);

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, persistent]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const handleAction = () => {
    action?.();
    handleClose();
  };

  const getToastStyles = () => {
    const baseStyles = "relative overflow-hidden rounded-xl shadow-2xl border transition-all duration-300 transform";
    const rtlStyles = isRTL ? "text-right" : "text-left";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-800 ${rtlStyles}`;
      case 'error':
        return `${baseStyles} bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-800 ${rtlStyles}`;
      case 'warning':
        return `${baseStyles} bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800 ${rtlStyles}`;
      case 'info':
      default:
        return `${baseStyles} bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-800 ${rtlStyles}`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-600 text-xl" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-600 text-xl" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-600 text-xl" />;
      case 'info':
      default:
        return <FaInfoCircle className="text-blue-600 text-xl" />;
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`${getToastStyles()} ${
        isExiting 
          ? 'translate-x-full opacity-0 scale-95' 
          : 'translate-x-0 opacity-100 scale-100'
      }`}
      style={{ 
        minWidth: '320px', 
        maxWidth: '480px',
        fontFamily: isRTL ? 'Assistant, Rubik, Noto Sans Hebrew, Arial, sans-serif' : undefined
      }}
      role="alert"
      aria-live="assertive"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Progress bar */}
      {!persistent && duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className={`h-full ${getProgressColor()} transition-all duration-300 ease-linear`}
            style={{ 
              width: isExiting ? '0%' : '100%',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="font-semibold text-sm mb-1 leading-tight">
                {title}
              </h4>
            )}
            <p className="text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-black hover:bg-opacity-10"
            aria-label="Close notification"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Action button */}
        {action && actionLabel && (
          <div className={`mt-3 flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleAction}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                type === 'success' 
                  ? 'bg-green-200 hover:bg-green-300 text-green-800' 
                  : type === 'error'
                  ? 'bg-red-200 hover:bg-red-300 text-red-800'
                  : type === 'warning'
                  ? 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'
                  : 'bg-blue-200 hover:bg-blue-300 text-blue-800'
              }`}
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>

      {/* Loading overlay for persistent toasts */}
      {persistent && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <FaSpinner className="text-gray-400 animate-spin text-lg" />
        </div>
      )}
    </div>
  );
};

export default EnhancedToast; 