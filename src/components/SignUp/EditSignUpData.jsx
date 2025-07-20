import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import IDVerification from "./IDVerification";
import Credentials from "./Credentials";
import PersonalDetails from "./PersonalDetails";
import WorkBackground from "./WorkBackground";
import Lifestyle from "./Lifestyle";
import VeteransCommunity from "./VeteransCommunity";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import useSignupStore from '../../store/signupStore';
import { useLanguage } from "../../context/LanguageContext";

const SECTIONS = [
  { key: "idVerification", label: "ID Verification", component: IDVerification },
  { key: "credentials", label: "Account Credentials", component: Credentials },
  { key: "personalDetails", label: "Personal Details", component: PersonalDetails },
  { key: "workBackground", label: "Work Background", component: WorkBackground },
  { key: "lifestyle", label: "Lifestyle", component: Lifestyle },
  { key: "veteransCommunity", label: "Veterans Community", component: VeteransCommunity },
];

const FIRESTORE_TO_STORE_KEY = {
  idVerification: 'idVerificationData',
  credentials: 'credentialsData',
  personalDetails: 'personalData',
  workBackground: 'workData',
  lifestyle: 'lifestyleData',
  veteransCommunity: 'veteransData',
};

const STORE_TO_FIRESTORE_KEY = {
  idVerificationData: 'idVerification',
  credentialsData: 'credentials',
  personalData: 'personalDetails',
  workData: 'workBackground',
  lifestyleData: 'lifestyle',
  veteransData: 'veteransCommunity',
};

// Utility to sanitize data for Firestore
function sanitizeData(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeData);
  } else if (obj && typeof obj === 'object') {
    const clean = {};
    for (const key in obj) {
      let value = obj[key];
      if (typeof value === 'undefined') value = null;
      if (
        typeof value === 'function' ||
        typeof value === 'symbol' ||
        (typeof value === 'object' && value !== null && (value.$$typeof || value._owner)) // React element
      ) {
        continue;
      }
      clean[key] = sanitizeData(value);
    }
    return clean;
  }
  if (typeof obj === 'undefined') return null;
  return obj;
}

