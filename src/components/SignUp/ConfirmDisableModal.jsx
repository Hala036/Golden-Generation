import React, { useEffect } from 'react';
import { FaExclamationTriangle, FaTrash, FaTimes, FaCheck } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

const ConfirmDisableModal = ({ open, settlement, onCancel, onConfirm, loading = false }) => {
  const { t, language } = useLanguage();
  const isRTL = ['he', 'ar'].includes(language);

  console.log('ConfirmDisableModal render:', { open, settlement, loading });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onCancel();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      {/* Backdrop with animation */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onCancel}
        aria-hidden="true"
      />
      
      {/* Modal with animation */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="text-red-600 text-xl" />
            </div>
            <div>
              <h2 
                id="modal-title"
                className="text-xl font-bold text-gray-900"
                style={isRTL ? { fontFamily: 'Assistant, Rubik, Noto Sans Hebrew, Arial, sans-serif' } : {}}
              >
                {t('settlementsManager.Confirm Disable')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('settlementsManager.This action cannot be undone')}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
            aria-label={t('common.close') || 'Close'}
            disabled={loading}
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FaExclamationTriangle className="text-red-500 text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p 
                    id="modal-description"
                    className="text-gray-700 leading-relaxed"
                    style={isRTL ? { fontFamily: 'Assistant, Rubik, Noto Sans Hebrew, Arial, sans-serif' } : {}}
                  >
                    {t('settlementsManager.Are you sure you want to disable and remove') }
                    <span className="font-bold text-gray-900 mx-1">{settlement}</span>
                    {t('?')}
                  </p>
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    {t('settlementsManager.This will remove the settlement from available settlements and delete all associated data')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => {
                console.log('Cancel button clicked');
                onCancel();
              }}
              disabled={loading}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              aria-label={t('common.cancel') || 'Cancel'}
            >
              <FaTimes className="text-sm" />
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={() => {
                console.log('Confirm button clicked');
                onConfirm();
              }}
              disabled={loading}
              className="flex-1 px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              aria-label={t('settlementsManager.Yes, Disable')}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaTrash className="text-sm" />
              )}
              {loading 
                ? (t('common.processing') || 'Processing...') 
                : t('settlementsManager.Yes, Disable')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDisableModal; 