import React, { useState } from 'react';
import useSignupStore from '../../store/signupStore';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const IDVerification = ({ onComplete }) => {
  const { t } = useLanguage();
  const [errors, setErrors] = useState({});
  const { idVerificationData, updateIdVerificationData } = useSignupStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'idNumber') {
      const cleanValue = value.replace(/\D/g, '');
      const truncatedValue = cleanValue.slice(0, 9);
      updateIdVerificationData({ [name]: truncatedValue });
      if (truncatedValue.length !== 9 && truncatedValue.length > 0) {
        setErrors(prev => ({ ...prev, [name]: 'ID number must be exactly 9 digits' }));
      } else {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    } else {
      updateIdVerificationData({ [name]: value });
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const calculateAge = (dateString) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!idVerificationData.firstName) {
      newErrors.firstName = t('auth.idVerification.error.firstNameRequired');
    }
    if (!idVerificationData.lastName) {
      newErrors.lastName = t('auth.idVerification.error.lastNameRequired');
    }
    if (!idVerificationData.idNumber) {
      newErrors.idNumber = t('auth.idVerification.error.idNumberRequired');
    } else if (!/^\d{9}$/.test(idVerificationData.idNumber)) {
      newErrors.idNumber = t('auth.idVerification.error.invalidIdNumber');
    }
    if (!idVerificationData.dateOfBirth) {
      newErrors.dateOfBirth = t('auth.idVerification.error.dateOfBirthRequired');
    } else {
      const age = calculateAge(idVerificationData.dateOfBirth);
      const finalAge = typeof age === 'string' ? parseInt(age.split(' ')[0], 10) : age;
      if (finalAge < 50) {
        newErrors.dateOfBirth = t('auth.idVerification.error.ageRequirement');
        toast.error(t('auth.idVerification.error.ageRequirementNotMet'));
      }
    }
    if (!idVerificationData.gender) {
      newErrors.gender = t('auth.idVerification.error.genderRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-md mt-4 sm:mt-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('auth.idVerification.title')}</h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600">{t('auth.idVerification.subtitle')}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.idVerification.form.firstName')} *
            </label>
            <input
              type="text"
              name="firstName"
              value={idVerificationData.firstName || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
                errors.firstName
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
              }`}
            />
            {errors.firstName && (
              <p className="text-xs sm:text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.idVerification.form.lastName')} *
            </label>
            <input
              type="text"
              name="lastName"
              value={idVerificationData.lastName || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
                errors.lastName
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
              }`}
            />
            {errors.lastName && (
              <p className="text-xs sm:text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.idVerification.form.idNumber')} *
            </label>
            <input
              type="text"
              name="idNumber"
              value={idVerificationData.idNumber || ''}
              onChange={handleChange}
              placeholder={t('auth.idVerification.form.idNumberPlaceholder')}
              maxLength="9"
              pattern="\d{9}"
              className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
                errors.idNumber
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
              }`}
            />
            {errors.idNumber && (
              <p className="text-xs sm:text-sm text-red-500">{errors.idNumber}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.idVerification.form.dateOfBirth')} *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={idVerificationData.dateOfBirth || ''}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
                errors.dateOfBirth
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="text-xs sm:text-sm text-red-500">{errors.dateOfBirth}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.idVerification.form.gender')} *
            </label>
            <select
              name="gender"
              value={idVerificationData.gender || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
                errors.gender
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
              }`}
            >
              <option value="">{t('auth.idVerification.form.selectGender')}</option>
              <option value="male">{t('auth.idVerification.form.male')}</option>
              <option value="female">{t('auth.idVerification.form.female')}</option>
            </select>
            {errors.gender && (
              <p className="text-xs sm:text-sm text-red-500">{errors.gender}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-[#FFD966] text-black rounded-lg hover:bg-yellow-400 transition"
          >
            {t('auth.idVerification.form.submit') || 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IDVerification; 