import React, { useState, useRef, useEffect } from 'react';
import { FaUpload, FaQrcode, FaFile, FaTimes, FaSpinner, FaInfoCircle, FaMars, FaVenus, FaGenderless } from 'react-icons/fa';
import useSignupStore from '../../store/signupStore';
import { createWorker } from 'tesseract.js';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import debounce from 'lodash.debounce';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import localSettlements from '../../data/settlements.json';
import Select from 'react-select';
import { Users, Star, Check } from 'lucide-react';

const IDVerification = ({ onComplete }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { idVerificationData, updateIdVerificationData } = useSignupStore();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settlements, setSettlements] = useState([]);
  const [loadingSettlements, setLoadingSettlements] = useState(true);
  const [settlementsError, setSettlementsError] = useState(false);
  const [settlementSearch, setSettlementSearch] = useState('');
  const fileInputRef = useRef(null);

    const isValidIsraeliID = (id) => {
      if (!/^\d{5,9}$/.test(id)) return false;
      // Pad to 9 digits
      id = id.padStart(9, '0');
      let sum = 0;

      for (let i = 0; i < 9; i++) {
        let num = Number(id[i]);
        let multiplied = num * (i % 2 === 0 ? 1 : 2);
        if (multiplied > 9) multiplied -= 9;
        sum += multiplied;
      }

      return sum % 10 === 0;
    };

  const checkIdAvailability = debounce(async (idNumber) => {
    if (!idNumber || idNumber.length !== 9) return;

    try {      
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("idVerification.idNumber", "==", idNumber), where("role", "==", "retiree"));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setErrors((prev) => ({ ...prev, idNumber: t('auth.signup.idNumberRegistered') }));
        toast.error(t('auth.signup.idNumberRegistered'));
      } else {
        setErrors((prev) => ({ ...prev, idNumber: '' }));
        toast.success(t('auth.signup.idNumberAvailable'));
      }
      
    } catch (error) {
      console.error("Error checking ID number:", error);
      toast.error(t('auth.signup.idNumberCheckError'));
    }
  }, 500);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'dateOfBirth') {
      // Calculate age when dateOfBirth is updated
      const calculateAge = (dob) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };

      const age = calculateAge(value);

      // Update idVerificationData with dateOfBirth and age
      updateIdVerificationData({ dateOfBirth: value, age });
    } else if (name === 'idNumber') {
      const cleanValue = value.replace(/\D/g, '');
      const truncatedValue = cleanValue.slice(0, 9);
      updateIdVerificationData({ [name]: truncatedValue });

      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }

      if (truncatedValue.length === 9) {
        if (!isValidIsraeliID(truncatedValue)) {
          toast.error(t('auth.signup.invalidIsraeliId'));
        } else {
          checkIdAvailability(truncatedValue);
        }
      }
    } else {
      updateIdVerificationData({ [name]: value });
      if (name === 'settlement') {
        setSettlementSearch('');
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('auth.signup.invalidImageFile'));
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error(t('auth.signup.fileSizeLimit'));
      return;
    }

    setIsLoading(true);
    try {
      // Create a preview URL for the file
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      setUploadedFile(file);

      // Process the image with OCR
      await processImageWithOCR(file);
    } catch (error) {
      console.error('Error handling file:', error);
      toast.error(t('auth.signup.fileProcessingError'));
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = () => {
    if (previewUrl && previewUrl !== 'pdf') {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedFile(null);
  };

  const handleScan = () => {
    // Implement QR code scanning functionality here
    toast.info('QR code scanning will be implemented soon');
  };

  // Fetch available settlements from local JSON file
  useEffect(() => {
    try {
      setSettlements(localSettlements);
    } catch (error) {
      console.error('Error loading settlements from local file:', error);
      setSettlementsError(true);
    } finally {
      setLoadingSettlements(false);
    }
  }, []);

  const handleUpload = () => {
    fileInputRef.current.click();
  };

  const processImageWithOCR = async (imageFile) => {
    setIsProcessing(true);
    let worker = null;
    
    try {
      worker = await createWorker();
      await worker.load();
      // Use auto-detect languages without user selection
      await worker.loadLanguage('eng+ara+heb+rus');
      await worker.initialize('eng+ara+heb+rus');
      
      const { data: { text } } = await worker.recognize(imageFile);
      console.log('Extracted OCR text:', text);

      const extractedData = extractDataFromOCR(text);
      if (extractedData) {
        updateIdVerificationData(extractedData);
        toast.success(t('auth.signup.dataExtractedSuccess'));
      } else {
        toast.error(t('auth.signup.dataExtractedFail'));
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error(t('auth.signup.ocrProcessingError'));
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (terminateError) {
          console.error('Error terminating worker:', terminateError);
        }
      }
      setIsProcessing(false);
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
    const { firstName, lastName, dateOfBirth, gender, idNumber, settlement } = idVerificationData;

    if (!idNumber?.trim()) {
      newErrors.idNumber = t('auth.idVerification.errors.idRequired');
    } else if (!/^\d{9}$/.test(idNumber)) {
      newErrors.idNumber = t('auth.idVerification.errors.idFormat');
    } else if (errors.idNumber) {
      newErrors.idNumber = errors.idNumber;
    }

    if (!firstName?.trim()) {
      newErrors.firstName = t('auth.idVerification.errors.firstNameRequired');
    }

    if (!lastName?.trim()) {
      newErrors.lastName = t('auth.idVerification.errors.lastNameRequired');
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = t('auth.idVerification.errors.dateOfBirthRequired');
    } else {
      const age = calculateAge(dateOfBirth);
      if (age < 50) {
        newErrors.dateOfBirth = t('auth.idVerification.errors.ageRequirement');
        toast.error(t('auth.idVerification.errors.ageRequirementNotMet'));
      }
    }

    if (!gender) {
      newErrors.gender = t('auth.idVerification.errors.genderRequired');
    }

    if (!settlement) {
      newErrors.settlement = t('auth.idVerification.form.failedToLoadSettlements');
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

  // Add the missing extractDataFromOCR function
  const extractDataFromOCR = (text) => {
    // This is a placeholder function - you'll need to implement the actual OCR data extraction logic
    // based on the format of Israeli ID cards
    try {
      // Example implementation - adjust based on your specific requirements
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // You would implement specific parsing logic here based on Israeli ID card format
      // This is just an example structure
      const extractedData = {};
      
      // Look for patterns in the OCR text that match ID card fields
      // This would need to be customized based on actual ID card format
      
      return Object.keys(extractedData).length > 0 ? extractedData : null;
    } catch (error) {
      console.error('Error extracting data from OCR:', error);
      return null;
    }
  };

  // Floating background elements for visual consistency
  const FloatingElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-32 h-32 top-10 left-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '0s' }} />
      <div className="absolute w-24 h-24 top-1/3 right-20 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute w-40 h-40 bottom-20 left-1/4 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '4s' }} />
      <div className="absolute w-20 h-20 bottom-1/3 right-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '6s' }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 relative">
      <FloatingElements />

      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-yellow-500 mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('auth.idVerification.title')}
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('auth.idVerification.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* ID & Personal Info Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <div className="flex items-center mb-6">
              <Star className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('auth.idVerification.form.identificationDetails')}
                </h3>
                <p className="text-gray-600 text-lg">{t('auth.idVerification.form.enterIdAndPersonalInfo')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* ID Number */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t('auth.idVerification.form.idNumber')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={idVerificationData.idNumber || ''}
                  onChange={handleChange}
                  placeholder={t('auth.idVerification.form.idNumberPlaceholder')}
                  maxLength="9"
                  className={`w-full px-3 py-2 rounded-xl shadow-sm text-base transition-colors duration-200 ${
                    errors.idNumber
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-yellow-400 focus:ring-yellow-100'
                  }`}
                />
                {errors.idNumber && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <FaInfoCircle className="flex-shrink-0" />
                    {errors.idNumber}
                  </p>
                )}
              </div>
              {/* First Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t('auth.idVerification.form.firstName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={idVerificationData.firstName || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-xl shadow-sm text-base transition-colors duration-200 ${
                    errors.firstName
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-yellow-400 focus:ring-yellow-100'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <FaInfoCircle className="flex-shrink-0" />
                    {errors.firstName}
                  </p>
                )}
              </div>
              {/* Last Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t('auth.idVerification.form.lastName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={idVerificationData.lastName || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-xl shadow-sm text-base transition-colors duration-200 ${
                    errors.lastName
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-yellow-400 focus:ring-yellow-100'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <FaInfoCircle className="flex-shrink-0" />
                    {errors.lastName}
                  </p>
                )}
              </div>
              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t('auth.idVerification.form.dateOfBirth')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={idVerificationData.dateOfBirth || ''}
                  onChange={handleChange}
                  min="1900-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 rounded-xl shadow-sm text-base transition-colors duration-200 ${
                    errors.dateOfBirth
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-yellow-400 focus:ring-yellow-100'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <FaInfoCircle className="flex-shrink-0" />
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>
            </div>
            {/* Gender Selection */}
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.idVerification.form.gender')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => handleChange({ target: { name: 'gender', value: 'male' } })}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:shadow-md ${
                    idVerificationData.gender === 'male'
                      ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-xl shadow-yellow-200/50 scale-105 -translate-y-0.5'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-gray-50'
                  }`}
                >
                  <FaMars className={`text-2xl ${idVerificationData.gender === 'male' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`text-base font-semibold ${idVerificationData.gender === 'male' ? 'text-gray-900' : 'text-gray-600'}`}>
                    {t('auth.idVerification.form.genderMale')}
                  </span>
                  {idVerificationData.gender === 'male' && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400 text-white flex items-center justify-center">
                      <Check size={16} />
                    </div>
                  )}
                </div>
                <div
                  onClick={() => handleChange({ target: { name: 'gender', value: 'female' } })}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:shadow-md ${
                    idVerificationData.gender === 'female'
                      ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-xl shadow-yellow-200/50 scale-105 -translate-y-0.5'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-gray-50'
                  }`}
                >
                  <FaVenus className={`text-2xl ${idVerificationData.gender === 'female' ? 'text-pink-600' : 'text-gray-500'}`} />
                  <span className={`text-base font-semibold ${idVerificationData.gender === 'female' ? 'text-gray-900' : 'text-gray-600'}`}>
                    {t('auth.idVerification.form.genderFemale')}
                  </span>
                  {idVerificationData.gender === 'female' && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400 text-white flex items-center justify-center">
                      <Check size={16} />
                    </div>
                  )}
                </div>
                <div
                  onClick={() => handleChange({ target: { name: 'gender', value: 'other' } })}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:shadow-md ${
                    idVerificationData.gender === 'other'
                      ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-xl shadow-yellow-200/50 scale-105 -translate-y-0.5'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-gray-50'
                  }`}
                >
                  <FaGenderless className={`text-2xl ${idVerificationData.gender === 'other' ? 'text-purple-600' : 'text-gray-500'}`} />
                  <span className={`text-base font-semibold ${idVerificationData.gender === 'other' ? 'text-gray-900' : 'text-gray-600'}`}>
                    {t('auth.idVerification.form.genderOther')}
                  </span>
                  {idVerificationData.gender === 'other' && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400 text-white flex items-center justify-center">
                      <Check size={16} />
                    </div>
                  )}
                </div>
              </div>
              {errors.gender && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
                  <FaInfoCircle className="flex-shrink-0" />
                  {errors.gender}
                </p>
              )}
            </div>
          </div>

          {/* Settlement Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <div className="flex items-center mb-6">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('auth.idVerification.form.settlementTitle')}
                </h3>
                <p className="text-gray-600 text-lg">{t('auth.idVerification.form.settlementSubtitle')}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('auth.idVerification.form.settlement')} <span className="text-red-500">*</span>
              </label>
              {loadingSettlements ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <FaSpinner className="animate-spin" />
                  <span>{t('auth.idVerification.form.loadingSettlements')}</span>
                </div>
              ) : settlementsError ? (
                <div className="text-red-500 flex items-center gap-1">
                  <FaInfoCircle />
                  <span>{t('auth.idVerification.form.failedToLoadSettlements')}</span>
                </div>
              ) : (
                <Select
                  options={settlements.map(s => ({
                    value: s.id || s.name,
                    label: s.name || s,
                  }))}
                  value={
                    settlements.find(s => s.id === idVerificationData.settlement || s.name === idVerificationData.settlement)
                      ? {
                          value: idVerificationData.settlement,
                          label:
                            settlements.find(s => s.id === idVerificationData.settlement || s.name === idVerificationData.settlement)
                              ?.name || idVerificationData.settlement,
                        }
                      : null
                  }
                  onChange={(selected) => {
                    updateIdVerificationData({ settlement: selected.value });
                  }}
                  placeholder={t('auth.idVerification.form.settlementPlaceholder')}
                  isSearchable
                  className="text-base"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: errors.settlement ? '#ef4444' : '#d1d5db',
                      boxShadow: state.isFocused ? '0 0 0 1px #FFD966' : '',
                      '&:hover': {
                        borderColor: '#FFD966',
                      },
                      minHeight: 44,
                      borderRadius: 12,
                    }),
                  }}
                />
              )}
              {errors.settlement && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <FaInfoCircle className="flex-shrink-0" />
                  {errors.settlement}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-8">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Star className="w-6 h-6" />
              <span>{t('auth.idVerification.form.submit') || 'Submit'}</span>
              <Star className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>

      <style>{`
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
};

export default IDVerification;