const EditSignUpData = () => {
  const [selectedSection, setSelectedSection] = useState(SECTIONS[0].key);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionData, setSectionData] = useState({});
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const sectionPrefilled = useRef({});
  const { language } = useLanguage();
  // Zustand store selectors
  const {
    idVerificationData,
    credentialsData,
    personalData,
    workData,
    lifestyleData,
    veteransData
  } = useSignupStore();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData(userSnap.data());
        setSectionData(userSnap.data());
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  // Prefill Zustand store for all sections on first load
  useEffect(() => {
    if (userData) {
      if (userData.idVerification && !sectionPrefilled.current.idVerification) {
        useSignupStore.getState().updateIdVerificationData(userData.idVerification);
        sectionPrefilled.current.idVerification = true;
      }
      if (userData.credentials && !sectionPrefilled.current.credentials) {
        useSignupStore.getState().updateCredentialsData({ ...userData.credentials, password: "", confirmPassword: "" });
        sectionPrefilled.current.credentials = true;
      }
      if (userData.personalDetails && !sectionPrefilled.current.personalDetails) {
        useSignupStore.getState().updatePersonalData(userData.personalDetails);
        sectionPrefilled.current.personalDetails = true;
      }
      if (userData.workBackground && !sectionPrefilled.current.workBackground) {
        useSignupStore.getState().setWorkData(userData.workBackground);
        sectionPrefilled.current.workBackground = true;
      }
      if (userData.lifestyle && !sectionPrefilled.current.lifestyle) {
        useSignupStore.getState().setLifestyleData(userData.lifestyle);
        sectionPrefilled.current.lifestyle = true;
      }
      if (userData.veteransCommunity && !sectionPrefilled.current.veteransCommunity) {
        useSignupStore.getState().setVeteransData(userData.veteransCommunity);
        sectionPrefilled.current.veteransCommunity = true;
      }
    }
  }, [userData]);

  const handleSectionChange = (key) => {
    setSelectedSection(key);
    setCurrentStep(SECTIONS.findIndex(s => s.key === key));
  };

  const handleContinue = () => {
    // In editMode, call the exposed update-and-continue function for the current section
    const updateFns = {
      personalDetails: window.__updatePersonalDataAndContinue,
      workBackground: window.__updateWorkDataAndContinue,
      lifestyle: window.__updateLifestyleDataAndContinue,
      veteransCommunity: window.__updateVeteransDataAndContinue,
    };
    const sectionKey = SECTIONS[currentStep]?.key;
    if (updateFns[sectionKey]) {
      updateFns[sectionKey]();
      // After updating, move to the next step
      if (currentStep < SECTIONS.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setSelectedSection(SECTIONS[nextStep].key);
      }
    } else {
      // For idVerification and credentials, just move to next step
      if (currentStep < SECTIONS.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setSelectedSection(SECTIONS[nextStep].key);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setSelectedSection(SECTIONS[prevStep].key);
    } else {
      navigate(-1);
    }
  };

  const handleSave = async () => {
    // Call the update function for the current section to ensure latest data is in Zustand
    const updateFns = {
      personalDetails: window.__updatePersonalDataAndContinue,
      workBackground: window.__updateWorkDataAndContinue,
      lifestyle: window.__updateLifestyleDataAndContinue,
      veteransCommunity: window.__updateVeteransDataAndContinue,
    };
    const sectionKey = SECTIONS[currentStep]?.key;
    let latestVeteransData = veteransData;
    if (updateFns[sectionKey]) {
      const result = updateFns[sectionKey]();
      if (sectionKey === 'veteransCommunity' && result) {
        latestVeteransData = result;
      }
    }
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    // Fetch the original user document to preserve the role
    let originalRole = null;
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        originalRole = userSnap.data().role;
      }
    } catch (err) {
      console.error('Error fetching original user role:', err);
    }
    // Log the data being sent to Firestore
    const dataToSave = {
      idVerification: sanitizeData(idVerificationData),
      credentials: sanitizeData(credentialsData),
      personalDetails: sanitizeData(personalData),
      workBackground: sanitizeData(workData),
      lifestyle: sanitizeData(lifestyleData),
      veteransCommunity: sanitizeData(latestVeteransData),
      ...(originalRole ? { role: originalRole } : {}) // Always preserve the original role
    };
    console.log('Saving to Firestore:', dataToSave);
    try {
      await updateDoc(userRef, dataToSave);
      setUserData(dataToSave);
      alert("Information updated successfully!");
      navigate('/settings'); // Redirect to SettingsCards page after save
    } catch (err) {
      console.error('Firestore update error:', err);
      alert("Failed to update information.");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-gradient-to-br from-yellow-50 via-white to-blue-50">Loading...</div>;

  const SectionComponent = SECTIONS[currentStep]?.component;
  const sectionKey = SECTIONS[currentStep]?.key;
  const storeKey = FIRESTORE_TO_STORE_KEY[sectionKey];
  const sectionProps = userData ? userData[sectionKey] : {};

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-yellow-50 via-white to-blue-50">
      {/* Sidebar on the left (fixed for EN, right for HE) */}
      <div className={`w-72 min-w-60 max-w-80 border-r bg-white/90 p-8 flex flex-col gap-4 shadow-2xl z-20 fixed top-0 h-full
        ${language === "he" ? "right-0 border-l border-r-0" : "left-0 border-r"}`}>
        {/* Removed sidebar title */}
        {SECTIONS.map((section, idx) => (
          <button
            key={section.key}
            className={`text-left px-4 py-2 rounded-lg transition font-medium text-base mb-1 shadow-sm border border-transparent ${
              selectedSection === section.key
                ? "bg-yellow-500 text-white font-bold border-yellow-400 shadow-md" 
                : "hover:bg-yellow-100 text-gray-800"
            }`}
            onClick={() => handleSectionChange(section.key)}
          >
            {/* Hebrew translations for sidebar labels */}
            {section.key === "idVerification" && "אימות זהות"}
            {section.key === "credentials" && "פרטי התחברות"}
            {section.key === "personalDetails" && "פרטים אישיים"}
            {section.key === "workBackground" && "רקע תעסוקתי"}
            {section.key === "lifestyle" && "אורח חיים"}
            {section.key === "veteransCommunity" && "קהילת ותיקים"}
          </button>
        ))}
        <button
          className="mt-auto px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 font-medium border border-gray-200 shadow-sm"
          onClick={handleBack}
        >
          חזרה
        </button>
      </div>
      {/* Main Area */}
      <div className={`flex-1 flex justify-center items-center py-12 px-4 ${language === "he" ? "mr-72" : "ml-72"}`}>
        <div className="w-full max-w-3xl bg-white/95 rounded-3xl shadow-2xl p-10 border border-gray-100">
          <h2 className="text-3xl font-extrabold mb-6 text-center text-yellow-600 drop-shadow-sm">
            {/* Hebrew translation for section title */}
            {`עריכת ${
              sectionKey === "idVerification" ? "אימות זהות" :
              sectionKey === "credentials" ? "פרטי התחברות" :
              sectionKey === "personalDetails" ? "פרטים אישיים" :
              sectionKey === "workBackground" ? "רקע תעסוקתי" :
              sectionKey === "lifestyle" ? "אורח חיים" :
              sectionKey === "veteransCommunity" ? "קהילת ותיקים" :
              ""
            }`}
          </h2>
          {/* Password note for credentials page */}
          {sectionKey === 'credentials' && (
            <div className="mb-4 text-center text-sm text-gray-500">
              השאר את שדות הסיסמה ריקים כדי לשמור על הסיסמה הנוכחית שלך ללא שינוי.
            </div>
          )}
          <div className="mb-8">
            {SectionComponent && (
              <>
                <SectionComponent
                  editMode={true}
                  data={userData ? userData[sectionKey] : {}}
                  onComplete={handleContinue}
                />
                {/* Render Continue/Save button below the form content */}
                {currentStep < SECTIONS.length - 1 && (
                  <div className="flex justify-center mt-6">
                    <button
                      className="px-8 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 font-semibold text-lg shadow-md transition-all duration-200"
                      onClick={handleContinue}
                      disabled={saving}
                      type="button"
                    >
                      המשך
                    </button>
                  </div>
                )}
                {currentStep === SECTIONS.length - 1 && (
                  <div className="flex justify-center mt-6">
                    <button
                      className="px-8 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 font-semibold text-lg shadow-md transition-all duration-200"
                      onClick={handleSave}
                      disabled={saving}
                      type="button"
                    >
                      {saving ? "שומר..." : "שמור שינויים"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSignUpData; 