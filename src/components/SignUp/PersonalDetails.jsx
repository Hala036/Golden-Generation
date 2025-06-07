import React, { useEffect, useRef, useCallback, memo, useState } from 'react';
import useSignupStore from '../../store/signupStore';
import languageList from '../../data/languages.json';
import groupedLanguages from '../../data/languagesGrouped.json';
import countryList from '../../data/country.json';

import Select from 'react-select';
import {
  FaCheck,
  FaInfoCircle,
  FaSpinner,
  FaGlobe,
  FaLanguage,
  FaComment,
  FaFlag,
  FaUniversity,
  FaBookReader,
  FaHandshake,
  FaExclamationTriangle,
  FaHome,
  FaRoad,
  FaChevronDown,
  FaSearch,
} from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Language code to country code mapping for flags
const languageFlagMap = {
  en: 'gb', // English → UK
  he: 'il', // Hebrew → Israel
  ar: 'sa', // Arabic → Saudi Arabia
  ru: 'ru', // Russian → Russia
  fr: 'fr', // French → France
  es: 'es', // Spanish → Spain
  de: 'de', // German → Germany
  fa: 'ir', // Persian → Iran
  am: 'et', // Amharic → Ethiopia
  sw: 'tz', // Swahili → Tanzania
  tl: 'ph', // Tagalog → Philippines
  pt: 'br', // Portuguese → Brazil
  it: 'it', // Italian → Italy
  tr: 'tr', // Turkish → Turkey
  zh: 'cn', // Chinese → China
  hi: 'in', // Hindi → India
  ja: 'jp', // Japanese → Japan
  ko: 'kr', // Korean → South Korea
  vi: 'vn', // Vietnamese → Vietnam
  // Add more mappings as needed
  'zh-tw': 'tw', // Traditional Chinese → Taiwan
  'zh-hk': 'hk', // Cantonese → Hong Kong
  'zh-cn': 'cn', // Simplified Chinese → China
  'pt-br': 'br', // Brazilian Portuguese → Brazil
  'pt-pt': 'pt', // European Portuguese → Portugal
  'fr-ca': 'ca', // Canadian French → Canada
  'fr-fr': 'fr', // French → France
  'es-mx': 'mx', // Mexican Spanish → Mexico
  'es-es': 'es', // European Spanish → Spain
  'ru-ru': 'ru', // Russian → Russia
  'ar-sa': 'sa', // Saudi Arabic → Saudi Arabia
  'ar-eg': 'eg', // Egyptian Arabic → Egypt
  'ar-ma': 'ma', // Moroccan Arabic → Morocco
    


  // Add more as needed
};

