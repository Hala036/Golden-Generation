import React, { useState, useEffect, useRef } from 'react';
import useSignupStore from '../../store/signupStore';
import { 
  FaCheck, 
  FaInfoCircle, 
  FaSearch, 
  FaChevronDown, 
  FaGlobe, 
  FaLanguage, 
  FaSpinner, 
  FaComment,
  FaFlag,
  FaUniversity,
  FaBookReader,
  FaHandshake,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const PersonalDetails = ({ onComplete }) => {
  const [errors, setErrors] = useState({});
  const [settlements, setSettlements] = useState([]);
  const { personalData, updatePersonalData } = useSignupStore();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState({
    settlements: true,
    languages: true
  });
  const [apiError, setApiError] = useState({
    settlements: false,
    languages: false
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

  // Fetch available settlements from API
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setApiError(prev => ({ ...prev, settlements: false }));
        const response = await fetch('/api/settlements');

        if (!response.ok) {
          throw new Error(`Failed to fetch settlements: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setSettlements(data);
      } catch (error) {
        console.error('Error fetching settlements:', error);
        setApiError(prev => ({ ...prev, settlements: true }));
        toast.error('Failed to load available settlements. Please try again later.');
      } finally {
        setLoading(prev => ({ ...prev, settlements: false }));
      }
    };

    fetchSettlements();
  }, []);

  // Fetch languages from API
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setApiError(prev => ({ ...prev, languages: false }));
        const response = await fetch('/api/languages');

        if (!response.ok) {
          throw new Error(`Failed to fetch languages: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setLanguages(data);
      } catch (error) {
        console.error('Error fetching languages:', error);
        setApiError(prev => ({ ...prev, languages: true }));
        
        // Fallback to default languages if API fails
        setLanguages([
          { value: 'english', label: 'English' },
          { value: 'spanish', label: 'Spanish' },
          { value: 'french', label: 'French' },
          { value: 'hebrew', label: 'Hebrew' },
          { value: 'arabic', label: 'Arabic' },
        ]);
      } finally {
        setLoading(prev => ({ ...prev, languages: false }));
      }
    };

    fetchLanguages();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updatePersonalData({
      [name]: type === 'checkbox' ? checked : value,
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleLanguageSelect = (value) => {
    updatePersonalData({ nativeLanguage: value });
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const filteredLanguages = languages.filter(lang => 
    lang.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['address', 'settlement'];
    
    requiredFields.forEach(field => {
      if (!personalData[field]?.trim()) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
      }
    });

    // Additional validation for settlement
    if (personalData.settlement && !settlements.some(s => s.id === personalData.settlement || s === personalData.settlement)) {
      newErrors.settlement = 'Please select a valid settlement';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete();
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const getLanguageIcon = (language) => {
    const lowercaseLang = language.toLowerCase();
    if (lowercaseLang === 'english') return <FaGlobe className="text-blue-500" />;
    if (lowercaseLang === 'spanish') return <FaComment className="text-red-500" />;
    if (lowercaseLang === 'french') return <FaFlag className="text-indigo-500" />;
    if (lowercaseLang === 'hebrew') return <FaUniversity className="text-yellow-600" />;
    if (lowercaseLang === 'arabic') return <FaBookReader className="text-green-600" />;
    return <FaHandshake className="text-gray-500" />;
  };

  const FormField = ({ label, name, type = 'text', required = false, options, placeholder, className = '', disabled = false }) => {
    const getFieldIcon = () => {
      switch (name) {
        case 'phoneNumber': return <FaInfoCircle className="text-[#FFD966]" />;
        case 'maritalStatus': return <FaInfoCircle className="text-[#FFD966]" />;
        case 'address': return <FaInfoCircle className="text-[#FFD966]" />;
        case 'hebrewLevel': return <FaLanguage className="text-[#FFD966]" />;
        case 'arrivalDate': return <FaInfoCircle className="text-[#FFD966]" />;
        case 'originCountry': return <FaGlobe className="text-[#FFD966]" />;
        case 'healthCondition': return <FaInfoCircle className="text-[#FFD966]" />;
        case 'militaryService': return <FaInfoCircle className="text-[#FFD966]" />;
        case 'settlement': return <FaInfoCircle className="text-[#FFD966]" />;
        default: return <FaInfoCircle className="text-[#FFD966]" />;
      }
    };
    
    if (name === 'nativeLanguage') {
      const selectedLanguage = languages.find(lang => lang.value === personalData[name]);
      
      return (
        <div className={`space-y-1 ${className}`} ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
            <FaLanguage className="text-[#FFD966]" />
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={loading.languages}
              className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base text-left flex items-center justify-between
                ${errors[name]
                  ? 'border-2 border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border border-gray-300 hover:border-[#FFD966] focus:border-[#FFD966] focus:ring-[#FFD966] transition-colors'
                } ${loading.languages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                {selectedLanguage ? getLanguageIcon(selectedLanguage.value) : <FaGlobe className="text-gray-500" />}
                <span>{selectedLanguage ? selectedLanguage.label : 'Select language'}</span>
              </div>
              {loading.languages ? (
                <FaSpinner className="animate-spin text-gray-500" />
              ) : (
                <FaChevronDown className={`transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''} text-gray-500`} />
              )}
            </button>
            
            {isDropdownOpen && !loading.languages && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto animate-fadeIn">
                <div className="sticky top-0 bg-white p-2 border-b shadow-sm">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Type to search languages..."
                      className="w-full pl-8 pr-3 py-2 rounded-md border border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966] text-sm"
                      autoFocus
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                
                {filteredLanguages.length > 0 ? (
                  <div>
                    {filteredLanguages.map((lang) => (
                      <div
                        key={lang.value}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors
                          ${personalData[name] === lang.value ? 'bg-[#FFD966] bg-opacity-10 font-medium' : ''}`}
                        onClick={() => handleLanguageSelect(lang.value)}
                      >
                        <div className="flex items-center gap-2">
                          {getLanguageIcon(lang.value)}
                          <span>{lang.label}</span>
                        </div>
                        {personalData[name] === lang.value && (
                          <FaCheck className="text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">No languages found</div>
                )}
              </div>
            )}
          </div>
          {errors[name] && (
            <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
              <FaInfoCircle className="flex-shrink-0" />
              {errors[name]}
            </p>
          )}
        </div>
      );
    }
    
    return (
      <div className={`space-y-1 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
          {getFieldIcon()}
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'select' ? (
          <select
            name={name}
            value={personalData[name] || ''}
            onChange={handleChange}
            disabled={disabled}
            className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base appearance-none ${
              errors[name]
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 hover:border-[#FFD966] focus:border-[#FFD966] focus:ring-[#FFD966] transition-colors'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
              backgroundRepeat: 'no-repeat', 
              backgroundPosition: 'right 0.5rem center', 
              backgroundSize: '1.5em 1.5em', 
              paddingRight: '2.5rem' 
            }}
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
                : 'border-gray-300 hover:border-[#FFD966] focus:border-[#FFD966] focus:ring-[#FFD966] transition-colors'
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
                : 'border-gray-300 hover:border-[#FFD966] focus:border-[#FFD966] focus:ring-[#FFD966] transition-colors'
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
  };

  const CheckboxField = ({ label, name, className = '' }) => (
    <div className={`flex items-center ${className} hover:bg-gray-100 p-1 rounded-md transition-colors -mx-1`}>
      <input
        type="checkbox"
        name={name}
        checked={personalData[name] || false}
        onChange={handleChange}
        className="h-4 w-4 text-[#FFD966] focus:ring-[#FFD966] border-gray-300 rounded cursor-pointer"
      />
      <label className="ml-2 text-sm text-gray-700 cursor-pointer select-none flex-1">{label}</label>
    </div>
  );

  // Add animation styles
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

      {/* API Error Alert */}
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

        {/* Settlement */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <FaCheck className="text-green-500" />
            <h3>Settlement</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormField
              label="Settlement"
              name="settlement"
              type="select"
              options={Array.isArray(settlements) ? settlements.map(settlement => ({
                value: settlement.id || settlement,
                label: settlement.name || settlement
              })) : []}
              required
              disabled={loading.settlements}
              className="sm:col-span-2"
            />
            {loading.settlements && (
              <div className="flex items-center text-gray-500 sm:col-span-2">
                <FaSpinner className="animate-spin mr-2" />
                Loading available settlements...
              </div>
            )}
            {!loading.settlements && settlements.length === 0 && (
              <div className="text-red-500 sm:col-span-2">
                {apiError.settlements 
                  ? "Couldn't connect to the server. Please try again later."
                  : "No settlements available for sign-up. Please contact support."}
              </div>
            )}
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
            disabled={loading.settlements}
            className={`w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 text-sm sm:text-base font-medium flex items-center justify-center gap-2 shadow-md ${
              loading.settlements ? 'opacity-50 cursor-not-allowed' : ''
            }`}
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