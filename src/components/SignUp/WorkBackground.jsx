import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Star, Users, Check } from 'lucide-react';
import useSignupStore from '../../store/signupStore';
import Select from 'react-select';
import jobsList from '../../data/jobs.json';

// Comprehensive job categories with sub-specialties
const categorizedJobs = (t) => ({
  [t('auth.signup.workBackground.categories.healthcare')]: [
    { label: t('auth.signup.workBackground.jobs.Doctor'), icon: "🩺", subspecialties: [
      { label: t('auth.signup.workBackground.jobs.Cardiologist'), icon: "❤️" },
      { label: t('auth.signup.workBackground.jobs.Dermatologist'), icon: "🧬" },
      { label: t('auth.signup.workBackground.jobs.EmergencyPhysician'), icon: "🚑" },
      { label: t('auth.signup.workBackground.jobs.FamilyPhysician'), icon: "👨‍👩‍👧‍👦" },
      { label: t('auth.signup.workBackground.jobs.Gastroenterologist'), icon: "🔥" },
      { label: t('auth.signup.workBackground.jobs.Neurologist'), icon: "🧠" },
      { label: t('auth.signup.workBackground.jobs.Obstetrician'), icon: "🤰" },
      { label: t('auth.signup.workBackground.jobs.Oncologist'), icon: "🦠" },
      { label: t('auth.signup.workBackground.jobs.Ophthalmologist'), icon: "👁️" },
      { label: t('auth.signup.workBackground.jobs.OrthopedicSurgeon'), icon: "🦴" },
      { label: t('auth.signup.workBackground.jobs.Pediatrician'), icon: "👶" },
      { label: t('auth.signup.workBackground.jobs.Psychiatrist'), icon: "🧠" },
      { label: t('auth.signup.workBackground.jobs.Radiologist'), icon: "📡" },
      { label: t('auth.signup.workBackground.jobs.Surgeon'), icon: "🔪" },
      { label: t('auth.signup.workBackground.jobs.Other'), icon: "❓" }
    ]},
    { label: t('auth.signup.workBackground.jobs.Nurse'), icon: "👩‍⚕️", subspecialties: [
      { label: t('auth.signup.workBackground.jobs.RegisteredNurse'), icon: "💉" },
      { label: t('auth.signup.workBackground.jobs.NursePractitioner'), icon: "📋" },
      { label: t('auth.signup.workBackground.jobs.LicensedPracticalNurse'), icon: "🏥" },
      { label: t('auth.signup.workBackground.jobs.ICUNurse'), icon: "💓" },
      { label: t('auth.signup.workBackground.jobs.ERNurse'), icon: "🚨" },
      { label: t('auth.signup.workBackground.jobs.PediatricNurse'), icon: "👶" },
      { label: t('auth.signup.workBackground.jobs.Other'), icon: "❓" }
    ]},
    { label: t('auth.signup.workBackground.jobs.Dentist'), icon: "🦷", subspecialties: [
      { label: t('auth.signup.workBackground.jobs.GeneralDentist'), icon: "😁" },
      { label: t('auth.signup.workBackground.jobs.Orthodontist'), icon: "🦷" },
      { label: t('auth.signup.workBackground.jobs.OralSurgeon'), icon: "🔧" },
      { label: t('auth.signup.workBackground.jobs.Periodontist'), icon: "🦠" },
      { label: t('auth.signup.workBackground.jobs.Other'), icon: "❓" }
    ]},
    { label: t('auth.signup.workBackground.jobs.Pharmacist'), icon: "💊", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.PhysicalTherapist'), icon: "🦵", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Psychologist'), icon: "🧠", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Paramedic'), icon: "🚑", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherHealthcareProfessional'), icon: "❓", subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.engineeringTechnology')]: [
    { label: t('auth.signup.workBackground.jobs.SoftwareEngineer'), icon: "💻", subspecialties: [
      { label: t('auth.signup.workBackground.jobs.FrontendDeveloper'), icon: "🖥️" },
      { label: t('auth.signup.workBackground.jobs.BackendDeveloper'), icon: "🔧" },
      { label: t('auth.signup.workBackground.jobs.FullStackDeveloper'), icon: "🔄" },
      { label: t('auth.signup.workBackground.jobs.MobileDeveloper'), icon: "📱" },
      { label: t('auth.signup.workBackground.jobs.GameDeveloper'), icon: "🎮" },
      { label: t('auth.signup.workBackground.jobs.DevOpsEngineer'), icon: "☁️" },
      { label: t('auth.signup.workBackground.jobs.MachineLearningEngineer'), icon: "🤖" },
      { label: t('auth.signup.workBackground.jobs.Other'), icon: "❓" }
    ]},
    { label: t('auth.signup.workBackground.jobs.CivilEngineer'), icon: "🏗️", subspecialties: [
      { label: t('auth.signup.workBackground.jobs.StructuralEngineer'), icon: "🏢" },
      { label: t('auth.signup.workBackground.jobs.TransportationEngineer'), icon: "🚗" },
      { label: t('auth.signup.workBackground.jobs.EnvironmentalEngineer'), icon: "🌳" },
      { label: t('auth.signup.workBackground.jobs.GeotechnicalEngineer'), icon: "🏔️" },
      { label: t('auth.signup.workBackground.jobs.Other'), icon: "❓" }
    ]},
    { label: t('auth.signup.workBackground.jobs.MechanicalEngineer'), icon: "⚙️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ElectricalEngineer'), icon: "⚡", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ChemicalEngineer'), icon: "🧪", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.BiomedicalEngineer'), icon: "🔬", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.DataScientist'), icon: "📊", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ITSpecialist'), icon: "🖥️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherEngineeringTechProfessional'), icon: "❓", subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.businessFinance')]: [
    { label: t('auth.signup.workBackground.jobs.Accountant'), icon: "🧮", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.FinancialAnalyst'), icon: "📈", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.InvestmentBanker'), icon: "💰", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.MarketingManager'), icon: "📣", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.HumanResources'), icon: "👥", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.BusinessAnalyst'), icon: "📋", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ProjectManager'), icon: "📊", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Salesperson'), icon: "💼", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.RealEstateAgent'), icon: "🏠", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Entrepreneur'), icon: "🚀", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherBusinessProfessional'), icon: "❓", subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.education')]: [
    { label: t('auth.signup.workBackground.jobs.Teacher'), icon: "👩‍🏫", subspecialties: [
      { label: t('auth.signup.workBackground.jobs.ElementaryTeacher'), icon: "🧒" },
      { label: t('auth.signup.workBackground.jobs.MiddleSchoolTeacher'), icon: "📚" },
      { label: t('auth.signup.workBackground.jobs.HighSchoolTeacher'), icon: "🎓" },
      { label: t('auth.signup.workBackground.jobs.SpecialEducationTeacher'), icon: "❤️" },
      { label: t('auth.signup.workBackground.jobs.ESLTeacher'), icon: "🌎" },
      { label: t('auth.signup.workBackground.jobs.Other'), icon: "❓" }
    ]},
    { label: t('auth.signup.workBackground.jobs.Professor'), icon: "👨‍🏫", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.SchoolAdministrator'), icon: "🏫", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.SchoolCounselor'), icon: "🧠", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Librarian'), icon: "📚", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherEducationProfessional'), icon: "❓", subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.legal')]: [
    { label: t('auth.signup.workBackground.jobs.Lawyer'), icon: "⚖️", subspecialties: [
      { label: t('auth.signup.workBackground.jobs.CorporateLawyer'), icon: "🏢" },
      { label: t('auth.signup.workBackground.jobs.CriminalLawyer'), icon: "🔒" },
      { label: t('auth.signup.workBackground.jobs.FamilyLawyer'), icon: "👨‍👩‍👧‍👦" },
      { label: t('auth.signup.workBackground.jobs.IntellectualPropertyLawyer'), icon: "©️" },
      { label: t('auth.signup.workBackground.jobs.Other'), icon: "❓" }
    ]},
    { label: t('auth.signup.workBackground.jobs.Judge'), icon: "🧑‍⚖️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Paralegal'), icon: "📑", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.LegalSecretary'), icon: "⌨️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherLegalProfessional'), icon: "❓", subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.artsMedia')]: [
    { label: t('auth.signup.workBackground.jobs.Artist'), icon: "🎨", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Musician'), icon: "🎵", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Actor'), icon: "🎭", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Writer'), icon: "✍️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Journalist'), icon: "📰", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Photographer'), icon: "📷", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.GraphicDesigner'), icon: "🖌️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.UXUIDesigner'), icon: "📱", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.FilmVideoProducer'), icon: "🎬", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherCreativeProfessional'), icon: "❓", subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.serviceIndustry')]: [
    { label: t('auth.signup.workBackground.jobs.ChefCook'), icon: "👨‍🍳", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ServerWaiter'), icon: "🍽️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Bartender'), icon: "🍸", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Barista'), icon: "☕", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.HotelStaff'), icon: "🏨", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.FlightAttendant'), icon: "✈️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.TourGuide'), icon: "🧳", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.RetailWorker'), icon: "🛍️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Cashier'), icon: "💰", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherServiceProfessional'), icon: "❓", subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.tradesManualLabor')]: [
    { label: t('auth.signup.workBackground.jobs.Electrician'), icon: "💡", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Plumber'), icon: "🚰", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Carpenter'), icon: "🪚", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ConstructionWorker'), icon: "🏗️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Mechanic'), icon: "🔧", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Welder'), icon: "🔥", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Driver'), icon: "🚗", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Farmer'), icon: "🌾", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Landscaper'), icon: "🌳", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Cleaner'), icon: "🧹", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherTradeProfessional'), icon: "❓", subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.otherProfessions')]: [
    { label: t('auth.signup.workBackground.jobs.MilitaryPersonnel'), icon: "🪖", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.PoliceOfficer'), icon: "👮", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Firefighter'), icon: "🧑‍🚒", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Scientist'), icon: "🔬", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.SocialWorker'), icon: "🤝", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OfficeAdministrator'), icon: "🗂️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.GovernmentEmployee'), icon: "🏛️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Homemaker'), icon: "🏡", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ReligiousWorker'), icon: "🙏", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Volunteer'), icon: "🙌", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Retired'), icon: "🏖️", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Student'), icon: "📚", subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Other'), icon: "❓", subspecialties: [] }
  ]
});

