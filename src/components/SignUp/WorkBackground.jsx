import React, { useState, useEffect } from 'react';
import useSignupStore from '../../store/signupStore';

// Academic degrees list
const academicDegrees = [
  { value: "high_school", label: "High School / Secondary Education", icon: "🏫" },
  { value: "associate", label: "Associate Degree", icon: "🎓" },
  { value: "bachelor", label: "Bachelor's Degree", icon: "📚" },
  { value: "master", label: "Master's Degree", icon: "📝" },
  { value: "phd", label: "PhD / Doctorate", icon: "🧪" },
  { value: "postdoc", label: "Post-Doctoral", icon: "🔬" },
  { value: "professional", label: "Professional Certification", icon: "📜" },
  { value: "vocational", label: "Vocational Training", icon: "🛠️" },
  { value: "none", label: "No Formal Education", icon: "🚫" },
  { value: "other", label: "Other", icon: "❓" }
];

// Comprehensive job categories with sub-specialties
const categorizedJobs = {
  "Healthcare": [
    { label: "Doctor", icon: "🩺", subspecialties: [
      { label: "Cardiologist", icon: "❤️" },
      { label: "Dermatologist", icon: "🧬" },
      { label: "Emergency Physician", icon: "🚑" },
      { label: "Family Physician", icon: "👨‍👩‍👧‍👦" },
      { label: "Gastroenterologist", icon: "🔥" },
      { label: "Neurologist", icon: "🧠" },
      { label: "Obstetrician", icon: "🤰" },
      { label: "Oncologist", icon: "🦠" },
      { label: "Ophthalmologist", icon: "👁️" },
      { label: "Orthopedic Surgeon", icon: "🦴" },
      { label: "Pediatrician", icon: "👶" },
      { label: "Psychiatrist", icon: "🧠" },
      { label: "Radiologist", icon: "📡" },
      { label: "Surgeon", icon: "🔪" },
      { label: "Other", icon: "❓" }
    ]},
    { label: "Nurse", icon: "👩‍⚕️", subspecialties: [
      { label: "Registered Nurse", icon: "💉" },
      { label: "Nurse Practitioner", icon: "📋" },
      { label: "Licensed Practical Nurse", icon: "🏥" },
      { label: "ICU Nurse", icon: "💓" },
      { label: "ER Nurse", icon: "🚨" },
      { label: "Pediatric Nurse", icon: "👶" },
      { label: "Other", icon: "❓" }
    ]},
    { label: "Dentist", icon: "🦷", subspecialties: [
      { label: "General Dentist", icon: "😁" },
      { label: "Orthodontist", icon: "🦷" },
      { label: "Oral Surgeon", icon: "🔧" },
      { label: "Periodontist", icon: "🦠" },
      { label: "Other", icon: "❓" }
    ]},
    { label: "Pharmacist", icon: "💊", subspecialties: [] },
    { label: "Physical Therapist", icon: "🦵", subspecialties: [] },
    { label: "Psychologist", icon: "🧠", subspecialties: [] },
    { label: "Paramedic", icon: "🚑", subspecialties: [] },
    { label: "Other Healthcare Professional", icon: "❓", subspecialties: [] }
  ],
  "Engineering & Technology": [
    { label: "Software Engineer", icon: "💻", subspecialties: [
      { label: "Frontend Developer", icon: "🖥️" },
      { label: "Backend Developer", icon: "🔧" },
      { label: "Full Stack Developer", icon: "🔄" },
      { label: "Mobile Developer", icon: "📱" },
      { label: "Game Developer", icon: "🎮" },
      { label: "DevOps Engineer", icon: "☁️" },
      { label: "Machine Learning Engineer", icon: "🤖" },
      { label: "Other", icon: "❓" }
    ]},
    { label: "Civil Engineer", icon: "🏗️", subspecialties: [
      { label: "Structural Engineer", icon: "🏢" },
      { label: "Transportation Engineer", icon: "🚗" },
      { label: "Environmental Engineer", icon: "🌳" },
      { label: "Geotechnical Engineer", icon: "🏔️" },
      { label: "Other", icon: "❓" }
    ]},
    { label: "Mechanical Engineer", icon: "⚙️", subspecialties: [] },
    { label: "Electrical Engineer", icon: "⚡", subspecialties: [] },
    { label: "Chemical Engineer", icon: "🧪", subspecialties: [] },
    { label: "Biomedical Engineer", icon: "🔬", subspecialties: [] },
    { label: "Data Scientist", icon: "📊", subspecialties: [] },
    { label: "IT Specialist", icon: "🖥️", subspecialties: [] },
    { label: "Other Engineering/Tech Professional", icon: "❓", subspecialties: [] }
  ],
  "Business & Finance": [
    { label: "Accountant", icon: "🧮", subspecialties: [] },
    { label: "Financial Analyst", icon: "📈", subspecialties: [] },
    { label: "Investment Banker", icon: "💰", subspecialties: [] },
    { label: "Marketing Manager", icon: "📣", subspecialties: [] },
    { label: "Human Resources", icon: "👥", subspecialties: [] },
    { label: "Business Analyst", icon: "📋", subspecialties: [] },
    { label: "Project Manager", icon: "📊", subspecialties: [] },
    { label: "Salesperson", icon: "💼", subspecialties: [] },
    { label: "Real Estate Agent", icon: "🏠", subspecialties: [] },
    { label: "Entrepreneur", icon: "🚀", subspecialties: [] },
    { label: "Other Business Professional", icon: "❓", subspecialties: [] }
  ],
  "Education": [
    { label: "Teacher", icon: "👩‍🏫", subspecialties: [
      { label: "Elementary Teacher", icon: "🧒" },
      { label: "Middle School Teacher", icon: "📚" },
      { label: "High School Teacher", icon: "🎓" },
      { label: "Special Education Teacher", icon: "❤️" },
      { label: "ESL Teacher", icon: "🌎" },
      { label: "Other", icon: "❓" }
    ]},
    { label: "Professor", icon: "👨‍🏫", subspecialties: [] },
    { label: "School Administrator", icon: "🏫", subspecialties: [] },
    { label: "School Counselor", icon: "🧠", subspecialties: [] },
    { label: "Librarian", icon: "📚", subspecialties: [] },
    { label: "Other Education Professional", icon: "❓", subspecialties: [] }
  ],
  "Legal": [
    { label: "Lawyer", icon: "⚖️", subspecialties: [
      { label: "Corporate Lawyer", icon: "🏢" },
      { label: "Criminal Lawyer", icon: "🔒" },
      { label: "Family Lawyer", icon: "👨‍👩‍👧‍👦" },
      { label: "Intellectual Property Lawyer", icon: "©️" },
      { label: "Other", icon: "❓" }
    ]},
    { label: "Judge", icon: "🧑‍⚖️", subspecialties: [] },
    { label: "Paralegal", icon: "📑", subspecialties: [] },
    { label: "Legal Secretary", icon: "⌨️", subspecialties: [] },
    { label: "Other Legal Professional", icon: "❓", subspecialties: [] }
  ],
  "Arts & Media": [
    { label: "Artist", icon: "🎨", subspecialties: [] },
    { label: "Musician", icon: "🎵", subspecialties: [] },
    { label: "Actor", icon: "🎭", subspecialties: [] },
    { label: "Writer", icon: "✍️", subspecialties: [] },
    { label: "Journalist", icon: "📰", subspecialties: [] },
    { label: "Photographer", icon: "📷", subspecialties: [] },
    { label: "Graphic Designer", icon: "🖌️", subspecialties: [] },
    { label: "UX/UI Designer", icon: "📱", subspecialties: [] },
    { label: "Film/Video Producer", icon: "🎬", subspecialties: [] },
    { label: "Other Creative Professional", icon: "❓", subspecialties: [] }
  ],
  "Service Industry": [
    { label: "Chef/Cook", icon: "👨‍🍳", subspecialties: [] },
    { label: "Server/Waiter", icon: "🍽️", subspecialties: [] },
    { label: "Bartender", icon: "🍸", subspecialties: [] },
    { label: "Barista", icon: "☕", subspecialties: [] },
    { label: "Hotel Staff", icon: "🏨", subspecialties: [] },
    { label: "Flight Attendant", icon: "✈️", subspecialties: [] },
    { label: "Tour Guide", icon: "🧳", subspecialties: [] },
    { label: "Retail Worker", icon: "🛍️", subspecialties: [] },
    { label: "Cashier", icon: "💰", subspecialties: [] },
    { label: "Other Service Professional", icon: "❓", subspecialties: [] }
  ],
  "Trades & Manual Labor": [
    { label: "Electrician", icon: "💡", subspecialties: [] },
    { label: "Plumber", icon: "🚰", subspecialties: [] },
    { label: "Carpenter", icon: "🪚", subspecialties: [] },
    { label: "Construction Worker", icon: "🏗️", subspecialties: [] },
    { label: "Mechanic", icon: "🔧", subspecialties: [] },
    { label: "Welder", icon: "🔥", subspecialties: [] },
    { label: "Driver", icon: "🚗", subspecialties: [] },
    { label: "Farmer", icon: "🌾", subspecialties: [] },
    { label: "Landscaper", icon: "🌳", subspecialties: [] },
    { label: "Cleaner", icon: "🧹", subspecialties: [] },
    { label: "Other Trade Professional", icon: "❓", subspecialties: [] }
  ],
  "Other Professions": [
    { label: "Military Personnel", icon: "🪖", subspecialties: [] },
    { label: "Police Officer", icon: "👮", subspecialties: [] },
    { label: "Firefighter", icon: "🧑‍🚒", subspecialties: [] },
    { label: "Scientist", icon: "🔬", subspecialties: [] },
    { label: "Social Worker", icon: "🤝", subspecialties: [] },
    { label: "Office Administrator", icon: "🗂️", subspecialties: [] },
    { label: "Government Employee", icon: "🏛️", subspecialties: [] },
    { label: "Homemaker", icon: "🏡", subspecialties: [] },
    { label: "Religious Worker", icon: "🙏", subspecialties: [] },
    { label: "Volunteer", icon: "🙌", subspecialties: [] },
    { label: "Retired", icon: "🏖️", subspecialties: [] },
    { label: "Student", icon: "📚", subspecialties: [] },
    { label: "Other", icon: "❓", subspecialties: [] }
  ]
};