// Memoize FormField to prevent unnecessary re-renders
const FormField = memo(
  ({ 
    label, 
    name, 
    type = 'text', 
    required = false, 
    options, 
    placeholder, 
    className = '', 
    disabled = false, 
    value, 
    onChange, 
    error, 
    getFieldIcon,
    isDropdownOpen,
    setIsDropdownOpen,
    searchTerm,
    setSearchTerm,
    getLanguageIcon,
    id, // new prop for id
    autoComplete // new prop for autocomplete
  }) => {
    const fieldId = id || `field-${name}`;
    const autoCompleteAttr = autoComplete || name;
    return (
      <div className={`space-y-1 ${className}`}>
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 flex items-center gap-1">
          {getFieldIcon()}
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'select' && name === 'nativeLanguage' ? (
          <Select
            inputId={fieldId}
            name={name}
            value={options.find(option => option.value === value) || null}
            onChange={option => onChange({ target: { name, value: option ? option.value : '' } })}
            options={options}
            isDisabled={disabled}
            classNamePrefix="react-select"
            placeholder={`Select ${label.toLowerCase()}`}
            isSearchable
            formatOptionLabel={option => {
              const flagCode = languageFlagMap[option.value?.toLowerCase()] || option.value?.toLowerCase();
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {option.value && (
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src={`https://flagcdn.com/w20/${flagCode}.png`}
                        alt={option.label}
                        className="w-5 h-5 object-contain rounded-sm"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }}
                      />
                      <FaIcons.FaGlobe className="text-gray-500" style={{ display: 'none', marginLeft: 0 }} />
                    </span>
                  )}
                  <span>{option.label}</span>
                </div>
              );
            }}
            styles={{
              control: (base, state) => ({
                ...base,
                borderColor: error ? '#ef4444' : base.borderColor,
                boxShadow: state.isFocused ? (error ? '0 0 0 1px #ef4444' : '0 0 0 1px #FFD966') : base.boxShadow,
                '&:hover': { borderColor: '#FFD966' },
                minHeight: 40,
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? '#FFD96633' : state.isFocused ? '#FFD96611' : undefined,
                color: '#222',
                padding: '8px 12px',
                fontWeight: state.isSelected ? 600 : 400,
              }),
            }}
            // Add inputProps for autocomplete
            inputProps={{ autoComplete: autoCompleteAttr }}
          />
        ) : type === 'select' && name === 'originCountry' ? (
          <Select
            inputId={fieldId}
            name={name}
            value={options.find(option => option.value === value) || null}
            onChange={option => onChange({ target: { name, value: option ? option.value : '' } })}
            options={options}
            isDisabled={disabled}
            classNamePrefix="react-select"
            placeholder={`Select ${label.toLowerCase()}`}
            formatOptionLabel={option => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {option.value && (
                  <img
                    src={`https://flagcdn.com/w20/${option.value.toLowerCase()}.png`}
                    alt={option.label}
                    style={{ width: 20, height: 15, borderRadius: 2, objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <span>{option.label}</span>
              </div>
            )}
            styles={{
              control: (base, state) => ({
                ...base,
                borderColor: error ? '#ef4444' : base.borderColor,
                boxShadow: state.isFocused ? (error ? '0 0 0 1px #ef4444' : '0 0 0 1px #FFD966') : base.boxShadow,
                '&:hover': { borderColor: '#FFD966' },
                minHeight: 40,
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? '#FFD96633' : state.isFocused ? '#FFD96611' : undefined,
                color: '#222',
                padding: '8px 12px',
                fontWeight: state.isSelected ? 600 : 400,
              }),
            }}
            inputProps={{ autoComplete: autoCompleteAttr }}
          />
        ) : type === 'select' ? (
          <select
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base appearance-none ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 hover:border-[#FFD966] focus:border-[#FFD966] focus:ring-[#FFD966] transition-colors'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem',
            }}
            autoComplete={autoCompleteAttr}
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
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            rows="3"
            className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 hover:border-[#FFD966] focus:border-[#FFD966] focus:ring-[#FFD966] transition-colors'
            }`}
            autoComplete={autoCompleteAttr}
          />
        ) : (
          <input
            id={fieldId}
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 hover:border-[#FFD966] focus:border-[#FFD966] focus:ring-[#FFD966] transition-colors'
            }`}
            autoComplete={autoCompleteAttr}
          />
        )}
        {error && (
          <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
            <FaInfoCircle className="flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.options === nextProps.options &&
      prevProps.className === nextProps.className &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.isDropdownOpen === nextProps.isDropdownOpen &&
      prevProps.searchTerm === nextProps.searchTerm
    );
  }
);

// Memoize CheckboxField
const CheckboxField = memo(({ label, name, className = '', checked, onChange, id }) => (
  <div className={`flex items-center ${className} hover:bg-gray-100 p-1 rounded-md transition-colors -mx-1`}>
    <input
      type="checkbox"
      name={name}
      id={id || `field-${name}`}
      checked={checked || false}
      onChange={onChange}
      className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300 rounded cursor-pointer"
    />
    <label htmlFor={id || `field-${name}`} className="ml-2 text-sm text-gray-700 cursor-pointer select-none flex-1">{label}</label>
  </div>
));

