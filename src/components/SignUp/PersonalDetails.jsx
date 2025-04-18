import React, { useState } from 'react';
import useSignupStore from '../../store/signupStore';
import { FaCheck, FaInfoCircle } from 'react-icons/fa';

const PersonalDetails = ({ onComplete }) => {
  const [errors, setErrors] = useState({});
  const { personalData, updatePersonalData, workData, lifestyleData, veteransData } = useSignupStore();

  const hebrewLevels = ['beginner', 'intermediate', 'advanced', 'native'];
  const militaryOptions = ['none', 'military', 'national'];

  const maritalStatusOptions = [
    { value: 'married', label: 'Married' },
    { value: 'single', label: 'Single' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updatePersonalData({
      [name]: type === 'checkbox' ? checked : value,
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['address'];
    
    requiredFields.forEach(field => {
      if (!personalData[field]?.trim()) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete();
    }
  };

  const FormField = ({ label, name, type = 'text', required = false, options, placeholder, className = '' }) => (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'select' ? (
        <select
          name={name}
          value={personalData[name] || ''}
          onChange={handleChange}
          className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
            errors[name]
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
          }`}
        >
          <option value="">{`Select ${label.toLowerCase()}`}</option>
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={personalData[name] || ''}
          onChange={handleChange}
          placeholder={placeholder}
          rows="3"
          className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
            errors[name]
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
          }`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={personalData[name] || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
            errors[name]
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
          }`}
        />
      )}
      {errors[name] && (
        <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
          <FaInfoCircle className="flex-shrink-0" />
          {errors[name]}
        </p>
      )}
    </div>
  );

  const CheckboxField = ({ label, name, className = '' }) => (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        name={name}
        checked={personalData[name] || false}
        onChange={handleChange}
        className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300 rounded"
      />
      <label className="ml-2 text-sm text-gray-700">{label}</label>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md mt-6">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Personal Details</h2>
        <p className="text-sm text-gray-600">Please provide your personal information to help us serve you better</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Information */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <FaCheck className="text-green-500" />
            <h3>Contact Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormField
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              placeholder="+1 (555) 000-0000"
            />
            <FormField
              label="Marital Status"
              name="maritalStatus"
              type="select"
              options={maritalStatusOptions}
            />
            <FormField
              label="Address"
              name="address"
              required
              placeholder="Enter your full address"
              className="sm:col-span-2"
            />
          </div>
        </section>

        {/* Language and Origin */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <FaCheck className="text-green-500" />
            <h3>Language & Origin</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormField
              label="Native Language"
              name="nativeLanguage"
              placeholder="Enter your native language"
            />
            <FormField
              label="Hebrew Level"
              name="hebrewLevel"
              type="select"
              options={hebrewLevels}
            />
            <FormField
              label="Arrival Date"
              name="arrivalDate"
              type="date"
            />
            <FormField
              label="Country of Origin"
              name="originCountry"
              placeholder="Enter your country of origin"
            />
          </div>
        </section>

        {/* Additional Information */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <FaCheck className="text-green-500" />
            <h3>Additional Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <FormField
                label="Health Condition"
                name="healthCondition"
                type="textarea"
                placeholder="Please describe any health conditions..."
              />
              <FormField
                label="Military/National Service"
                name="militaryService"
                type="select"
                options={militaryOptions.map(option => ({
                  value: option,
                  label: option === 'none' ? 'None' : option === 'military' ? 'Military Service' : 'National Service'
                }))}
              />
            </div>
            <div className="space-y-3 sm:mt-0">
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <CheckboxField label="I have a car" name="hasCar" />
                <CheckboxField label="Living alone" name="livingAlone" />
                <CheckboxField label="Family members in settlement" name="familyInSettlement" />
                <CheckboxField label="I carry a weapon" name="hasWeapon" />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm sm:text-base font-medium flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <FaCheck className="text-lg" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalDetails;