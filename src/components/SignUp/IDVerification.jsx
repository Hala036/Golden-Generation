import React, { useState, useRef, useEffect } from 'react';
import { FaUpload, FaQrcode, FaFile, FaTimes, FaSpinner, FaInfoCircle, FaMars, FaVenus, FaGenderless } from 'react-icons/fa';
import useSignupStore from '../../store/signupStore';
import { createWorker } from 'tesseract.js';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { collection, query, where, getDocs } from "firebase/firestore";
import { debounce } from 'lodash';
import { db } from '../../firebase';

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
        setErrors((prev) => ({ ...prev, idNumber: "ID number is already registered" }));
        toast.error("ID number is already registered");
      } else {
        setErrors((prev) => ({ ...prev, idNumber: "" }));
        toast.success("ID number is available");
      }
    } catch (error) {
      console.error("Error checking ID number:", error);
      toast.error("Error checking ID number availability");
    }
  }, 500);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'idNumber') {
      const cleanValue = value.replace(/\D/g, '');
      const truncatedValue = cleanValue.slice(0, 9);
      updateIdVerificationData({ [name]: truncatedValue });
      // Remove the immediate validation
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }

      // Validate ID number when it reaches 9 digits
      if (truncatedValue.length === 9) {
        if (!isValidIsraeliID(truncatedValue)) {
          toast.error('Invalid Israeli ID number');
        } else {
          // If valid, check availability
          checkIdAvailability(truncatedValue);
        }
      }
    } else {
      updateIdVerificationData({ [name]: value });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, JPEG, or PNG)');
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
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
      toast.error('Error processing file. Please try again.');
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

  // Fetch available settlements from API
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setSettlementsError(false);
        const response = await fetch('/api/settlements');

        if (!response.ok) {
          throw new Error(`Failed to fetch settlements: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setSettlements(data);
      } catch (error) {
        console.error('Error fetching settlements:', error);
        setSettlementsError(true);
        toast.error('Failed to load available settlements. Please try again later.');
      } finally {
        setLoadingSettlements(false);
      }
    };

    fetchSettlements();
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
        toast.success('Data extracted successfully!');
      } else {
        toast.error('Could not extract data from image. Please try again.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('Error processing image. Please try again or fill the form manually.');
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
      newErrors.idNumber = t("ID number is required");
    } else if (!/^\d{9}$/.test(idNumber)) {
      newErrors.idNumber = t("ID number must be 9 digits");
    } else if (errors.idNumber) {
      newErrors.idNumber = errors.idNumber;
    }

    if (!firstName?.trim()) {
      newErrors.firstName = t("First name is required");
    }

    if (!lastName?.trim()) {
      newErrors.lastName = t("Last name is required");
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = t("Date of birth is required");
    } else {
      const age = calculateAge(dateOfBirth);
      if (age < 50) {
        newErrors.dateOfBirth = t("Minimum age is 50 years");
        toast.error(t("Age requirement not met: minimum age is 50 years"));
      }
    }

    if (!gender) {
      newErrors.gender = "Gender is required";
    }

    if (!settlement) {
      newErrors.settlement = "Settlement is required";
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">ID Verification</h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600">Please provide your identification details</p>
      </div>
      
      {/* ID Upload Section */}
      <div className="mb-8">
        <div className="text-center mb-4">
          <p className="text-gray-600 text-sm sm:text-base mb-4">
            Upload or scan your ID for automatic filling, or fill the form manually
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png"
                className="hidden"
              />
              <button
                onClick={handleUpload}
                disabled={isLoading || isProcessing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#FFD966] text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
              >
                <FaUpload className="text-lg" />
                <span>{isProcessing ? 'Processing...' : 'Upload ID'}</span>
              </button>
            </div>
            
            <button
              onClick={handleScan}
              disabled={isLoading || isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#FFD966] text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
            >
              <FaQrcode className="text-lg" />
              <span>Scan ID</span>
            </button>
          </div>

          <p className="mt-2 text-xs sm:text-sm text-gray-500">
            Accepted formats: JPG, JPEG, PNG (max 5MB)
          </p>
        </div>

        {/* File Preview */}
        {uploadedFile && (
          <div className="mt-4 flex justify-center">
            <div className="relative inline-block">
              <div className="border rounded-lg p-4 bg-gray-50 max-w-xs sm:max-w-sm mx-auto">
                <button
                  onClick={removeFile}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <FaTimes size={12} />
                </button>
                {previewUrl === 'pdf' ? (
                  <div className="flex items-center justify-center p-4">
                    <FaFile className="text-4xl text-gray-400" />
                    <span className="ml-2 text-sm">{uploadedFile.name}</span>
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt="ID Preview"
                    className="max-w-full h-auto rounded"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* ID Number - First field */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              ID Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="idNumber"
              value={idVerificationData.idNumber || ''}
              onChange={handleChange}
              placeholder='Enter 9 digits'
              maxLength="9"
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

          {/* Other fields in a grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
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
                Last Name <span className="text-red-500">*</span>
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
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={idVerificationData.dateOfBirth || ''}
                onChange={handleChange}
                min="1900-01-01"
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
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div
                  onClick={() => handleChange({ target: { name: 'gender', value: 'male' } })}
                  className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:shadow-md ${
                    idVerificationData.gender === 'male'
                      ? 'border-[#FFD966] bg-[#FFD966] bg-opacity-20'
                      : 'border-gray-300 hover:border-[#FFD966] hover:bg-gray-50'
                  }`}
                >
                  <FaMars className={`text-xl ${idVerificationData.gender === 'male' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${idVerificationData.gender === 'male' ? 'text-gray-900' : 'text-gray-600'}`}>
                    Male
                  </span>
                </div>
                
                <div
                  onClick={() => handleChange({ target: { name: 'gender', value: 'female' } })}
                  className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:shadow-md ${
                    idVerificationData.gender === 'female'
                      ? 'border-[#FFD966] bg-[#FFD966] bg-opacity-20'
                      : 'border-gray-300 hover:border-[#FFD966] hover:bg-gray-50'
                  }`}
                >
                  <FaVenus className={`text-xl ${idVerificationData.gender === 'female' ? 'text-pink-600' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${idVerificationData.gender === 'female' ? 'text-gray-900' : 'text-gray-600'}`}>
                    Female
                  </span>
                </div>
                
                <div
                  onClick={() => handleChange({ target: { name: 'gender', value: 'other' } })}
                  className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:shadow-md ${
                    idVerificationData.gender === 'other'
                      ? 'border-[#FFD966] bg-[#FFD966] bg-opacity-20'
                      : 'border-gray-300 hover:border-[#FFD966] hover:bg-gray-50'
                  }`}
                >
                  <FaGenderless className={`text-xl ${idVerificationData.gender === 'other' ? 'text-purple-600' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${idVerificationData.gender === 'other' ? 'text-gray-900' : 'text-gray-600'}`}>
                    Other
                  </span>
                </div>
              </div>
              {errors.gender && (
                <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <FaInfoCircle className="flex-shrink-0" />
                  {errors.gender}
                </p>
              )}
            </div>
          </div>

          {/* Settlement Dropdown - Full width */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Settlement <span className="text-red-500">*</span>
            </label>
            {loadingSettlements ? (
              <div className="flex items-center gap-2 text-gray-500">
                <FaSpinner className="animate-spin" />
                <span>Loading settlements...</span>
              </div>
            ) : settlementsError ? (
              <div className="text-red-500 flex items-center gap-1">
                <FaInfoCircle />
                <span>Failed to load settlements. Please try again later.</span>
              </div>
            ) : (
              <select
                name="settlement"
                value={idVerificationData.settlement || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
                  errors.settlement
                    ? 'border-red-500'
                    : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
                }`}
              >
                <option value="">Select settlement</option>
                {settlements.map(settlement => (
                  <option key={settlement.id || settlement} value={settlement.id || settlement}>
                    {settlement.name || settlement}
                  </option>
                ))}
              </select>
            )}
            {errors.settlement && (
              <p className="text-xs sm:text-sm text-red-500">{errors.settlement}</p>
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