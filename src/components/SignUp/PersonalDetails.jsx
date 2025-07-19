import React, { useEffect, useRef, useCallback, memo, useState } from 'react';
import useSignupStore from '../../store/signupStore';
import languageList from '../../data/languages.json';
import groupedLanguages from '../../data/languagesGrouped.json';
import countryList from '../../data/country.json';
import { validatePhoneNumber, validateHouseNumber } from '../../utils/validation';

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
import { Star } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

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

// Hide number input spin buttons (arrows) for all browsers
const numberInputSpinButtonStyle = `
  /* Chrome, Safari, Edge, Opera */
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

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
    autoComplete, // new prop for autocomplete
    t // <-- add t as a prop
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
            placeholder={`${t('common.select')} ${label.toLowerCase()}`}
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
              menuPortal: base => ({ ...base, zIndex: 9999 })
            }}
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
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
            placeholder={`${t('common.select')} ${label.toLowerCase()}`}
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
              menuPortal: base => ({ ...base, zIndex: 9999 })
            }}
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
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
            <option value="">{`${t('common.select')} ${label.toLowerCase()}`}</option>
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

const PersonalDetails = memo(({ onComplete, editMode = false, data }) => {
  const { personalData, updatePersonalData } = useSignupStore();
  const { t, language } = useLanguage();
  const formRef = useRef(null);
  const [formData, setFormData] = useState(personalData || {
    phoneNumber: '',
    maritalStatus: '',
    streetName: '',
    houseNumber: '',
    floorNumber: '',
    postalCode: '',
    address: '',
    nativeLanguage: '',
    hebrewLevel: '',
    arrivalDate: '',
    originCountry: '',
    healthCondition: '',
    militaryService: undefined,
    hasCar: undefined,
    livingAlone: undefined,
    familyInSettlement: undefined,
    hasWeapon: undefined,
    isNewImmigrant: false, // Add this new field
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

  const hebrewLevels = ['0', '1', '2', '3', '4', '5'];
  const militaryOptions = ['none', 'military', 'national'];

  const maritalStatusOptions = [
    { value: 'married', label: t('auth.signup.personalDetails.maritalStatus.options.married') },
    { value: 'single', label: t('auth.signup.personalDetails.maritalStatus.options.single') },
    { value: 'divorced', label: t('auth.signup.personalDetails.maritalStatus.options.divorced') },
    { value: 'widowed', label: t('auth.signup.personalDetails.maritalStatus.options.widowed') },
  ];

  // Replace fetch languages useEffect:
  useEffect(() => {
    try {
      // Only allow English, Hebrew, and Russian as native language options
      const allowedLanguages = ['en', 'he', 'ru'];
      setLanguages(
        allowedLanguages.map((value) => ({
          value,
          label: t(`auth.signup.personalDetails.languageOptions.${value}`)
        }))
      );
      setCountries(
        Array.isArray(countryList)
          ? countryList.map((c) => ({
              value: c.code || c.name,
              label: t(`countries.${c.code}`, { defaultValue: c.name })
            }))
          : []
      );
      setLoading(prev => ({ ...prev, languages: false }));
    } catch (error) {
      console.error('Error loading languages or countries list:', error);
      setApiError(prev => ({ ...prev, languages: true }));
      toast.error('Failed to load languages or countries.');
      setLanguages([]);
      setCountries([]);
      setLoading(prev => ({ ...prev, languages: false }));
    }
  }, [t]);

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
    const requiredFields = ['phoneNumber', 'streetName', 'houseNumber', 'arrivalDate', 'originCountry']; // Removed floorNumber and postalCode
    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        let fieldKey = '';
        switch (field) {
          case 'streetName': fieldKey = 'auth.signup.personalDetails.errors.streetNameRequired'; break;
          case 'houseNumber': fieldKey = 'auth.signup.personalDetails.errors.houseNumberRequired'; break;
          case 'arrivalDate': fieldKey = 'auth.signup.personalDetails.errors.arrivalDateRequired'; break;
          case 'originCountry': fieldKey = 'auth.signup.personalDetails.errors.originCountryRequired'; break;
          default: fieldKey = 'auth.signup.personalDetails.errors.required';
        }
        newErrors[field] = t(fieldKey);
      }
    });
    // Add format validation for house number
    if (formData.houseNumber && !/^\d{1,4}[A-Z]?$/.test(formData.houseNumber.trim())) {
      newErrors.houseNumber = t('auth.signup.personalDetails.errors.houseNumberFormat');
    }
    // Add format validation for phone number
    const phoneError = validatePhoneNumber(formData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = t(phoneError);
    // Validate house number
    const houseNumberError = validateHouseNumber(formData.houseNumber);
    if (houseNumberError) newErrors.houseNumber = houseNumberError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

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
            element.focus();
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
      ${numberInputSpinButtonStyle}
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Prefill form in edit mode
  useEffect(() => {
    if (editMode && data && Object.keys(data).length > 0) {
      updatePersonalData(data);
    }
    // eslint-disable-next-line
  }, [editMode, data]);

  // Helper to handle parent-driven continue in editMode
  useEffect(() => {
    if (!editMode) return;
    window.__updatePersonalDataAndContinue = () => {
      updatePersonalData(formData);
      // Do NOT call onComplete here to avoid recursion
    };
    return () => { delete window.__updatePersonalDataAndContinue; };
    // eslint-disable-next-line
  }, [formData, editMode, onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 relative">
      {/* Floating background elements for visual consistency */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-32 h-32 top-10 left-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute w-24 h-24 top-1/3 right-20 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute w-40 h-40 bottom-20 left-1/4 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute w-20 h-20 bottom-1/3 right-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '6s' }} />
      </div>

      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FaCheck className="w-12 h-12 text-yellow-500 mr-4" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('auth.signup.personalDetails.title')}
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('auth.signup.personalDetails.description')}
          </p>
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

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-12">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <div className="flex items-center mb-6">
              <FaCheck className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('auth.signup.personalDetails.contactInformation.title')}
                </h3>
                <p className="text-gray-600 text-lg">{t('auth.signup.personalDetails.contactInformation.description')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Phone Number */}
              <FormField
                label={t('auth.signup.personalDetails.phoneNumber')}
                name="phoneNumber"
                id="personalDetails-phoneNumber"
                type="text"
                autoComplete="tel"
                placeholder={t('auth.signup.personalDetails.phoneNumber')}
                value={formData.phoneNumber}
                onChange={e => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 10) val = val.slice(0, 10);
                  handleInputChange({
                    target: {
                      name: 'phoneNumber',
                      value: val
                    }
                  });
                }}
                error={errors.phoneNumber}
                getFieldIcon={() => getFieldIcon('phoneNumber')}
                required
                inputMode="numeric"
                pattern="[0-9]{10}"
                t={t}
              />
              {/* Marital Status */}
              <FormField
                label={t('auth.signup.personalDetails.maritalStatus.label')}
                name="maritalStatus"
                id="personalDetails-maritalStatus"
                type="select"
                autoComplete="marital-status"
                options={maritalStatusOptions}
                value={formData.maritalStatus}
                onChange={handleInputChange}
                error={errors.maritalStatus}
                getFieldIcon={() => getFieldIcon('maritalStatus')}
                t={t}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <div className="flex items-center mb-6">
              <FaHome className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('auth.signup.personalDetails.addressInformation.title')}
                </h3>
                <p className="text-gray-600 text-lg">{t('auth.signup.personalDetails.addressInformation.description')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                label={t('auth.signup.personalDetails.houseNumber')}
                name="houseNumber"
                id="personalDetails-houseNumber"
                required
                type="text"
                autoComplete="address-line1"
                placeholder={t('auth.signup.personalDetails.houseNumber')}
                value={formData.houseNumber}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  if (val === '' || /^\d{1,4}[A-Z]?$/.test(val)) {
                    handleInputChange({
                      target: {
                        name: 'houseNumber',
                        value: val
                      }
                    });
                  }
                }}
                error={errors.houseNumber}
                getFieldIcon={() => getFieldIcon('houseNumber')}
                inputMode="text"
                pattern="\d{1,4}[A-Za-z]?"
                t={t}
              />
              <FormField
                label={t('auth.signup.personalDetails.streetName')}
                name="streetName"
                id="personalDetails-streetName"
                required
                autoComplete="address-line2"
                placeholder={t('auth.signup.personalDetails.streetName')}
                className="sm:col-span-2"
                value={formData.streetName}
                onChange={handleInputChange}
                error={errors.streetName}
                getFieldIcon={() => getFieldIcon('streetName')}
                t={t}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormField
                label={t('auth.signup.personalDetails.floorNumber')}
                name="floorNumber"
                id="personalDetails-floorNumber"
                type="text"
                autoComplete="address-level2"
                placeholder={t('auth.signup.personalDetails.floorNumberPlaceholder')}
                value={formData.floorNumber}
                onChange={handleInputChange}
                error={errors.floorNumber}
                getFieldIcon={() => getFieldIcon('floorNumber')}
                inputMode="text"
                t={t}
              />
              <FormField
                label={t('auth.signup.personalDetails.postalCode')}
                name="postalCode"
                id="personalDetails-postalCode"
                type="text"
                autoComplete="postal-code"
                placeholder={t('auth.signup.personalDetails.postalCodePlaceholder')}
                value={formData.postalCode}
                onChange={handleInputChange}
                error={errors.postalCode}
                getFieldIcon={() => getFieldIcon('postalCode')}
                inputMode="text"
                t={t}
              />
            </div>
            <FormField
              label={t('auth.signup.personalDetails.additionalAddressDetails')}
              name="address"
              id="personalDetails-address"
              type="textarea"
              autoComplete="address-line3"
              placeholder={t('auth.signup.personalDetails.additionalAddressDetails')}
              className="sm:col-span-2"
              value={formData.address}
              onChange={handleInputChange}
              error={errors.address}
              getFieldIcon={() => getFieldIcon('address')}
              t={t}
            />
          </div>

          {/* Language & Background */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <div className="flex items-center mb-6">
              <FaLanguage className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('auth.signup.personalDetails.languageAndBackground.title')}
                </h3>
                <p className="text-gray-600 text-lg">{t('auth.signup.personalDetails.languageAndBackground.description')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                label={t('auth.signup.personalDetails.nativeLanguage')}
                name="nativeLanguage"
                id="personalDetails-nativeLanguage"
                type="select"
                autoComplete="language"
                options={languages}
                value={formData.nativeLanguage}
                onChange={handleInputChange}
                error={errors.nativeLanguage}
                getFieldIcon={() => getFieldIcon('nativeLanguage')}
                disabled={loading.languages}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                getLanguageIcon={getLanguageIcon}
                t={t}
              />
              <FormField
                label={t('auth.signup.personalDetails.hebrewLevel.label')}
                name="hebrewLevel"
                id="personalDetails-hebrewLevel"
                type="select"
                autoComplete="hebrew-level"
                options={hebrewLevels.map(level => ({ value: level, label: level }))}
                value={formData.hebrewLevel}
                onChange={handleInputChange}
                error={errors.hebrewLevel}
                getFieldIcon={() => getFieldIcon('hebrewLevel')}
                placeholder={t('auth.signup.personalDetails.hebrewLevel.placeholder')}
                t={t}
              />
            </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 rounded-lg p-4">
                <FormField
                  label={t('auth.signup.personalDetails.arrivalDate')}
                  name="arrivalDate"
                  id="personalDetails-arrivalDate"
                  type="date"
                  required={true}
                  autoComplete="bday"
                  value={formData.arrivalDate}
                  onChange={handleInputChange}
                  error={errors.arrivalDate}
                  getFieldIcon={() => getFieldIcon('arrivalDate')}
                  t={t}
                />
                <FormField
                  label={t('auth.signup.personalDetails.originCountry')}
                  name="originCountry"
                  id="personalDetails-originCountry"
                  type="select"
                  required={true}
                  autoComplete="country"
                  options={countries}
                  value={formData.originCountry}
                  onChange={handleInputChange}
                  error={errors.originCountry}
                  getFieldIcon={() => getFieldIcon('originCountry')}
                  t={t}
                selectProps={{
                  menuPortalTarget: typeof window !== 'undefined' ? document.body : null,
                  styles: {
                    menuPortal: base => ({ ...base, zIndex: 9999 })
                  }
                }}
                />
              </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <div className="flex items-center mb-6">
              <FaInfoCircle className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('auth.signup.personalDetails.additionalInformation.title')}
                </h3>
                <p className="text-gray-600 text-lg">{t('auth.signup.personalDetails.additionalInformation.description')}</p>
              </div>
            </div>
            {/* Unified Card for Health Condition and Yes/No Questions */}
            <div className="p-6 space-y-6">
              <FormField
                label={t('auth.signup.personalDetails.healthCondition')}
                name="healthCondition"
                id="personalDetails-healthCondition"
                type="select"
                options={[
                  { value: 'healthy', label: t('auth.signup.personalDetails.healthConditionOptions.healthy') },
                  { value: 'withCaregiver', label: t('auth.signup.personalDetails.healthConditionOptions.withCaregiver') },
                  { value: 'nursing', label: t('auth.signup.personalDetails.healthConditionOptions.nursing') },
                  { value: 'immobile', label: t('auth.signup.personalDetails.healthConditionOptions.immobile') }
                ]}
                value={formData.healthCondition}
                onChange={handleInputChange}
                error={errors.healthCondition}
                getFieldIcon={() => getFieldIcon('healthCondition')}
                required
                t={t}
              />
              {/* Section Heading for Yes/No Group */}
              <div className="mb-2 mt-4">
                <h4 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  {t('auth.signup.personalDetails.quickQuestions') || 'Quick Questions'}
                </h4>
              </div>
              {/* Yes/No Questions Group */}
              <div className="space-y-3 sm:mt-0">
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  {/* Military Service Yes/No Radio Group */}
                  <div className="mb-2 flex items-center gap-4 justify-between">
                    <label className={`block text-sm font-medium text-gray-700 mb-0 min-w-[160px] ${['he', 'ar'].includes(language) ? 'text-right' : 'text-left'}`}>
                      {t('auth.signup.personalDetails.militaryService')}
                    </label>
                    <div className="flex gap-6 items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="militaryService"
                          value="yes"
                          checked={formData.militaryService === true}
                          onChange={() => handleInputChange({ target: { name: 'militaryService', value: true, type: 'radio' } })}
                          className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300"
                        />
                        <span>{t('common.yes')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="militaryService"
                          value="no"
                          checked={formData.militaryService === false}
                          onChange={() => handleInputChange({ target: { name: 'militaryService', value: false, type: 'radio' } })}
                          className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300"
                        />
                        <span>{t('common.no')}</span>
                      </label>
                    </div>
                  </div>
                  {/* Has Car Yes/No */}
                  <div className="mb-2 flex items-center gap-4 justify-between">
                    <label className={`block text-sm font-medium text-gray-700 mb-0 min-w-[160px] ${['he', 'ar'].includes(language) ? 'text-right' : 'text-left'}`}>{t('auth.signup.personalDetails.hasCar')}</label>
                    <div className="flex gap-6 items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="hasCar"
                          value="yes"
                          checked={formData.hasCar === true}
                          onChange={() => handleInputChange({ target: { name: 'hasCar', value: true, type: 'radio' } })}
                          className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300"
                        />
                        <span>{t('common.yes')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="hasCar"
                          value="no"
                          checked={formData.hasCar === false}
                          onChange={() => handleInputChange({ target: { name: 'hasCar', value: false, type: 'radio' } })}
                          className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300"
                        />
                        <span>{t('common.no')}</span>
                      </label>
                    </div>
                  </div>
                  {/* Living Alone Yes/No */}
                  <div className="mb-2 flex items-center gap-4 justify-between">
                    <label className={`block text-sm font-medium text-gray-700 mb-0 min-w-[160px] ${['he', 'ar'].includes(language) ? 'text-right' : 'text-left'}`}>{t('auth.signup.personalDetails.livingAlone')}</label>
                    <div className="flex gap-6 items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="livingAlone"
                          value="yes"
                          checked={formData.livingAlone === true}
                          onChange={() => handleInputChange({ target: { name: 'livingAlone', value: true, type: 'radio' } })}
                          className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300"
                        />
                        <span>{t('common.yes')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="livingAlone"
                          value="no"
                          checked={formData.livingAlone === false}
                          onChange={() => handleInputChange({ target: { name: 'livingAlone', value: false, type: 'radio' } })}
                          className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300"
                        />
                        <span>{t('common.no')}</span>
                      </label>
                    </div>
                  </div>
                  {/* Family in Settlement Yes/No */}
                  <div className="mb-2 flex items-center gap-4 justify-between">
                    <label className={`block text-sm font-medium text-gray-700 mb-0 min-w-[160px] ${['he', 'ar'].includes(language) ? 'text-right' : 'text-left'}`}>{t('auth.signup.personalDetails.familyInSettlement')}</label>
                    <div className="flex gap-6 items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="familyInSettlement"
                          value="yes"
                          checked={formData.familyInSettlement === true}
                          onChange={() => handleInputChange({ target: { name: 'familyInSettlement', value: true, type: 'radio' } })}
                          className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300"
                        />
                        <span>{t('common.yes')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="familyInSettlement"
                          value="no"
                          checked={formData.familyInSettlement === false}
                          onChange={() => handleInputChange({ target: { name: 'familyInSettlement', value: false, type: 'radio' } })}
                          className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300"
                        />
                        <span>{t('common.no')}</span>
                      </label>
                    </div>
                  </div>
                  {/* Has Weapon Yes/No */}
                  <div className="mb-2 flex items-center gap-4 justify-between">
                    <label className={`block text-sm font-medium text-gray-700 mb-0 min-w-[160px] ${['he', 'ar'].includes(language) ? 'text-right' : 'text-left'}`}>{t('auth.signup.personalDetails.hasWeapon')}</label>
                    <div className="flex gap-6 items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="hasWeapon"
                          value="yes"
                          checked={formData.hasWeapon === true}
                          onChange={() => handleInputChange({ target: { name: 'hasWeapon', value: true, type: 'radio' } })}
                          className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300"
                        />
                        <span>{t('common.yes')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="hasWeapon"
                          value="no"
                          checked={formData.hasWeapon === false}
                          onChange={() => handleInputChange({ target: { name: 'hasWeapon', value: false, type: 'radio' } })}
                          className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300"
                        />
                        <span>{t('common.no')}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button - only show if not in editMode */}
          {!editMode && (
            <div className="text-center pt-8">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Star className="w-6 h-6" />
                <span>{t('common.continue')}</span>

                <Star className="w-6 h-6" />
              </button>
            </div>
          )}
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

PersonalDetails.displayName = 'PersonalDetails';

export default PersonalDetails;