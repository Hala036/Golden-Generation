import React, { useState, useRef } from 'react';
import { FaUpload, FaQrcode, FaFile, FaTimes } from 'react-icons/fa';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import useSignupStore from '../../store/signupStore';
import { createWorker } from 'tesseract.js';
import { toast } from 'react-hot-toast';

const IDVerification = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('eng+ara+heb+rus'); // Default to multiple languages
  const fileInputRef = useRef(null);
  const { idVerificationData, updateIdVerificationData } = useSignupStore();

  // Language options for OCR
  const languageOptions = [
    { value: 'eng+ara+heb+rus', label: 'Auto Detect (Recommended)' },
    { value: 'eng', label: 'English' },
    { value: 'ara', label: 'Arabic' },
    { value: 'heb', label: 'Hebrew' },
    { value: 'rus', label: 'Russian' }
  ];

  const handleUpload = () => {
    fileInputRef.current.click();
  };

  const processImageWithOCR = async (imageFile) => {
    setIsProcessing(true);
    let worker = null;
    
    try {
      // Initialize worker
      worker = await createWorker();
      
      // Log initialization steps
      console.log('Loading Tesseract...');
      await worker.load();
      
      console.log('Loading language...');
      await worker.loadLanguage(selectedLanguage);
      
      console.log('Initializing...');
      await worker.initialize(selectedLanguage);
      
      console.log('Starting OCR...');
      const { data: { text } } = await worker.recognize(imageFile);
      console.log('Extracted OCR text:', text);

      // Extract information from OCR text
      const extractedData = extractDataFromOCR(text);
      if (extractedData) {
        updateIdVerificationData(extractedData);
        toast.success('Data extracted successfully!');
      } else {
        toast.error('Could not extract data from the image. Please fill the form manually.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('Error processing image. Please try again or fill the form manually.');
    } finally {
      if (worker) {
        try {
          console.log('Terminating worker...');
          await worker.terminate();
        } catch (terminateError) {
          console.error('Error terminating worker:', terminateError);
        }
      }
      setIsProcessing(false);
    }
  };

  const extractDataFromOCR = (text) => {
    console.log('Starting data extraction from:', text);
    const extractedData = {};

    // Split text into lines and normalize
    const lines = text.split(/[\n\r]+/).map(line => 
      line.trim()
        .replace(/[^\w\s.-]/g, ' ') // Replace special chars with space
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()
    );
    console.log('Processed lines:', lines);

    // Generic name detection
    let nameFound = false;

    // Common name patterns
    const nameIndicators = ['name', 'nom', 'nombre', 'nama', 'имя', 'naam'];
    const namePatterns = [
      // Pattern: "Name: John Smith" or "Name John Smith"
      new RegExp(`(?:${nameIndicators.join('|')})\\s*:?\\s*([A-Za-z]+(?:\\s+[A-Za-z]+){1,3})`, 'i'),
      // Pattern: Just "John Smith" (two or three word name)
      /^([A-Za-z]+(?:\s+[A-Za-z]+){1,2})$/,
      // Pattern: "SMITH, JOHN" (last name, first name format)
      /([A-Za-z]+)\s*,\s*([A-Za-z]+)/
    ];

    // Try each name pattern
    for (const line of lines) {
      if (nameFound) break;

      for (const pattern of namePatterns) {
        const match = line.match(pattern);
        if (match) {
          let firstName, lastName;
          
          if (match[2]) { // If it's in "Last, First" format
            firstName = match[2];
            lastName = match[1];
          } else {
            const nameParts = match[1].trim().split(/\s+/);
            firstName = nameParts[0];
            lastName = nameParts[nameParts.length - 1];
          }

          // Validate name parts
          if (firstName && lastName && 
              firstName.length >= 2 && lastName.length >= 2 &&
              /^[A-Za-z]+$/.test(firstName) && /^[A-Za-z]+$/.test(lastName)) {
            extractedData.firstName = firstName;
            extractedData.lastName = lastName;
            nameFound = true;
            console.log('Found name:', firstName, lastName);
            break;
          }
        }
      }
    }

    if (!nameFound) {
      console.log('Name not detected');
      toast.error('Name could not be detected. Please fill manually.');
    }

    // Generic ID number detection (updated for 9-digit IDs)
    const idPatterns = [
      // 9-digit number pattern
      /\b(\d{9})\b/,
      // General patterns if prefixed by common words
      /(?:ID|Number|No|№|Identity)\s*[:.]?\s*(\d{9})/i,
    ];    

    let idFound = false;
    for (const line of lines) {
      if (idFound) break;

      for (const pattern of idPatterns) {
        const match = line.match(pattern);
        if (match) {
          // Clean the ID number to ensure proper format
          let idNumber = match[1].replace(/\s+/g, '');
          
          // If it matches CNIC format (13 digits), format it properly
          if (idNumber.replace(/\D/g, '').length === 13) {
            const digits = idNumber.replace(/\D/g, '');
            idNumber = `${digits.slice(0,5)}-${digits.slice(5,12)}-${digits.slice(12)}`;
          }

          // Validate that the ID contains only digits and hyphens
          if (/^[\d-]+$/.test(idNumber) && idNumber.replace(/\D/g, '').length >= 5) {
            extractedData.idNumber = idNumber;
            idFound = true;
            console.log('Found ID:', idNumber);
            break;
          }
        }
      }
    }

    if (!idFound) {
      console.log('ID number not detected');
      toast.error('ID number could not be detected. Please fill manually.');
    }

    // Generic date of birth detection
    const datePatterns = [
      // DD.MM.YYYY or DD-MM-YYYY or DD/MM/YYYY
      /(?:birth|dob|born|date|geboren|né[e]?)\s*(?:of|:|\.)?\s*(\d{1,2})[-./](\d{1,2})[-./](\d{4})/i,
      // YYYY-MM-DD
      /(?:birth|dob|born|date|geboren|né[e]?)\s*(?:of|:|\.)?\s*(\d{4})[-./](\d{1,2})[-./](\d{1,2})/i,
      // Just the date patterns without indicators
      /\b(\d{1,2})[-./](\d{1,2})[-./](\d{4})\b/,
      /\b(\d{4})[-./](\d{1,2})[-./](\d{1,2})\b/
    ];

    let dateFound = false;
    for (const line of lines) {
      if (dateFound) break;

      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          let year, month, day;
          
          if (match[1].length === 4) { // YYYY-MM-DD format
            year = match[1];
            month = match[2];
            day = match[3];
          } else { // DD-MM-YYYY format
            day = match[1];
            month = match[2];
            year = match[3];
          }

          // Validate date
          const date = new Date(year, month - 1, day);
          if (date && date.getFullYear() > 1900 && date.getFullYear() < new Date().getFullYear()) {
            extractedData.dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            
            // Age validation
            const today = new Date();
            const age = today.getFullYear() - date.getFullYear();
            const monthDiff = today.getMonth() - date.getMonth();
            const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()) 
              ? age - 1 
              : age;

            if (finalAge < 50) {
              extractedData.ageError = 'Minimum age required is 50 years old';
              setErrors(prev => ({
                ...prev,
                dateOfBirth: 'Minimum age required is 50 years old'
              }));
            }
            
            dateFound = true;
            console.log('Found DOB:', extractedData.dateOfBirth);
            break;
          }
        }
      }
    }

    if (!dateFound) {
      console.log('Date of birth not detected');
      toast.error('Date of birth could not be detected. Please fill manually.');
    }

    // Generic gender detection
    const genderPatterns = [
      // Common gender indicators in various languages
      {
        male: ['male', 'm', 'masculino', 'männlich', 'homme', 'мужской', 'man'],
        female: ['female', 'f', 'femenino', 'weiblich', 'femme', 'женский', 'woman']
      }
    ];

    let genderFound = false;
    for (const line of lines) {
      if (genderFound) break;

      const normalizedLine = line.toLowerCase();
      
      // Check for gender indicators
      for (const pattern of genderPatterns) {
        if (pattern.male.some(indicator => 
          new RegExp(`\\b${indicator}\\b`, 'i').test(normalizedLine) ||
          normalizedLine.includes(`gender: ${indicator}`) ||
          normalizedLine.includes(`sex: ${indicator}`))) {
          extractedData.gender = 'male';
          genderFound = true;
          console.log('Found gender: male');
          break;
        }
        
        if (pattern.female.some(indicator => 
          new RegExp(`\\b${indicator}\\b`, 'i').test(normalizedLine) ||
          normalizedLine.includes(`gender: ${indicator}`) ||
          normalizedLine.includes(`sex: ${indicator}`))) {
          extractedData.gender = 'female';
          genderFound = true;
          console.log('Found gender: female');
          break;
        }
      }
    }

    if (!genderFound) {
      console.log('Gender not detected');
      toast.error('Gender could not be detected. Please select manually.');
    }

    console.log('Final extracted data:', extractedData);
    return Object.keys(extractedData).length > 0 ? extractedData : null;
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateIdVerificationData({ [name]: value });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { firstName, lastName, dateOfBirth, gender, idNumber } = idVerificationData;

    if (!firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!idNumber?.trim()) {
      newErrors.idNumber = 'ID number is required';
    } else if (!/^\d{9}$/.test(idNumber)) {
      newErrors.idNumber = 'ID number must be in format: XXXXXXXXX (9 digits)';
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;

      if (finalAge < 50) {
        newErrors.dateOfBirth = 'Minimum age required is 50 years old';
        toast.error('Age requirement not met: Minimum age required is 50 years old');
      }
    }

    if (!gender) newErrors.gender = 'Gender is required';

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
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">ID Verification</h2>
      
      {/* Language Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select ID Card Language
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]"
        >
          {languageOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              First Name *
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
              Last Name *
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
              ID Number *
            </label>
            <input
              type="text"
              name="idNumber"
              value={idVerificationData.idNumber || ''}
              onChange={handleChange}
              placeholder="Enter 9-digit ID number"
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
              Date of Birth *
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
              Gender *
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
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && (
              <p className="text-xs sm:text-sm text-red-500">{errors.gender}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm sm:text-base font-medium"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default IDVerification; 