const PersonalDetails = memo(({ onComplete }) => {
  const { personalData, updatePersonalData } = useSignupStore();
  const formRef = useRef(null);
  const [formData, setFormData] = useState(personalData || {
    phoneNumber: '',
    maritalStatus: '',
    streetName: '',
    houseNumber: '',
    address: '',
    nativeLanguage: '',
    hebrewLevel: '',
    arrivalDate: '',
    originCountry: '',
    healthCondition: '',
    militaryService: '',
    hasCar: false,
    livingAlone: false,
    familyInSettlement: false,
    hasWeapon: false,
  });
  const [errors, setErrors] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState({
    settlements: false, // Changed from true to false
    languages: true,
  });
  const [apiError, setApiError] = useState({
    settlements: false,
    languages: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const hebrewLevels = ['beginner', 'intermediate', 'advanced', 'native'];
  const militaryOptions = ['none', 'military', 'national'];

  const maritalStatusOptions = [
    { value: 'married', label: 'Married' },
    { value: 'single', label: 'Single' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
  ];

  // Replace fetch languages useEffect:
  useEffect(() => {
    try {
      setLanguages(Object.entries(languageList).map(([value, label]) => ({ value, label })));
      setCountries(Array.isArray(countryList) ? countryList.map((c) => ({ value: c.code || c.name, label: c.name })) : []);
      setLoading(prev => ({ ...prev, languages: false }));
    } catch (error) {
      console.error('Error loading languages or countries list:', error);
      setApiError(prev => ({ ...prev, languages: true }));
      toast.error('Failed to load languages or countries.');
      setLanguages([]);
      setCountries([]);
      setLoading(prev => ({ ...prev, languages: false }));
    }
  }, []);

  // Add this useEffect to fix the loading state issue
  useEffect(() => {
    // Since you're not actually loading settlements, set it to false
    setLoading(prev => ({ ...prev, settlements: false }));
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    },
    []
  );

  const handleLanguageSelect = useCallback(
    (value) => {
      setFormData((prev) => ({
        ...prev,
        nativeLanguage: value,
      }));
      setIsDropdownOpen(false);
      setSearchTerm('');
    },
    []
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    const requiredFields = ['streetName', 'houseNumber']; // Updated required fields
    
    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        const fieldName = field === 'streetName' ? 'Street Name' : 'House Number';
        newErrors[field] = `${fieldName} is required`;
      }
    });

    // Validate house number is numeric
    if (formData.houseNumber && !/^\d+[a-zA-Z]?$/.test(formData.houseNumber.trim())) {
      newErrors.houseNumber = 'House number must be numeric (e.g., 123 or 123A)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      console.log('Form data:', formData); // Debug: check form data
      console.log('Validation result:', validateForm()); // Debug: check validation
      if (validateForm()) {
        const updatedFormData = {
          ...formData,
          address: `${formData.houseNumber} ${formData.streetName}`.trim(),
        };
        console.log('Submitting:', updatedFormData); // Debug: check final data
        updatePersonalData(updatedFormData);
        onComplete();
      } else {
        console.log('Validation errors:', errors); // Debug: check errors
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const element = document.querySelector(`[name="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    },
    [validateForm, errors, onComplete, formData, updatePersonalData]
  );

  const getLanguageIcon = useCallback((language) => {
    const lowercaseLang = language.toLowerCase();
    if (lowercaseLang === 'english') return <FaGlobe className="text-blue-500" />;
    if (lowercaseLang === 'spanish') return <FaComment className="text-red-500" />;
    if (lowercaseLang === 'french') return <FaFlag className="text-indigo-500" />;
    if (lowercaseLang === 'hebrew') return <FaUniversity className="text-yellow-600" />;
    if (lowercaseLang === 'arabic') return <FaBookReader className="text-green-600" />;
    return <FaHandshake className="text-gray-500" />;
  }, []);

  const getFieldIcon = useCallback(
    (name) => {
      switch (name) {
        case 'phoneNumber': return <FaInfoCircle className="text-[#FFD966]" />;
        case 'maritalStatus': return <FaInfoCircle className="text-[#FFD966]" />;
        case 'streetName': return <FaRoad className="text-[#FFD966]" />;
        case 'houseNumber': return <FaHome className="text-[#FFD966]" />;
        case 'address': return <FaInfoCircle className="text-[#FFD966]" />;
        case 'hebrewLevel': return <FaLanguage className="text-[#FFD966]" />;
        case 'arrivalDate': return <FaInfoCircle className="text-[#FFD966]" />;
        case 'originCountry': return <FaGlobe className="text-[#FFD966]" />;
        case 'healthCondition': return <FaInfoCircle className="text-[#FFD966]" />;
        case 'militaryService': return <FaInfoCircle className="text-[#FFD966]" />;
        default: return <FaInfoCircle className="text-[#FFD966]" />;
      }
    },
    []
  );

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.2s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md mt-6">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Personal Details</h2>
        <p className="text-sm text-gray-600">Please provide your personal information to help us serve you better</p>
      </div>

      {(apiError.settlements || apiError.languages) && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-md flex items-start gap-3">
          <FaExclamationTriangle className="text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-medium text-yellow-800">Connection Issues</h3>
            <p className="text-sm text-yellow-700">
              There was a problem connecting to our servers.
              {apiError.settlements && ' Settlement data may be unavailable.'}
              {apiError.languages && ' Language data may be limited.'}
              <br />
              <button
                onClick={() => window.location.reload()}
                className="text-yellow-800 underline hover:text-yellow-900 mt-1"
              >
                Refresh page
              </button>
            </p>
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <FaCheck className="text-green-500" />
            <h3>Contact Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormField
              label="Phone Number"
              name="phoneNumber"
              id="phoneNumber"
              type="tel"
              autoComplete="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              error={errors.phoneNumber}
              getFieldIcon={() => getFieldIcon('phoneNumber')}
            />
            <FormField
              label="Marital Status"
              name="maritalStatus"
              id="maritalStatus"
              type="select"
              autoComplete="marital-status"
              options={maritalStatusOptions}
              value={formData.maritalStatus}
              onChange={handleInputChange}
              error={errors.maritalStatus}
              getFieldIcon={() => getFieldIcon('maritalStatus')}
            />
          </div>
          
          {/* Address Section */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
              <FaHome className="text-[#FFD966]" />
              Address Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                label="House Number"
                name="houseNumber"
                id="houseNumber"
                required
                autoComplete="address-line1"
                placeholder="123"
                value={formData.houseNumber}
                onChange={handleInputChange}
                error={errors.houseNumber}
                getFieldIcon={() => getFieldIcon('houseNumber')}
              />
              <FormField
                label="Street Name"
                name="streetName"
                id="streetName"
                required
                autoComplete="address-line2"
                placeholder="Main Street"
                className="sm:col-span-2"
                value={formData.streetName}
                onChange={handleInputChange}
                error={errors.streetName}
                getFieldIcon={() => getFieldIcon('streetName')}
              />
            </div>
            <FormField
              label="Additional Address Details (Optional)"
              name="address"
              id="address"
              type="textarea"
              autoComplete="address-line3"
              placeholder="Apartment number, building name, or other address details..."
              className="sm:col-span-2"
              value={formData.address}
              onChange={handleInputChange}
              error={errors.address}
              getFieldIcon={() => getFieldIcon('address')}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <FaCheck className="text-green-500" />
            <h3>Language & Origin</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormField
              label="Native Language"
              name="nativeLanguage"
              id="nativeLanguage"
              type="select"
              autoComplete="language"
              options={languages}
              value={formData.nativeLanguage}
              onChange={handleInputChange}
              error={errors.nativeLanguage}
              getFieldIcon={() => getFieldIcon('nativeLanguage')}
              disabled={loading.languages}
              // Pass dropdown state and handlers
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              getLanguageIcon={getLanguageIcon}
            />
            <FormField
              label="Hebrew Level"
              name="hebrewLevel"
              id="hebrewLevel"
              type="select"
              autoComplete="hebrew-level"
              options={hebrewLevels.map(level => ({ value: level, label: level.charAt(0).toUpperCase() + level.slice(1) }))}
              value={formData.hebrewLevel}
              onChange={handleInputChange}
              error={errors.hebrewLevel}
              getFieldIcon={() => getFieldIcon('hebrewLevel')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormField
              label="Arrival Date"
              name="arrivalDate"
              id="arrivalDate"
              type="date"
              autoComplete="bday"
              value={formData.arrivalDate}
              onChange={handleInputChange}
              error={errors.arrivalDate}
              getFieldIcon={() => getFieldIcon('arrivalDate')}
            />
            <FormField
              label="Origin Country"
              name="originCountry"
              id="originCountry"
              type="select"
              autoComplete="country"
              options={countries}
              value={formData.originCountry}
              onChange={handleInputChange}
              error={errors.originCountry}
              getFieldIcon={() => getFieldIcon('originCountry')}
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
                id="healthCondition"
                type="textarea"
                autoComplete="health-condition"
                placeholder="Please describe any health conditions..."
                value={formData.healthCondition}
                onChange={handleInputChange}
                error={errors.healthCondition}
                getFieldIcon={() => getFieldIcon('healthCondition')}
              />
              <FormField
                label="Military/National Service"
                name="militaryService"
                id="militaryService"
                type="select"
                autoComplete="military-service"
                options={militaryOptions.map((option) => ({
                  value: option,
                  label: option === 'none' ? 'None' : option === 'military' ? 'Military Service' : 'National Service',
                }))}
                value={formData.militaryService}
                onChange={handleInputChange}
                error={errors.militaryService}
                getFieldIcon={() => getFieldIcon('militaryService')}
              />
            </div>
            <div className="space-y-3 sm:mt-0">
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <CheckboxField
                  label="I have a car"
                  name="hasCar"
                  id="hasCar"
                  checked={formData.hasCar}
                  onChange={handleInputChange}
                />
                <CheckboxField
                  label="Living alone"
                  name="livingAlone"
                  id="livingAlone"
                  checked={formData.livingAlone}
                  onChange={handleInputChange}
                />
                <CheckboxField
                  label="Family members in settlement"
                  name="familyInSettlement"
                  id="familyInSettlement"
                  checked={formData.familyInSettlement}
                  onChange={handleInputChange}
                />
                <CheckboxField
                  label="I carry a weapon"
                  name="hasWeapon"
                  id="hasWeapon"
                  checked={formData.hasWeapon}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </section>
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={loading.settlements || loading.languages}
            className={`w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 text-sm sm:text-base font-medium flex items-center justify-center gap-2 shadow-md ${
              (loading.settlements || loading.languages) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading.settlements || loading.languages ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <FaCheck className="text-lg" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
});

PersonalDetails.displayName = 'PersonalDetails';

export default PersonalDetails;