// Flatten job categories for search functionality
const createFlatJobList = () => {
  const flatList = [];
  Object.entries(categorizedJobs).forEach(([category, jobs]) => {
    jobs.forEach(job => {
      flatList.push({
        ...job,
        category
      });
    });
  });
  return flatList;
};

const WorkBackground = ({ onComplete }) => {
  const { workData, setWorkData } = useSignupStore();
  const [formData, setFormData] = useState(workData || {
    retirementStatus: '',
    employmentDate: '',
    employmentType: '',
    currentlyWorking: false,
    dischargeDate: '',
    jobs: [{
      category: '',
      jobTitle: '',
      subspecialty: '',
      otherJob: '',
      academicDegree: '',
      otherAcademicDegree: '',
    }]
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [showingAllCategories, setShowingAllCategories] = useState(true);
  const [flatJobList] = useState(createFlatJobList());
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([null]);

  useEffect(() => {
    if (searchTerm) {
      // Filter categories based on search term
      const filtered = Object.entries(categorizedJobs)
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
    // Set the selected job based on formData
    if (formData.jobTitle) {
      const job = flatJobList.find(j => j.label === formData.jobTitle);
      if (job) {
        const newSelectedJobs = [...selectedJobs];
        newSelectedJobs[0] = job;
        setSelectedJobs(newSelectedJobs);
        setActiveCategory(job.category);
        setShowingAllCategories(false);
      }
    }
  }, [formData.jobTitle, flatJobList]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clean the form data by removing undefined values or converting them to null
    const cleanFormData = {
      ...formData,
      jobs: formData.jobs.map(job => {
        const cleanJob = Object.entries(job).reduce((acc, [key, value]) => {
          if (value === undefined) return acc;
          acc[key] = value === '' ? null : value;
          return acc;
        }, {});

        return {
          ...cleanJob,
          customJobInfo: {
            isCustomJob: cleanJob.jobTitle === 'Other' || cleanJob.subspecialty === 'Other',
            customJobTitle: cleanJob.otherJob || null,
            originalSelection: {
              category: cleanJob.category || null,
              jobTitle: cleanJob.jobTitle || null,
              subspecialty: cleanJob.subspecialty || null
            }
          },
          customAcademicInfo: {
            isCustomDegree: cleanJob.academicDegree === 'other',
            customDegreeTitle: cleanJob.otherAcademicDegree || null,
          }
        };
      })
    };
      
    setWorkData(cleanFormData);
    onComplete();
  };

  const addNewJob = () => {
    setFormData({
      ...formData,
      jobs: [...formData.jobs, {
        category: '',
        jobTitle: '',
        subspecialty: '',
        otherJob: '',
        academicDegree: '',
        otherAcademicDegree: '',
      }]
    });
    setSelectedJobs([...selectedJobs, null]);
  };

  const handleCategoryClick = (category, jobIndex) => {
    setActiveCategory(category);
    setShowingAllCategories(false);
  };

  const handleJobSelect = (job, category, jobIndex) => {
    const newSelectedJobs = [...selectedJobs];
    newSelectedJobs[jobIndex] = job;
    setSelectedJobs(newSelectedJobs);

    const newJobs = [...formData.jobs];
    newJobs[jobIndex] = {
      ...newJobs[jobIndex],
      category,
      jobTitle: job.label,
      subspecialty: '',
      otherJob: job.label === 'Other' ? '' : undefined
    };
    setFormData({ ...formData, jobs: newJobs });
    setSearchTerm(''); // Clear search term when job is selected
  };

  const handleSubspecialtySelect = (subspecialty, jobIndex) => {
    const newJobs = [...formData.jobs];
    newJobs[jobIndex] = {
      ...newJobs[jobIndex],
      subspecialty: subspecialty.label,
      otherJob: subspecialty.label === 'Other' ? '' : undefined
    };
    setFormData({ ...formData, jobs: newJobs });
  };

  const handleBackToCategories = () => {
    setShowingAllCategories(true);
    setActiveCategory('');
  };

  const handleBackToJobs = (jobIndex) => {
    const newSelectedJobs = [...selectedJobs];
    newSelectedJobs[jobIndex] = null;
    setSelectedJobs(newSelectedJobs);

    const newJobs = [...formData.jobs];
    newJobs[jobIndex] = {
      ...newJobs[jobIndex],
      jobTitle: '',
      subspecialty: '',
      otherJob: ''
    };
    setFormData({ ...formData, jobs: newJobs });
  };
  
  const handleChangeJob = (jobIndex) => {
    const newSelectedJobs = [...selectedJobs];
    newSelectedJobs[jobIndex] = null;
    setSelectedJobs(newSelectedJobs);
    setShowingAllCategories(true);
    setActiveCategory('');

    const newJobs = [...formData.jobs];
    newJobs[jobIndex] = {
      ...newJobs[jobIndex],
      category: '',
      jobTitle: '',
      subspecialty: '',
      otherJob: ''
    };
    setFormData({ ...formData, jobs: newJobs });
  };

  const renderSubspecialties = () => {
    if (!selectedJobs[0] || !selectedJobs[0].subspecialties || selectedJobs[0].subspecialties.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium text-gray-800">Sub-specialties for {selectedJobs[0].label}</h4>
          <button 
            type="button" 
            onClick={() => handleBackToJobs(0)}
            className="text-sm bg-gray-100 px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-200 flex items-center"
          >
            <span className="mr-1">←</span> Change Job
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {selectedJobs[0].subspecialties.map((sub) => (
            <div
              key={sub.label}
              onClick={() => handleSubspecialtySelect(sub, 0)}
              className={`cursor-pointer flex items-center justify-center p-4 rounded-lg border ${formData.jobs[0].subspecialty === sub.label ? 'bg-yellow-300' : 'bg-white'} hover:bg-yellow-100 transition`}
            >
              <span className="text-xl mr-2">{sub.icon}</span>
              <span className="text-sm font-medium">{sub.label}</span>
            </div>
          ))}
        </div>
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
              onClick={() => handleBackToCategories()}
              className="text-sm bg-gray-100 px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-200 flex items-center"
            >
              <span className="mr-1">←</span> All Categories
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.label}
              onClick={() => handleJobSelect(job, category, 0)}
              className={`cursor-pointer flex items-center justify-center p-4 rounded-lg border ${formData.jobs[0].jobTitle === job.label ? 'bg-yellow-300' : 'bg-white'} hover:bg-yellow-100 transition`}
            >
              <span className="text-xl mr-2">{job.icon}</span>
              <span className="text-sm font-medium">{job.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderJobSection = (jobIndex) => {
    const job = formData.jobs[jobIndex];
    const selectedJob = selectedJobs[jobIndex];
    const isFirstJob = jobIndex === 0;

    return (
      <div key={jobIndex} className="border-2 border-green-500 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {isFirstJob ? 'Select Your Job' : `Select Your ${jobIndex === 1 ? 'Second' : jobIndex === 2 ? 'Third' : `${jobIndex + 1}th`} Job`}
        </h3>

        {/* Display selected job in a highlighted box */}
        {selectedJob && (
          <div className="mb-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-yellow-300">
              <div className="flex items-center">
                <span className="text-xl mr-2">{selectedJob.icon}</span>
                <div>
                  <span className="font-medium">{job.jobTitle}</span>
                  {job.subspecialty && (
                    <p className="text-sm text-gray-700">
                      Subspecialty: {job.subspecialty === 'Other' ? job.otherJob : job.subspecialty}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChangeJob(jobIndex)}
                className="text-sm bg-white px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Change Selection
              </button>
            </div>
          </div>
        )}
        
        {/* Only show search bar if no job is selected */}
        {!selectedJob && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a job..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-md p-2 pl-10"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="mt-4">
          {renderSubspecialties()}
        </div>

        {/* Other Job Input */}
        {((job.jobTitle === 'Other') || (job.subspecialty === 'Other')) && (
          <div className="space-y-2 mt-4">
            <label className="block text-sm font-medium text-gray-700">Please specify your job</label>
            <input
              type="text"
              value={job.otherJob || ''}
              onChange={(e) => {
                const newJobs = [...formData.jobs];
                newJobs[jobIndex] = { ...newJobs[jobIndex], otherJob: e.target.value };
                setFormData({ ...formData, jobs: newJobs });
              }}
              className="w-full border rounded-md p-2"
              placeholder="Enter your job title"
              required
            />
          </div>
        )}

        {/* Academic Degrees */}
        <div className="space-y-4 mt-6">
          <label className="block text-sm font-medium text-gray-700">Academic Degree</label>
          <div className="relative">
            <select
              value={job.academicDegree}
              onChange={(e) => {
                const newJobs = [...formData.jobs];
                newJobs[jobIndex] = {
                  ...newJobs[jobIndex],
                  academicDegree: e.target.value,
                  otherAcademicDegree: e.target.value === 'other' ? '' : newJobs[jobIndex].otherAcademicDegree
                };
                setFormData({ ...formData, jobs: newJobs });
              }}
              className="w-full border rounded-md p-2 pr-10 appearance-none bg-white"
              required
            >
              <option value="" disabled>Select your highest academic degree</option>
              {academicDegrees.map((degree) => (
                <option key={degree.value} value={degree.value}>
                  {degree.icon} {degree.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          
          {job.academicDegree === 'other' && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">Please specify your degree</label>
              <input
                type="text"
                value={job.otherAcademicDegree || ''}
                onChange={(e) => {
                  const newJobs = [...formData.jobs];
                  newJobs[jobIndex] = { ...newJobs[jobIndex], otherAcademicDegree: e.target.value };
                  setFormData({ ...formData, jobs: newJobs });
                }}
                className="w-full border rounded-md p-2 mt-1"
                placeholder="Enter your academic degree"
                required
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderJobSelection = (jobIndex) => {
    if (selectedJobs[jobIndex]) {
      return renderSubspecialties();
    }

    if (searchTerm && filteredCategories.length > 0) {
      return filteredCategories.map(item => 
        renderJobsByCategory(item.category, item.jobs)
      );
    }

    if (activeCategory) {
      return renderJobsByCategory(activeCategory, categorizedJobs[activeCategory]);
    }

    if (showingAllCategories) {
      return (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-800">Job Categories</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(categorizedJobs).map((category) => (
              <div
                key={category}
                onClick={() => handleCategoryClick(category, jobIndex)}
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Work Background</h3>
        <p className="mt-1 text-sm text-gray-600">Tell us about your professional experience</p>
      </div>

      {/* Retirement Status */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Retirement Status</label>
        <div className="flex gap-4">
          {['I didn\'t retire', 'Partially retired', 'Fully retired'].map((status) => (
            <label key={status} className="flex items-center">
              <input
                type="radio"
                name="retirementStatus"
                value={status}
                checked={formData.retirementStatus === status}
                onChange={(e) => setFormData({ ...formData, retirementStatus: e.target.value })}
                className="mr-2"
              />
              <span className="text-sm">{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Employment Status */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Are you working today?</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.currentlyWorking}
              onChange={(e) => setFormData({ ...formData, currentlyWorking: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Yes</span>
          </label>
          {formData.currentlyWorking && (
            <input
              type="date"
              value={formData.dischargeDate}
              onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
              className="border rounded-md p-2 text-sm"
              placeholder="Expected discharge date"
            />
          )}
        </div>
      </div>

      {/* Render all job sections */}
      {formData.jobs.map((_, index) => renderJobSection(index))}

      {/* Add Another Job Button */}
      <button
        type="button"
        onClick={addNewJob}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 mb-6"
      >
        Add Another Job
      </button>

      <button
        type="submit"
        className="w-full bg-[#FFD966] hover:bg-[#FFB800] text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Continue
      </button>
    </form>
  );
};

export default WorkBackground;