// Flatten job categories for search functionality
const createFlatJobList = () => {
  const flatList = [];
  Object.entries(categorizedJobs(t)).forEach(([category, jobs]) => {
    jobs.forEach(job => {
      flatList.push({
        ...job,
        category
      });
    });
  });
  return flatList;
};

// Add SelectionCard component
const SelectionCard = ({ isSelected, onClick, children }) => (
  <div
    className={`relative overflow-hidden transition-all duration-300 ease-in-out cursor-pointer
      border-2 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50
      hover:border-yellow-300 hover:shadow-lg hover:scale-105
      ${isSelected 
        ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-xl shadow-yellow-200/50 scale-105 -translate-y-0.5' 
        : 'border-gray-200'
      }`}
    onClick={onClick}
  >
    {isSelected && (
      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400 text-white flex items-center justify-center">
        <Check size={16} />
      </div>
    )}
    {children}
  </div>
);

const WorkBackground = ({ onComplete }) => {
  const { t } = useLanguage();
  const { workData, setWorkData } = useSignupStore();
  const [formData, setFormData] = useState(workData || {
    retirementStatus: '',
    retirementDate: '',
    expectedRetirementDate: '',
    employmentDate: '',
    employmentType: '',
    category: '',
    jobTitle: '',
    subspecialty: '',
    otherJob: '',
    academicDegrees: [], // <-- now an array
    otherAcademicDegree: '',
    currentlyWorking: false,
    dischargeDate: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [showingAllCategories, setShowingAllCategories] = useState(true);
  const flatJobList = React.useMemo(() => {
    const flatList = [];
    Object.entries(categorizedJobs(t)).forEach(([category, jobs]) => {
      jobs.forEach(job => {
        flatList.push({
          ...job,
          category
        });
      });
    });
    return flatList;
  }, [t]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // Academic degrees list with translations - moved inside component
  const academicDegrees = [
    { value: "high_school", label: t('auth.signup.workBackground.academicDegrees.highSchool'), icon: "🏫" },
    { value: "associate", label: t('auth.signup.workBackground.academicDegrees.associateDegree'), icon: "🎓" },
    { value: "bachelor", label: t('auth.signup.workBackground.academicDegrees.bachelorsDegree'), icon: "📚" },
    { value: "master", label: t('auth.signup.workBackground.academicDegrees.mastersDegree'), icon: "📝" },
    { value: "phd", label: t('auth.signup.workBackground.academicDegrees.phd'), icon: "🧪" },
    { value: "postdoc", label: t('auth.signup.workBackground.academicDegrees.postDoc'), icon: "🔬" },
    { value: "professional", label: t('auth.signup.workBackground.academicDegrees.professionalCert'), icon: "📜" },
    { value: "vocational", label: t('auth.signup.workBackground.academicDegrees.vocationalTraining'), icon: "🛠️" },
    { value: "none", label: t('auth.signup.workBackground.academicDegrees.noFormalEducation'), icon: "🚫" },
    { value: "other", label: t('auth.signup.workBackground.academicDegrees.other'), icon: "❓" }
  ];

  useEffect(() => {
    if (searchTerm) {
      const filtered = Object.entries(categorizedJobs(t))
        .map(([category, jobs]) => {
          const filteredJobs = jobs.filter(job =>
            job.label.toLowerCase().includes(searchTerm.toLowerCase())
          );
          return filteredJobs.length > 0 ? { category, jobs: filteredJobs } : null;
        })
        .filter(Boolean);

      setFilteredCategories(filtered);
      setShowingAllCategories(false);
    } else {
      setShowingAllCategories(true);
      setFilteredCategories([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (formData.jobTitle) {
      const job = flatJobList.find(j => j.label === formData.jobTitle);
      if (job) {
        setSelectedJob(job);
        setActiveCategory(job.category);
        setShowingAllCategories(false);
      }
    }
  }, [formData.jobTitle, flatJobList]);

  // Clear retirement dates when status changes
  const handleRetirementStatusChange = (status) => {
    setFormData({
      ...formData,
      retirementStatus: status,
      retirementDate: '',
      expectedRetirementDate: '',
      expectToRetire: '',
      dischargeDate: '',
      currentlyWorking: status === 'not_retired'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const dataForFirebase = {
      ...formData,
      customJobInfo: {
        isCustomJob: formData.jobTitle === 'Other' || formData.subspecialty === 'Other',
        customJobTitle: formData.otherJob || null,
        originalSelection: {
          category: formData.category,
          jobTitle: formData.jobTitle,
          subspecialty: formData.subspecialty
        }
      },
      customAcademicInfo: {
        isCustomDegree: formData.academicDegrees.includes('other'),
        customDegreeTitle: formData.otherAcademicDegree || null,
      }
    };

    setWorkData(dataForFirebase);
    onComplete();
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setShowingAllCategories(false);
  };

  const handleJobSelect = (job, category) => {
    setSelectedJob(job);
    setFormData({
      ...formData,
      category,
      jobTitle: job.label,
      subspecialty: '',
      otherJob: job.label === 'Other' ? '' : undefined
    });
    setSearchTerm(''); // Clear search term when job is selected
  };

  const handleSubspecialtySelect = (subspecialty) => {
    setFormData({
      ...formData,
      subspecialty: subspecialty.label,
      otherJob: subspecialty.label === 'Other' ? '' : undefined
    });
  };

  const handleBackToCategories = () => {
    setShowingAllCategories(true);
    setActiveCategory('');
  };

  const handleBackToJobs = () => {
    // Keep the category but reset job selection
    setSelectedJob(null);
    setFormData({
      ...formData,
      jobTitle: '',
      subspecialty: '',
      otherJob: ''
    });
  };
  
  const handleChangeJob = () => {
    // Complete reset of job selection to start fresh
    setSelectedJob(null);
    setShowingAllCategories(true);
    setActiveCategory('');
    setFormData({
      ...formData,
      category: '',
      jobTitle: '',
      subspecialty: '',
      otherJob: ''
    });
  };

  const handleArraySelection = (field, value) => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      const updatedArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [field]: updatedArray
      };
    });
  };

  // Helper function to determine if selection is complete
  const isSelectionComplete = () => {
    if (!selectedJob) return false;
    
    // If job has subspecialties, we need a subspecialty selected
    if (selectedJob.subspecialties && selectedJob.subspecialties.length > 0) {
      return formData.subspecialty !== '';
    }
    
    // If job has no subspecialties, just having the job is enough
    return true;
  };

  // Helper function to get display title for selected job
  const getDisplayTitle = () => {
    if (formData.subspecialty === 'Other' && formData.otherJob) {
      return formData.otherJob;
    }
    if (formData.jobTitle === 'Other' && formData.otherJob) {
      return formData.otherJob;
    }
    return formData.subspecialty || selectedJob?.label || '';
  };

  const renderSelectedJobDisplay = () => {
    if (!selectedJob) return null;

    // Get the subspecialty icon if one is selected
    const selectedSubspecialty = selectedJob.subspecialties?.find(sub => sub.label === formData.subspecialty);
    const displayIcon = selectedSubspecialty ? selectedSubspecialty.icon : selectedJob.icon;
    const displayTitle = getDisplayTitle();

    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{displayIcon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{displayTitle}</h3>
              <p className="text-sm text-gray-600">{formData.category}</p>
              {formData.subspecialty && formData.subspecialty !== 'Other' && (
                <p className="text-sm text-yellow-700 font-medium">
                  {t('auth.signup.workBackground.specialty')}: {selectedJob.label}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleChangeJob}
            className="text-yellow-600 hover:text-yellow-700 font-medium text-sm px-3 py-1 rounded-md border border-yellow-300 hover:bg-yellow-200 transition-colors"
          >
            {t('auth.signup.workBackground.changeSelection')}
          </button>
        </div>
      </div>
    );
  };

  const renderOtherJobInput = () => {
    const showInput = (formData.jobTitle === 'Other' && (!selectedJob?.subspecialties || selectedJob.subspecialties.length === 0)) || 
                     (formData.subspecialty === 'Other');
    
    if (!showInput) return null;

    const placeholderText = formData.subspecialty === 'Other' 
      ? t('auth.signup.workBackground.enterCustomSpecialty') || 'Enter your specialty...'
      : t('auth.signup.workBackground.enterCustomJob') || 'Enter your job title...';

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {formData.subspecialty === 'Other' 
            ? t('auth.signup.workBackground.customSpecialty') || 'Custom Specialty'
            : t('auth.signup.workBackground.customJobTitle') || 'Custom Job Title'
          }
        </label>
        <input
          type="text"
          value={formData.otherJob || ''}
          onChange={(e) => setFormData({ ...formData, otherJob: e.target.value })}
          placeholder={placeholderText}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
      </div>
    );
  };

  const renderSubspecialties = () => {
    if (!selectedJob || !selectedJob.subspecialties || selectedJob.subspecialties.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <h4 className="text-md font-medium text-gray-800 mb-4">
          {t('auth.signup.workBackground.selectSpecialty')}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {selectedJob.subspecialties.map((sub) => (
            <SelectionCard
              key={sub.label}
              isSelected={formData.subspecialty === sub.label}
              onClick={() => handleSubspecialtySelect(sub)}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{sub.icon}</div>
                <div className="text-sm font-medium text-gray-800">{sub.label}</div>
            </div>
            </SelectionCard>
          ))}
        </div>
        {renderOtherJobInput()}
      </div>
    );
  };

  const renderJobsByCategory = (category, jobs) => {
    return (
      <div key={category} className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium text-gray-800">{category}</h4>
          {!showingAllCategories && (
            <button 
              type="button" 
              onClick={handleBackToCategories}
              className="text-sm bg-gray-100 px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-200 flex items-center"
            >
              <span className="mr-1">←</span> {t('auth.signup.workBackground.allCategories')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <SelectionCard
              key={job.label}
              isSelected={formData.jobTitle === job.label}
              onClick={() => handleJobSelect(job, category)}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{job.icon}</div>
                <div className="text-sm font-medium text-gray-800">{job.label}</div>
            </div>
            </SelectionCard>
          ))}
        </div>
        {/* Show input for 'Other' job selection when no subspecialties */}
        {formData.jobTitle === 'Other' && (!selectedJob?.subspecialties || selectedJob.subspecialties.length === 0) && renderOtherJobInput()}
      </div>
    );
  };

  const renderJobSelection = () => {
    // If selection is complete, only show the final selection display
    if (isSelectionComplete()) {
      return renderSelectedJobDisplay();
    }

    // Always show the selected job display if there's a selected job
    const selectedJobDisplay = renderSelectedJobDisplay();

    // If we have a selected job with subspecialties and no subspecialty selected yet, show subspecialty selection
    if (selectedJob && selectedJob.subspecialties && selectedJob.subspecialties.length > 0 && !formData.subspecialty) {
      return (
        <div>
          {selectedJobDisplay}
          {renderSubspecialties()}
        </div>
      );
    }

    // If we have a selected job without subspecialties, just show the selected job
    if (selectedJob) {
      return selectedJobDisplay;
    }

    // Otherwise, show job/category selection
    if (searchTerm && filteredCategories.length > 0) {
      return filteredCategories.map(item => 
        renderJobsByCategory(item.category, item.jobs)
      );
    }

    if (activeCategory) {
      return renderJobsByCategory(activeCategory, categorizedJobs(t)[activeCategory]);
    }

    if (showingAllCategories) {
      return (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-800">{t('auth.signup.workBackground.jobCategories')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(categorizedJobs(t)).map((category) => (
              <div
                key={category}
                onClick={() => handleCategoryClick(category)}
                className="cursor-pointer flex items-center justify-center p-4 rounded-lg border bg-white hover:bg-gray-100 transition"
              >
                <span className="text-sm font-medium">{category}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  // Academic Degree options for react-select
  const academicDegreeOptions = academicDegrees.map(degree => ({
    value: degree.value,
    label: (
      <span>
        <span className="mr-2">{degree.icon}</span>
        {degree.label}
      </span>
    ),
    rawLabel: degree.label,
    icon: degree.icon,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 relative">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-32 h-32 top-10 left-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute w-24 h-24 top-1/3 right-20 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute w-40 h-40 bottom-20 left-1/4 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute w-20 h-20 bottom-1/3 right-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '6s' }} />
      </div>

      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-yellow-500 mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('auth.signup.workBackground.title')}
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('auth.signup.tellUsAboutYourProfessionalExperience')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Retirement Status */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <Star className="text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                {t('auth.signup.areYouWorkingToday')}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'full', label: t('auth.signup.workBackground.retirementStatus.options.full'), icon: '🏖️' },
                { value: 'partially', label: t('auth.signup.workBackground.retirementStatus.options.partially'), icon: '🔄' },
                { value: 'not_retired', label: t('auth.signup.workBackground.retirementStatus.options.notRetired'), icon: '💼' }
              ].map((status) => (
                <SelectionCard
                  key={status.value}
                  isSelected={formData.retirementStatus === status.value}
                  onClick={() => handleRetirementStatusChange(status.value)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{status.icon}</div>
                    <div className="font-semibold text-gray-800">{status.label}</div>
                  </div>
                </SelectionCard>
              ))}
            </div>

            {/* Expected Retirement Question for Full and Partially Retired */}
            {(formData.retirementStatus === 'partially' || formData.retirementStatus === 'full') && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.signup.workBackground.expectToRetire') || 'Do you expect to fully retire?'}
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="expectToRetire"
                        value="yes"
                        checked={formData.expectToRetire === 'yes'}
                        onChange={(e) => setFormData({ ...formData, expectToRetire: e.target.value })}
                        className="mr-2 h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300"
                      />
                      <span className="text-gray-700">{t('common.yes') || 'Yes'}</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="expectToRetire"
                        value="no"
                        checked={formData.expectToRetire === 'no'}
                        onChange={(e) => setFormData({ ...formData, expectToRetire: e.target.value })}
                        className="mr-2 h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300"
                      />
                      <span className="text-gray-700">{t('common.no') || 'No'}</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="expectToRetire"
                        value="unknown"
                        checked={formData.expectToRetire === 'unknown'}
                        onChange={(e) => setFormData({ ...formData, expectToRetire: e.target.value })}
                        className="mr-2 h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300"
                      />
                      <span className="text-gray-700">{t('auth.signup.workBackground.dontKnow') || "Don't know"}</span>
                    </label>
                  </div>
                </div>
                
                {formData.expectToRetire === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.signup.workBackground.expectedRetirementDateLabel') || 'Expected retirement date'}
                    </label>
                    <input
                      type="date"
                      value={formData.expectedRetirementDate}
                      onChange={(e) => setFormData({ ...formData, expectedRetirementDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Retirement Date Field for Not Retired */}
            {formData.retirementStatus === 'not_retired' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.signup.workBackground.retirementDateLabel') || 'When did you retire?'}
                </label>
                <input
                  type="date"
                  value={formData.retirementDate}
                  onChange={(e) => setFormData({ ...formData, retirementDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  required
                />
              </div>
            )}
          </div>

          {/* Employment Type */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <Star className="text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                {t('auth.signup.workBackground.employmentType.label')}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'employee', label: t('auth.signup.workBackground.employmentType.options.employee'), icon: '👔' },
                { value: 'selfEmployed', label: t('auth.signup.workBackground.employmentType.options.selfEmployed'), icon: '💼' },
                { value: 'both', label: t('auth.signup.workBackground.employmentType.options.both'), icon: '🔄' }
              ].map((type) => (
                <SelectionCard
                  key={type.value}
                  isSelected={formData.employmentType === type.value}
                  onClick={() => setFormData({ ...formData, employmentType: type.value })}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className="font-semibold text-gray-800">{type.label}</div>
                  </div>
                </SelectionCard>
              ))}
            </div>
          </div>

          {/* Job Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <Star className="text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                {isSelectionComplete() ? t('auth.signup.workBackground.yourSelectedJob') : t('auth.signup.workBackground.selectYourJob')}
              </h2>
          </div>

            {/* Search bar - only show when no job is selected */}
            {!selectedJob && (
              <div className="mb-6">
                <input
                  type="text"
                  placeholder={t('auth.signup.searchForAJob')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
            )}

              {renderJobSelection()}
          </div>

          {/* Academic Degrees */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <Star className="text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                {t('auth.signup.workBackground.academicDegrees.label')}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {academicDegrees.map((degree) => (
                <SelectionCard
                  key={degree.value}
                  isSelected={formData.academicDegrees.includes(degree.value)}
                  onClick={() => handleArraySelection('academicDegrees', degree.value)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{degree.icon}</div>
                    <div className="font-semibold text-gray-800 text-sm">{degree.label}</div>
                  </div>
                </SelectionCard>
              ))}
              </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Star className="w-6 h-6" />
              <span>{t('common.continue')}</span>
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


export default WorkBackground;

