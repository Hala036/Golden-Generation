import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import jobsList from '../../data/jobs.json';
import interestsList from '../../data/interests.json';
import interestTranslations from '../../data/interestTranslations.json';
import { useLanguage } from '../../context/LanguageContext';

// Move this to the top, before the component function
const categorizedJobs = (t) => ({
  [t('auth.signup.workBackground.categories.healthcare')]: [
    { label: t('auth.signup.workBackground.jobs.Doctor'), subspecialties: [
      { label: t('auth.signup.workBackground.jobs.Cardiologist') },
      { label: t('auth.signup.workBackground.jobs.Dermatologist') },
      { label: t('auth.signup.workBackground.jobs.EmergencyPhysician') },
      { label: t('auth.signup.workBackground.jobs.FamilyPhysician') },
      { label: t('auth.signup.workBackground.jobs.Gastroenterologist') },
      { label: t('auth.signup.workBackground.jobs.Neurologist') },
      { label: t('auth.signup.workBackground.jobs.Obstetrician') },
      { label: t('auth.signup.workBackground.jobs.Oncologist') },
      { label: t('auth.signup.workBackground.jobs.Ophthalmologist') },
      { label: t('auth.signup.workBackground.jobs.OrthopedicSurgeon') },
      { label: t('auth.signup.workBackground.jobs.Pediatrician') },
      { label: t('auth.signup.workBackground.jobs.Psychiatrist') },
      { label: t('auth.signup.workBackground.jobs.Radiologist') },
      { label: t('auth.signup.workBackground.jobs.Surgeon') },
      { label: t('auth.signup.workBackground.jobs.Other') }
    ]},
    { label: t('auth.signup.workBackground.jobs.Nurse'), subspecialties: [
      { label: t('auth.signup.workBackground.jobs.RegisteredNurse') },
      { label: t('auth.signup.workBackground.jobs.NursePractitioner') },
      { label: t('auth.signup.workBackground.jobs.LicensedPracticalNurse') },
      { label: t('auth.signup.workBackground.jobs.ICUNurse') },
      { label: t('auth.signup.workBackground.jobs.ERNurse') },
      { label: t('auth.signup.workBackground.jobs.PediatricNurse') },
      { label: t('auth.signup.workBackground.jobs.Other') }
    ]},
    { label: t('auth.signup.workBackground.jobs.Dentist'), subspecialties: [
      { label: t('auth.signup.workBackground.jobs.GeneralDentist') },
      { label: t('auth.signup.workBackground.jobs.Orthodontist') },
      { label: t('auth.signup.workBackground.jobs.OralSurgeon') },
      { label: t('auth.signup.workBackground.jobs.Periodontist') },
      { label: t('auth.signup.workBackground.jobs.Other') }
    ]},
    { label: t('auth.signup.workBackground.jobs.Pharmacist'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.PhysicalTherapist'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Psychologist'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Paramedic'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherHealthcareProfessional'), subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.engineeringTechnology')]: [
    { label: t('auth.signup.workBackground.jobs.SoftwareEngineer'), subspecialties: [
      { label: t('auth.signup.workBackground.jobs.FrontendDeveloper') },
      { label: t('auth.signup.workBackground.jobs.BackendDeveloper') },
      { label: t('auth.signup.workBackground.jobs.FullStackDeveloper') },
      { label: t('auth.signup.workBackground.jobs.MobileDeveloper') },
      { label: t('auth.signup.workBackground.jobs.GameDeveloper') },
      { label: t('auth.signup.workBackground.jobs.DevOpsEngineer') },
      { label: t('auth.signup.workBackground.jobs.MachineLearningEngineer') },
      { label: t('auth.signup.workBackground.jobs.Other') }
    ]},
    { label: t('auth.signup.workBackground.jobs.CivilEngineer'), subspecialties: [
      { label: t('auth.signup.workBackground.jobs.StructuralEngineer') },
      { label: t('auth.signup.workBackground.jobs.TransportationEngineer') },
      { label: t('auth.signup.workBackground.jobs.EnvironmentalEngineer') },
      { label: t('auth.signup.workBackground.jobs.GeotechnicalEngineer') },
      { label: t('auth.signup.workBackground.jobs.Other') }
    ]},
    { label: t('auth.signup.workBackground.jobs.MechanicalEngineer'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ElectricalEngineer'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ChemicalEngineer'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.BiomedicalEngineer'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.DataScientist'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ITSpecialist'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherEngineeringTechProfessional'), subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.businessFinance')]: [
    { label: t('auth.signup.workBackground.jobs.Accountant'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.FinancialAnalyst'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.InvestmentBanker'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.MarketingManager'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.HumanResources'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.BusinessAnalyst'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ProjectManager'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Salesperson'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.RealEstateAgent'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Entrepreneur'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherBusinessProfessional'), subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.education')]: [
    { label: t('auth.signup.workBackground.jobs.Teacher'), subspecialties: [
      { label: t('auth.signup.workBackground.jobs.ElementaryTeacher') },
      { label: t('auth.signup.workBackground.jobs.MiddleSchoolTeacher') },
      { label: t('auth.signup.workBackground.jobs.HighSchoolTeacher') },
      { label: t('auth.signup.workBackground.jobs.SpecialEducationTeacher') },
      { label: t('auth.signup.workBackground.jobs.ESLTeacher') },
      { label: t('auth.signup.workBackground.jobs.Other') }
    ]},
    { label: t('auth.signup.workBackground.jobs.Professor'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.SchoolAdministrator'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.SchoolCounselor'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Librarian'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherEducationProfessional'), subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.legal')]: [
    { label: t('auth.signup.workBackground.jobs.Lawyer'), subspecialties: [
      { label: t('auth.signup.workBackground.jobs.CorporateLawyer') },
      { label: t('auth.signup.workBackground.jobs.CriminalLawyer') },
      { label: t('auth.signup.workBackground.jobs.FamilyLawyer') },
      { label: t('auth.signup.workBackground.jobs.IntellectualPropertyLawyer') },
      { label: t('auth.signup.workBackground.jobs.Other') }
    ]},
    { label: t('auth.signup.workBackground.jobs.Judge'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Paralegal'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.LegalSecretary'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherLegalProfessional'), subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.artsMedia')]: [
    { label: t('auth.signup.workBackground.jobs.Artist'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Musician'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Actor'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Writer'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Journalist'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Photographer'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.GraphicDesigner'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.UXUIDesigner'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.FilmVideoProducer'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherCreativeProfessional'), subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.serviceIndustry')]: [
    { label: t('auth.signup.workBackground.jobs.ChefCook'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ServerWaiter'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Bartender'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Barista'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.HotelStaff'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.FlightAttendant'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.TourGuide'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.RetailWorker'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Cashier'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherServiceProfessional'), subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.tradesManualLabor')]: [
    { label: t('auth.signup.workBackground.jobs.Electrician'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Plumber'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Carpenter'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ConstructionWorker'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Mechanic'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Welder'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Driver'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Farmer'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Landscaper'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Cleaner'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OtherTradeProfessional'), subspecialties: [] }
  ],
  [t('auth.signup.workBackground.categories.otherProfessions')]: [
    { label: t('auth.signup.workBackground.jobs.MilitaryPersonnel'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.PoliceOfficer'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Firefighter'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Scientist'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.SocialWorker'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.OfficeAdministrator'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.GovernmentEmployee'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Homemaker'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.ReligiousWorker'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Volunteer'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Retired'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Student'), subspecialties: [] },
    { label: t('auth.signup.workBackground.jobs.Other'), subspecialties: [] }
  ]
});

const VoluntaryRequestForm = ({ editMode, initialData, settlements, onSubmit, onCancel, loading, t }) => {
  const { language } = useLanguage ? useLanguage() : { language: 'en' };
  const jobsByCategory = categorizedJobs(t);
  const jobCategories = Object.keys(jobsByCategory);

  // Volunteer days, hours, frequency, areas (should match sign up)
  const dayOptions = [
    { value: 'sunday', label: t('auth.veteransCommunity.sun', 'Sun') },
    { value: 'monday', label: t('auth.veteransCommunity.mon', 'Mon') },
    { value: 'tuesday', label: t('auth.veteransCommunity.tue', 'Tue') },
    { value: 'wednesday', label: t('auth.veteransCommunity.wed', 'Wed') },
    { value: 'thursday', label: t('auth.veteransCommunity.thu', 'Thu') },
    { value: 'friday', label: t('auth.veteransCommunity.fri', 'Fri') }
  ];
  const timeOptions = [
    { value: t('auth.veteransCommunity.morning', 'Morning'), label: t('auth.veteransCommunity.morning', 'Morning') },
    { value: t('auth.veteransCommunity.noon', 'Noon'), label: t('auth.veteransCommunity.noon', 'Noon') },
    { value: t('auth.veteransCommunity.evening', 'Evening'), label: t('auth.veteransCommunity.evening', 'Evening') }
  ];
  const frequencyOptions = [
    { value: t('auth.veteransCommunity.onceMonth', 'Once a month'), label: t('auth.veteransCommunity.onceMonth', 'Once a month') },
    { value: t('auth.veteransCommunity.onceTwoWeeks', 'Once every two weeks'), label: t('auth.veteransCommunity.onceTwoWeeks', 'Once every two weeks') },
    { value: t('auth.veteransCommunity.onceWeek', 'Once a week'), label: t('auth.veteransCommunity.onceWeek', 'Once a week') },
    { value: t('auth.veteransCommunity.twiceWeek', 'Twice a week'), label: t('auth.veteransCommunity.twiceWeek', 'Twice a week') }
  ];
  const volunteerAreaOptions = [
    { value: 'publicity', label: t('auth.veteransCommunity.publicity', 'Publicity') },
    { value: 'health', label: t('auth.veteransCommunity.health', 'Health') },
    { value: 'eater', label: t('auth.veteransCommunity.eater', 'Food Service') },
    { value: 'teaching', label: t('auth.veteransCommunity.teaching', 'Teaching') },
    { value: 'high-tech', label: t('auth.veteransCommunity.highTech', 'High-Tech') },
    { value: 'tourism', label: t('auth.veteransCommunity.tourism', 'Tourism') },
    { value: 'safety', label: t('auth.veteransCommunity.safety', 'Safety') },
    { value: 'funds', label: t('auth.veteransCommunity.funds', 'Funds') },
    { value: 'special-treat', label: t('auth.veteransCommunity.specialTreat', 'Special Treat') },
    { value: 'craftsmanship', label: t('auth.veteransCommunity.craftsmanship', 'Craftsmanship') },
    { value: 'aaliyah', label: t('auth.veteransCommunity.aaliyah', 'Aliyah Support') },
    { value: 'culture', label: t('auth.veteransCommunity.culture', 'Culture') }
  ];

  // Move this inside the component!
  const academicDegrees = [
    { value: 'high_school', label: t('auth.signup.workBackground.academicDegrees.highSchool', 'High School') },
    { value: 'associate', label: t('auth.signup.workBackground.academicDegrees.associateDegree', 'Associate Degree') },
    { value: 'bachelor', label: t('auth.signup.workBackground.academicDegrees.bachelorsDegree', "Bachelor's Degree") },
    { value: 'master', label: t('auth.signup.workBackground.academicDegrees.mastersDegree', 'Master\'s Degree') },
    { value: 'phd', label: t('auth.signup.workBackground.academicDegrees.phd', 'PhD') },
    { value: 'postdoc', label: t('auth.signup.workBackground.academicDegrees.postDoc', 'Postdoc') },
    { value: 'professional', label: t('auth.signup.workBackground.academicDegrees.professionalCert', 'Professional Certificate') },
    { value: 'vocational', label: t('auth.signup.workBackground.academicDegrees.vocationalTraining', 'Vocational Training') },
    { value: 'none', label: t('auth.signup.workBackground.academicDegrees.noFormalEducation', 'No Formal Education') },
    { value: 'other', label: t('auth.signup.workBackground.academicDegrees.other', 'Other') }
  ];

  // Form state
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    location: '',
    jobCategory: '',
    jobTitle: '',
    jobSubspecialty: '',
    customJob: '',
    interests: [],
    volunteerDays: [],
    volunteerHours: [],
    volunteerFrequency: [],
    volunteerAreas: [],
    academicDegrees: [],
  });

  // Ensure all array fields are always arrays
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      interests: Array.isArray(prev.interests) ? prev.interests : [],
      volunteerDays: Array.isArray(prev.volunteerDays) ? prev.volunteerDays : [],
      volunteerHours: Array.isArray(prev.volunteerHours) ? prev.volunteerHours : [],
      volunteerFrequency: Array.isArray(prev.volunteerFrequency) ? prev.volunteerFrequency : [],
      volunteerAreas: Array.isArray(prev.volunteerAreas) ? prev.volunteerAreas : [],
      academicDegrees: Array.isArray(prev.academicDegrees) ? prev.academicDegrees : [],
    }));
  }, [initialData]);

  // Job selection handlers
  const handleCategoryChange = (opt) => {
    setFormData(prev => ({
      ...prev,
      jobCategory: opt ? opt.value : '',
      jobTitle: '',
      jobSubspecialty: '',
      customJob: ''
    }));
  };
  const handleJobChange = (opt) => {
    setFormData(prev => ({
      ...prev,
      jobTitle: opt ? opt.value : '',
      jobSubspecialty: '',
      customJob: ''
    }));
  };
  const handleSubspecialtyChange = (opt) => {
    setFormData(prev => ({
      ...prev,
      jobSubspecialty: opt ? opt.value : '',
      customJob: ''
    }));
  };

  // Handle select changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-[95vw] max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-4">
        {editMode ? t('admin.jobs.editRequest') : t('admin.jobs.createRequest')}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.jobs.fields.title')}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              className="w-full p-2 border rounded"
              placeholder={t('admin.jobs.placeholders.title')}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.jobs.fields.location')}
            </label>
            <Select
              name="location"
              options={settlements.map(s => ({ value: s.name, label: s.name }))}
              value={formData.location ? { value: formData.location, label: formData.location } : null}
              onChange={opt => handleChange('location', opt ? opt.value : '')}
              placeholder={t('admin.jobs.placeholders.location')}
              classNamePrefix="react-select"
              isSearchable
            />
          </div>
          {/* Job/Professional Background (category → job → subspecialty) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.jobs.fields.professionalBackground', 'רקע מקצועי (אופציונלי)')}
            </label>
            <div className="flex flex-col md:flex-row gap-2">
              <Select
                name="jobCategory"
                options={jobCategories.map(c => ({ value: c, label: c }))}
                value={formData.jobCategory ? { value: formData.jobCategory, label: formData.jobCategory } : null}
                onChange={handleCategoryChange}
                placeholder={t('auth.signup.workBackground.title', 'Select category')}
                classNamePrefix="react-select"
                isSearchable
              />
              {formData.jobCategory && (
                <Select
                  name="jobTitle"
                  options={jobsByCategory[formData.jobCategory].map(j => ({ value: j.label, label: j.label }))}
                  value={formData.jobTitle ? { value: formData.jobTitle, label: formData.jobTitle } : null}
                  onChange={handleJobChange}
                  placeholder={t('auth.signup.workBackground.jobs.select', 'Select job')}
                  classNamePrefix="react-select"
                  isSearchable
                />
              )}
              {formData.jobCategory && formData.jobTitle && jobsByCategory[formData.jobCategory].find(j => j.label === formData.jobTitle)?.subspecialties?.length > 0 && (
                <Select
                  name="jobSubspecialty"
                  options={jobsByCategory[formData.jobCategory].find(j => j.label === formData.jobTitle).subspecialties.map(s => ({ value: s.label, label: s.label }))}
                  value={formData.jobSubspecialty ? { value: formData.jobSubspecialty, label: formData.jobSubspecialty } : null}
                  onChange={handleSubspecialtyChange}
                  placeholder={t('auth.signup.workBackground.jobs.selectSubspecialty', 'Select subspecialty')}
                  classNamePrefix="react-select"
                  isSearchable
                />
              )}
              {(formData.jobTitle === t('auth.signup.workBackground.jobs.Other') || formData.jobSubspecialty === t('auth.signup.workBackground.jobs.Other')) && (
                <input
                  type="text"
                  name="customJob"
                  value={formData.customJob}
                  onChange={e => handleChange('customJob', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder={t('admin.jobs.placeholders.professionalBackground')}
                />
              )}
            </div>
          </div>
          {/* Interests */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.veteransCommunity.areasOfInterest', 'תחומי עניין')}
            </label>
            <Select
              isMulti
              name="interests"
              options={interestsList.map(i => ({ value: i, label: t(`auth.lifestyle.${i}`, i) }))}
              value={(Array.isArray(formData.interests) ? formData.interests : []).map(i => ({ value: i, label: t(`auth.lifestyle.${i}`, i) }))}
              onChange={opts => handleChange('interests', opts ? opts.map(o => o.value) : [])}
              placeholder={t('auth.lifestyle.interestsLabel', 'בחר תחומי עניין')}
              classNamePrefix="react-select"
            />
          </div>
          {/* Volunteer Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.veteransCommunity.availableDays', 'Available Days')}
            </label>
            <Select
              isMulti
              name="volunteerDays"
              options={dayOptions}
              value={(Array.isArray(formData.volunteerDays) ? formData.volunteerDays : []).map(i => dayOptions.find(d => d.value === i))}
              onChange={opts => handleChange('volunteerDays', opts ? opts.map(o => o.value) : [])}
              placeholder={t('auth.veteransCommunity.availableDays', 'Select days')}
              classNamePrefix="react-select"
            />
          </div>
          {/* Volunteer Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.veteransCommunity.preferredHours', 'Preferred Hours')}
            </label>
            <Select
              isMulti
              name="volunteerHours"
              options={timeOptions}
              value={(Array.isArray(formData.volunteerHours) ? formData.volunteerHours : []).map(i => timeOptions.find(t => t.value === i))}
              onChange={opts => handleChange('volunteerHours', opts ? opts.map(o => o.value) : [])}
              placeholder={t('auth.veteransCommunity.preferredHours', 'Select hours')}
              classNamePrefix="react-select"
            />
          </div>
          {/* Volunteer Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.veteransCommunity.frequency', 'Frequency')}
            </label>
            <Select
              isMulti
              name="volunteerFrequency"
              options={frequencyOptions}
              value={(Array.isArray(formData.volunteerFrequency) ? formData.volunteerFrequency : []).map(i => frequencyOptions.find(f => f.value === i))}
              onChange={opts => handleChange('volunteerFrequency', opts ? opts.map(o => o.value) : [])}
              placeholder={t('auth.veteransCommunity.frequency', 'Select frequency')}
              classNamePrefix="react-select"
            />
          </div>
          {/* Volunteer Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.veteransCommunity.volunteerAreas', 'Volunteer Areas')}
            </label>
            <Select
              isMulti
              name="volunteerAreas"
              options={volunteerAreaOptions}
              value={(Array.isArray(formData.volunteerAreas) ? formData.volunteerAreas : []).map(i => volunteerAreaOptions.find(a => a.value === i))}
              onChange={opts => handleChange('volunteerAreas', opts ? opts.map(o => o.value) : [])}
              placeholder={t('auth.veteransCommunity.volunteerAreas', 'Select areas')}
              classNamePrefix="react-select"
            />
          </div>
          {/* Academic Degrees (optional) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.signup.workBackground.academicDegrees.label', 'Academic Degrees')}
            </label>
            <Select
              isMulti
              name="academicDegrees"
              options={academicDegrees}
              value={(Array.isArray(formData.academicDegrees) ? formData.academicDegrees : []).map(i => academicDegrees.find(a => a.value === i))}
              onChange={opts => handleChange('academicDegrees', opts ? opts.map(o => o.value) : [])}
              placeholder={t('auth.signup.workBackground.academicDegrees.label', 'Select degrees')}
              classNamePrefix="react-select"
            />
          </div>
          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.jobs.fields.description')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full p-2 border rounded"
              rows="3"
              placeholder={t('admin.jobs.placeholders.description')}
              required
            ></textarea>
          </div>
        </div>
        <div className="space-x-4 flex justify-end mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            {t('admin.jobs.cancel')}
          </button>
          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? t('admin.jobs.saving') : editMode ? t('admin.jobs.updateRequest') : t('admin.jobs.createRequest')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VoluntaryRequestForm; 