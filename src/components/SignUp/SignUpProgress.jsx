import React from 'react';

const steps = [
  'ID Verification',
  'Account Credentials',
  'Personal Details',
  'Work Background',
  'Lifestyle',
  'Veterans Community'
];

const SignUpProgress = ({ currentStep, stepValidation = {} }) => {
  return (
    <div className="max-w-4xl mx-auto mt-4 sm:mt-8 px-4">
      {/* Mobile Progress Bar */}
      <div className="block sm:hidden mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-600">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-sm font-medium text-[#FFD966]">{steps[currentStep]}</span>
        </div>
        <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FFD966] to-[#FFB800] transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Steps */}
      <div className="hidden sm:block">
        <div className="flex justify-between items-center relative">
          {/* Background Line */}
          <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full shadow-inner"></div>
          
          {/* Progress Line */}
          <div
            className="absolute top-5 left-0 h-1 transition-all duration-500 ease-out rounded-full"
            style={{ 
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
              background: `linear-gradient(to right, ${currentStep > 0 ? 'rgb(34 197 94)' : '#FFD966'}, ${currentStep > 0 ? 'rgb(34 197 94)' : '#FFB800'})`
            }}
          ></div>

          {/* Steps */}
          {steps.map((step, index) => {
            const isValid = stepValidation[index] || false;
            return (
              <div key={index} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 shadow-lg ${
                    index === currentStep
                      ? 'border-[#FFD966] bg-[#FFD966] text-white scale-110 shadow-[#FFD966]/30'
                      : isValid
                      ? 'border-green-500 bg-green-500 text-white shadow-green-500/20'
                      : index < currentStep
                      ? 'border-green-500 bg-green-500 text-white shadow-green-500/20'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {isValid ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-lg font-bold">{index + 1}</span>
                  )}
                </div>
                <span className={`mt-3 text-xs font-medium absolute -bottom-8 transform -translate-x-1/2 left-1/2 whitespace-nowrap ${
                  index === currentStep ? 'text-[#FFD966] font-semibold' : 'text-gray-500'
                }`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SignUpProgress; 