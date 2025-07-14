import React, { useState, useEffect } from 'react';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import { validateEmail, validateUsername, validatePhoneNumber } from '../../utils/validation';
import { FaInfoCircle, FaEnvelope, FaUser, FaPhone } from 'react-icons/fa';

const AssignAdminModal = ({
  open,
  onClose,
  selectedSettlement,
  onAdminCreated,
  checkEmailExists,
  checkUsernameExists,
  creatingAdmin,
}) => {
  const [touched, setTouched] = useState({ email: false, username: false, phone: false });

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

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') emailField.onBlur();
    if (field === 'username') usernameField.onBlur();
    if (field === 'phone') phoneField.onBlur();
  };

  const isValid =
    !emailField.error &&
    !usernameField.error &&
    !phoneField.error &&
    emailField.value &&
    usernameField.value &&
    phoneField.value;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ email: true, username: true, phone: true });
    emailField.onBlur();
    usernameField.onBlur();
    phoneField.onBlur();
    if (!isValid) return;
    onAdminCreated({
      email: emailField.value,
      username: usernameField.value,
      phone: phoneField.value,
    });
  };

  useEffect(() => {
    if (open) {
      emailField.setValue('');
      usernameField.setValue('');
      phoneField.setValue('');
      setTouched({ email: false, username: false, phone: false });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-admin-title"
    >
      <div className="fixed inset-0 backdrop-blur-sm bg-black/5 z-40"></div>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-50">
        <button
          className="absolute top-5 right-5 text-2xl text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2
          id="create-admin-title"
          className="text-2xl font-bold mb-8 text-yellow-600 text-left"
        >
          Create Admin for <span className="text-yellow-600">{selectedSettlement}</span>
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <label htmlFor="admin-email" className="text-sm font-medium">Email</label>
            <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              id="admin-email"
              name="email"
              type="email"
              placeholder="Email"
              value={emailField.value}
              onChange={emailField.onChange}
              onBlur={() => handleBlur('email')}
              className={`pl-11 pr-3 py-3 rounded-lg border border-gray-300 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition
                ${touched.email && emailField.error ? 'border-red-500' : touched.email && !emailField.error && emailField.value ? 'border-green-500' : 'border-gray-300'}`}
              disabled={creatingAdmin}
              aria-label="Admin Email"
            />
          </div>
          {touched.email && emailField.isChecking && (
            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <FaInfoCircle className="flex-shrink-0" />Checking...
            </span>
          )}
          {touched.email && emailField.error && (
            <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
              <FaInfoCircle className="flex-shrink-0" />
              {emailField.error}
            </span>
          )}

          <div className="relative">
            <label htmlFor="admin-username" className="text-sm font-medium">Username</label>
            <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              id="admin-username"
              name="username"
              type="text"
              placeholder="Username"
              value={usernameField.value}
              onChange={usernameField.onChange}
              onBlur={() => handleBlur('username')}
              className={`pl-11 pr-3 py-3 rounded-lg border border-gray-300 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition
                ${touched.username && usernameField.error ? 'border-red-500' : touched.username && !usernameField.error && usernameField.value ? 'border-green-500' : 'border-gray-300'}`}
              disabled={creatingAdmin}
              aria-label="Admin Username"
            />
          </div>
          {touched.username && usernameField.isChecking && (
            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <FaInfoCircle className="flex-shrink-0" />Checking...
            </span>
          )}
          {touched.username && usernameField.error && (
            <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
              <FaInfoCircle className="flex-shrink-0" />
              {usernameField.error}
            </span>
          )}

          <div className="relative">
            <label htmlFor="admin-phone" className="text-sm font-medium">Phone</label>
            <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              id="admin-phone"
              name="phone"
              type="text"
              placeholder="Phone"
              value={phoneField.value}
              onChange={phoneField.onChange}
              onBlur={() => handleBlur('phone')}
              className={`pl-11 pr-3 py-3 rounded-lg border border-gray-300 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition
                ${touched.phone && phoneField.error ? 'border-red-500' : touched.phone && !phoneField.error && phoneField.value ? 'border-green-500' : 'border-gray-300'}`}
              disabled={creatingAdmin}
              aria-label="Admin Phone"
            />
          </div>
          {touched.phone && phoneField.error && (
            <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
              <FaInfoCircle className="flex-shrink-0" />
              {phoneField.error}
            </span>
          )}

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200"
              disabled={creatingAdmin}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center"
              disabled={
                creatingAdmin ||
                emailField.isChecking ||
                usernameField.isChecking ||
                !isValid
              }
            >
              {creatingAdmin ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...
                </span>
              ) : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignAdminModal; 