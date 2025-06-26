import React from 'react';

const ConfirmDisableModal = ({ open, settlement, onCancel, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] max-w-[90vw] text-center">
        <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Disable</h2>
        <p className="mb-4">
          Are you sure you want to disable and remove <b>{settlement}</b>?<br />
          This action cannot be undone.
        </p>
        <div className="flex justify-center gap-4">
          <button
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            onClick={onCancel}
            aria-label="Cancel disable"
          >
            Cancel
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={onConfirm}
            aria-label="Confirm disable"
          >
            Yes, Disable
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDisableModal; 