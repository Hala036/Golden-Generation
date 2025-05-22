import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSignupStore from '../../store/signupStore';
import IDVerification from './IDVerification';
import Credentials from './Credentials';
import PersonalDetails from './PersonalDetails';
import SignUpProgress from './SignUpProgress';
import { toast } from 'react-hot-toast';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FaArrowLeft } from 'react-icons/fa';
import WorkBackground from './WorkBackground';
import Lifestyle from './Lifestyle';
import VeteransCommunity from './VeteransCommunity';

const SignUp = () => {
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
    setStepValidation
  } = useSignupStore();

  // Reset store when component mounts
  useEffect(() => {
    resetStore();
  }, []);

  const handleStepComplete = async (step) => {
    // Validate and mark step as complete
    setStepValidation(step, true);

    if (step === 5) {
      try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          credentialsData.email,
          credentialsData.password
        );

        // Prepare user data
        const userData = {
          idVerification: idVerificationData,
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

        // Write to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        
        // Create username document
        await setDoc(doc(db, 'usernames', credentialsData.username.toLowerCase()), {
          uid: userCredential.user.uid
        });

        // Success handling
        resetStore();
        toast.success('Account created successfully!', { id: 'signup' });
        
        // Navigate to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } catch (error) {
        console.error('Signup error:', error);
        toast.error(error.message || 'Failed to create account. Please try again.', { id: 'signup' });
      }
    } else {
      setCurrentStep(step + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/login');
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
          Golden Generation
        </h1>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-20 pb-8">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Create Your Account
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
              className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <FaArrowLeft className="mr-2" />
              <span className="text-sm font-medium">Back</span>
            </button>
            {renderStep()}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#FFD966] hover:text-[#FFB800] font-medium transition-colors duration-200"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;