import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import useSignupStore from '../../store/signupStore';
import IDVerification from './IDVerification';
import Credentials from './Credentials';
import PersonalDetails from './PersonalDetails';
import SignUpProgress from './SignUpProgress';
import { toast } from 'react-hot-toast';
import { auth, db, getUserData } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import WorkBackground from './WorkBackground';
import Lifestyle from './Lifestyle';
import VeteransCommunity from './VeteransCommunity';
import { triggerNotification } from '../SharedDashboard/TriggerNotifications'; // Import the triggerNotification function

const SignUp = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { 
    currentStep, 
    idVerificationData,
    credentialsData,
    personalData,
    workData,
    lifestyleData,
    veteransData,
    setCurrentStep, 
    resetStore, 
    stepValidation,
    setStepValidation,
    setRole
  } = useSignupStore();

  const [creating, setCreating] = useState(false);

  // Reset store when component mounts
  useEffect(() => {
    resetStore();
  }, []);

  const handleStepComplete = async (step) => {
    // Validate and mark step as complete
    setStepValidation(step, true);

    if (step === 5) {
      setCreating(true); // Start loading
      try {
        // Debug log for idVerificationData
        console.log('idVerificationData before user creation:', idVerificationData);
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          credentialsData.email,
          credentialsData.password
        );

        // 2. Prepare user data
        const userData = {
          idVerification: {
            ...idVerificationData,
            settlement: idVerificationData.settlement // ensure settlement is nested
          },
          credentials: {
            email: credentialsData.email,
            username: credentialsData.username
          },
          personalDetails: personalData,
          workBackground: workData || {},
          lifestyle: lifestyleData || {},
          veteransCommunity: veteransData || {},
          role: 'retiree',
          createdAt: new Date().toISOString(),
        };

        // Clean undefined values before saving
        const cleanedUserData = removeUndefined(userData);

        // 3. Write to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), cleanedUserData);

        // 4. Create username document
        await setDoc(doc(db, 'usernames', credentialsData.username.toLowerCase()), {
          uid: userCredential.user.uid
        });

        // 5. Send welcome notification
        const welcomeMessage = `${t('auth.signup.welcomeMessage')} ${credentialsData.username}! ${t('auth.signup.welcomeSubmessage')}`;
        await triggerNotification({
          message: welcomeMessage,
          target: [userCredential.user.uid], // Send notification to the newly created user
          link: '/dashboard', // Link to the dashboard
          createdBy: 'system', // System-generated notification
          type: 'info' // Notification type
        });

        // 6. Sign in the user (optional, for direct dashboard access)
        await signInWithEmailAndPassword(auth, credentialsData.email, credentialsData.password);

        // Fetch user data and set role in Zustand
        const userDataFromFirestore = await getUserData(userCredential.user.uid);
        if (userDataFromFirestore?.role) {
          setRole(userDataFromFirestore.role);
        }

        // 7. Success handling
        resetStore();
        toast.success(t('auth.signup.accountCreatedSuccess'), { id: 'signup' });

        // 8. Navigate to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Signup error:', error);
        toast.error(error.message || t('auth.signup.accountCreationFailed'), { id: 'signup' });
      } finally {
        setCreating(false); // End loading
      }
    } else {
      setCurrentStep(step + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1); // Go back to previous page in history
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <IDVerification onComplete={() => handleStepComplete(0)} />;
      case 1:
        return <Credentials onComplete={() => handleStepComplete(1)} />;
      case 2:
        return <PersonalDetails onComplete={() => handleStepComplete(2)} />;
      case 3:
        return <WorkBackground onComplete={() => handleStepComplete(3)} />;
      case 4:
        return <Lifestyle onComplete={() => handleStepComplete(4)} />;
      case 5:
        return <VeteransCommunity onComplete={() => handleStepComplete(5)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Logo */}
      <div className="absolute top-4 left-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#FFD966]">
          {t('auth.signup.logo')}
        </h1>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-20 pb-8">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            {t('auth.signup.createAccount')}
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 sm:mb-12">
          <SignUpProgress currentStep={currentStep} stepValidation={stepValidation} />
        </div>

        {/* Form Container */}
        <div className="flex justify-center">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl relative">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className={`absolute top-4 ${language === 'he' ? 'right-4' : 'left-4'} flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200`}
            >
              {language === 'he' ? (
                <>
                  <FaArrowRight className="mr-2" />
                  <span className="text-sm font-medium">{t('auth.signup.back')}</span>
                </>
              ) : (
                <>
                  <FaArrowRight className="mr-2" />
                  <span className="text-sm font-medium">{t('auth.signup.back')}</span>
                </>
              )}
            </button>
            {renderStep()}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('auth.signup.alreadyHaveAccount')}{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#FFD966] hover:text-[#FFB800] font-medium transition-colors duration-200"
            >
              {t('auth.signup.signIn')}
            </button>
          </p>
        </div>
      </div>

      {/* Loading Spinner */}
      {creating && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-lg font-medium">{t('auth.signup.creatingAccount')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility to recursively remove undefined fields from an object
function removeUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = removeUndefined(value);
      }
      return acc;
    }, {});
  }
  return obj;
}

export default SignUp;