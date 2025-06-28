import React, { useState } from 'react';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import { validateEmail, validateUsername, validatePhoneNumber } from '../../utils/validation';
import { FaInfoCircle } from 'react-icons/fa';

const AssignAdminModal = ({
  open,
  onClose,
  selectedSettlement,
  onAdminCreated,
  checkEmailExists,
  checkUsernameExists,
  creatingAdmin,
}) => {
  const emailField = useFieldValidation({
    validate: validateEmail,
    checkExists: checkEmailExists,
    existsError: 'Email is already registered',
  });
  const usernameField = useFieldValidation({
    validate: validateUsername,
    checkExists: checkUsernameExists,
    existsError: 'Username is already taken',
  });
  const phoneField = useFieldValidation({
    validate: validatePhoneNumber,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    emailField.onBlur();
    usernameField.onBlur();
    phoneField.onBlur();
    
    const valid = !emailField.error && !usernameField.error && !phoneField.error
      && emailField.value && usernameField.value && phoneField.value;
    
    if (!valid) return;
    
    onAdminCreated({
      email: emailField.value,
      username: usernameField.value,
      phone: phoneField.value,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"></div>
      <div className="bg-white rounded-xl shadow-lg p-8 min-w-[350px] max-w-[90vw] relative z-50">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">
          Assign Admin to <span className="text-yellow-600">{selectedSettlement}</span>
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="Admin Email"
            value={emailField.value}
            onChange={emailField.onChange}
            onBlur={emailField.onBlur}
            className={`px-3 py-2 border rounded ${emailField.error ? 'border-red-500' : 'border-gray-300'}`}
            disabled={creatingAdmin}
            aria-label="Admin Email"
          />
          {emailField.isChecking && (
            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <FaInfoCircle className="flex-shrink-0" />Checking...
            </span>
          )}
          {emailField.error && (
            <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
              <FaInfoCircle className="flex-shrink-0" />
              {emailField.error}
            </span>
          )}

          <label className="block text-sm font-medium text-gray-700 mt-2">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Username"
            value={usernameField.value}
            onChange={usernameField.onChange}
            onBlur={usernameField.onBlur}
            className={`px-3 py-2 border rounded ${usernameField.error ? 'border-red-500' : 'border-gray-300'}`}
            disabled={creatingAdmin}
            aria-label="Admin Username"
          />
          {usernameField.isChecking && (
            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <FaInfoCircle className="flex-shrink-0" />Checking...
            </span>
          )}
          {usernameField.error && (
            <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
              <FaInfoCircle className="flex-shrink-0" />
              {usernameField.error}
            </span>
          )}

          <label className="block text-sm font-medium text-gray-700 mt-2">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Phone (e.g., 05XXXXXXXX)"
            value={phoneField.value}
            onChange={phoneField.onChange}
            onBlur={phoneField.onBlur}
            className={`px-3 py-2 border rounded ${phoneField.error ? 'border-red-500' : 'border-gray-300'}`}
            disabled={creatingAdmin}
            aria-label="Admin Phone"
          />
          {phoneField.error && (
            <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
              <FaInfoCircle className="flex-shrink-0" />
              {phoneField.error}
            </span>
          )}

          <div className="flex gap-2 justify-center mt-2">
            <button
              type="submit"
              className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                creatingAdmin ||
                emailField.isChecking ||
                usernameField.isChecking ||
                emailField.error ||
                usernameField.error ||
                phoneField.error ||
                !emailField.value ||
                !usernameField.value ||
                !phoneField.value
              }
            >
              {creatingAdmin ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 mr-1 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...
                </span>
              ) : 'Create Admin'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 transition min-w-[80px]"
              disabled={creatingAdmin}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignAdminModal; 