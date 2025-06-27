import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';

const PasswordInput = ({ 
  name, 
  value, 
  onChange, 
  placeholder = "Enter password",
  className = "",
  error = "",
  autoComplete = "current-password",
  required = false,
  showStrengthIndicator = false,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Password strength validation
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasMinLength = value && value.length >= 8;

  const requirements = [
    { text: "At least 8 characters", met: hasMinLength },
    { text: "One uppercase letter", met: hasUppercase },
    { text: "One lowercase letter", met: hasLowercase },
    { text: "One number", met: hasNumber }
  ];

  const CheckIcon = ({ met }) => (
    met ? (
      <FiCheck className="h-4 w-4 text-green-500" />
    ) : (
      <FiX className="h-4 w-4 text-red-500" />
    )
  );

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${className} pr-12`}
          autoComplete={autoComplete}
          required={required}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? (
            <FiEye className="h-5 w-5" />
          ) : (
            <FiEyeOff className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Password strength checklist */}
      {showStrengthIndicator && value && (
        <div className="mt-2 space-y-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <CheckIcon met={req.met} />
              <span className={req.met ? "text-green-600" : "text-gray-500"}>
                {req.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordInput;

