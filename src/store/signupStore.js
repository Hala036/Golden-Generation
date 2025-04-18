import { create } from 'zustand';

const useSignupStore = create((set) => ({
  // Current step
  currentStep: 0,
  stepValidation: {
    0: false, // ID Verification
    1: false, // Credentials
    2: false, // Personal Details
    3: false, // Work Background
    4: false, // Lifestyle
    5: false, // Veterans Community
  },

  // Form data for first 3 pages
  idVerificationData: {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    idType: '',
    idNumber: '',
    idImage: null,
  },

  credentialsData: {
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  },

  personalData: {
    address: '',
    phoneNumber: '',
    nativeLanguage: '',
    hebrewLevel: 'beginner',
    arrivalDate: '',
    originCountry: '',
    hasCar: false,
    healthCondition: '',
    livingAlone: false,
    familyInSettlement: false,
    hasWeapon: false,
    militaryService: 'none',
  },

  // Form data for last 3 pages
  workData: {
    retirementStatus: '',
    employmentDate: '',
    employmentType: '',
    lastJobs: [],
    academicDegrees: '',
    currentlyWorking: false,
    dischargeDate: '',
    subspecialty: ''
  },

  lifestyleData: {
    computerAbility: 0,
    sportActivity: 0,
    weeklySchedule: 0,
    interests: [],
    sportsSubspecialty: ''
  },

  veteransData: {
    currentActivities: [],
    notParticipatingReason: '',
    isVolunteer: false,
    volunteerAreas: [],
    volunteerFrequency: '',
    volunteerHours: '',
    volunteerDays: [],
    additionalVolunteering: false,
    additionalVolunteerFields: [],
    additionalVolunteerFrequency: '',
    additionalVolunteerHours: '',
    additionalVolunteerDays: [],
    needsConsultation: false,
    consultationFields: []
  },

  // Actions
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setStepValidation: (step, isValid) =>
    set((state) => ({
      stepValidation: {
        ...state.stepValidation,
        [step]: isValid,
      },
    })),

  updateIdVerificationData: (data) =>
    set((state) => ({
      idVerificationData: { ...state.idVerificationData, ...data },
    })),

  updateCredentialsData: (data) =>
    set((state) => ({
      credentialsData: { ...state.credentialsData, ...data },
    })),

  updatePersonalData: (data) =>
    set((state) => ({
      personalData: { ...state.personalData, ...data },
    })),

  setWorkData: (data) =>
    set((state) => ({
      workData: { ...state.workData, ...data },
    })),

  setLifestyleData: (data) =>
    set((state) => ({
      lifestyleData: { ...state.lifestyleData, ...data },
    })),

  setVeteransData: (data) =>
    set((state) => ({
      veteransData: { ...state.veteransData, ...data },
    })),

  // Reset store
  resetStore: () =>
    set({
      currentStep: 0,
      stepValidation: {
        0: false,
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
      },
      idVerificationData: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        idType: '',
        idNumber: '',
        idImage: null,
      },
      credentialsData: {
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      },
      personalData: {
        address: '',
        phoneNumber: '',
        nativeLanguage: '',
        hebrewLevel: 'beginner',
        arrivalDate: '',
        originCountry: '',
        hasCar: false,
        healthCondition: '',
        livingAlone: false,
        familyInSettlement: false,
        hasWeapon: false,
        militaryService: 'none',
      },
      workData: {
        retirementStatus: '',
        employmentDate: '',
        employmentType: '',
        lastJobs: [],
        academicDegrees: '',
        currentlyWorking: false,
        dischargeDate: '',
        subspecialty: ''
      },
      lifestyleData: {
        computerAbility: 0,
        sportActivity: 0,
        weeklySchedule: 0,
        interests: [],
        sportsSubspecialty: ''
      },
      veteransData: {
        currentActivities: [],
        notParticipatingReason: '',
        isVolunteer: false,
        volunteerAreas: [],
        volunteerFrequency: '',
        volunteerHours: '',
        volunteerDays: [],
        additionalVolunteering: false,
        additionalVolunteerFields: [],
        additionalVolunteerFrequency: '',
        additionalVolunteerHours: '',
        additionalVolunteerDays: [],
        needsConsultation: false,
        consultationFields: []
      },
    }),
}));

export default useSignupStore; 