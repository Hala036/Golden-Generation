import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast, showLoadingToast } from './ToastManager';
import ConfirmDisableModal from './SignUp/ConfirmDisableModal';

const UXDemo = () => {
  const { t, language } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const isRTL = ['he', 'ar'].includes(language);

  const handleShowSuccessToast = () => {
    showSuccessToast(
      t('auth.adminSettlements.messages.addedSuccess') || 'Settlement "Demo Settlement" added successfully',
      t('auth.adminSettlements.messages.addedTitle') || 'Settlement Added',
      {
        duration: 6000,
        action: () => {
          showInfoToast('Undo functionality would be implemented here', 'Feature Preview');
        },
        actionLabel: t('common.undo') || 'Undo'
      }
    );
  };

  const handleShowErrorToast = () => {
    showErrorToast(
      t('auth.adminSettlements.messages.disableError') || 'Failed to disable settlement. Please try again.',
      t('auth.adminSettlements.messages.errorTitle') || 'Error',
      {
        duration: 8000,
        action: () => {
          showInfoToast('Retry functionality would be implemented here', 'Feature Preview');
        },
        actionLabel: t('common.retry') || 'Retry'
      }
    );
  };

  const handleShowWarningToast = () => {
    showWarningToast(
      t('auth.adminSettlements.messages.alreadyExists') || 'Settlement "Demo" already exists',
      t('auth.adminSettlements.messages.warningTitle') || 'Warning'
    );
  };

  const handleShowInfoToast = () => {
    showInfoToast(
      'This is an informational message with additional details about the current operation.',
      'Information'
    );
  };

  const handleShowLoadingToast = () => {
    const loadingToast = showLoadingToast(
      'Processing your request...',
      'Please wait'
    );
    
    // Simulate loading
    setTimeout(() => {
      showSuccessToast('Operation completed successfully!', 'Success');
    }, 3000);
  };

  const handleShowModal = () => {
    setShowModal(true);
  };

  const handleModalConfirm = async () => {
    setModalLoading(true);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setModalLoading(false);
    setShowModal(false);
    showSuccessToast('Settlement disabled successfully!', 'Success');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Enhanced UX/UI Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Toast Demonstrations */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Enhanced Toast Notifications
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={handleShowSuccessToast}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Show Success Toast
              </button>
              
              <button
                onClick={handleShowErrorToast}
                className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Show Error Toast
              </button>
              
              <button
                onClick={handleShowWarningToast}
                className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                Show Warning Toast
              </button>
              
              <button
                onClick={handleShowInfoToast}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Show Info Toast
              </button>
              
              <button
                onClick={handleShowLoadingToast}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                Show Loading Toast
              </button>
            </div>
          </div>

          {/* Modal Demonstration */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Enhanced Confirmation Modal
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={handleShowModal}
                className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Show Disable Confirmation Modal
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Features Demonstrated:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Animated toast notifications with progress bars</li>
                <li>• Action buttons in toasts (Undo, Retry)</li>
                <li>• Loading states with spinners</li>
                <li>• Enhanced modal with better UX</li>
                <li>• RTL support for Hebrew and Arabic</li>
                <li>• Accessibility improvements</li>
                <li>• Smooth animations and transitions</li>
                <li>• Better error handling and user feedback</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Language Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Current Language:</strong> {language} 
            {isRTL && <span className="ml-2">(RTL Mode)</span>}
          </p>
        </div>
      </div>

      {/* Enhanced Modal */}
      <ConfirmDisableModal
        open={showModal}
        settlement="Demo Settlement"
        onCancel={() => setShowModal(false)}
        onConfirm={handleModalConfirm}
        loading={modalLoading}
      />
    </div>
  );
};

export default UXDemo; 