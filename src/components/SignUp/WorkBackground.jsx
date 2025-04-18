import React, { useState } from 'react';
import useSignupStore from '../../store/signupStore';

const WorkBackground = ({ onComplete }) => {
  const { workData, setWorkData } = useSignupStore();
  const [formData, setFormData] = useState(workData || {
    retirementStatus: '',
    employmentDate: '',
    employmentType: '',
    lastJobs: [],
    academicDegrees: '',
    currentlyWorking: false,
    dischargeDate: '',
    subspecialty: ''
  });

  const jobOptions = [
    'doctor', 'funds', 'Sales', 'Marketing', 'High tech', 'teaching', 'housewife',
    'Admin', 'Social Academy', 'Psychology p.', 'tourism', 'retailing', 'Nursing',
    'engineer', 'Management', 'coaching/mentor', 'Design', 'IDF', 'other'
  ];

  const handleJobSelection = (job) => {
    const updatedJobs = formData.lastJobs.includes(job)
      ? formData.lastJobs.filter(j => j !== job)
      : [...formData.lastJobs, job];
    
    setFormData({ ...formData, lastJobs: updatedJobs });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setWorkData(formData);
    onComplete();
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
          {['I didn\'t retire', 'partially', 'full'].map((status) => (
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

      {/* Last Jobs */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Last Job(s)</label>
        <div className="grid grid-cols-3 gap-3">
          {jobOptions.map((job) => (
            <label key={job} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.lastJobs.includes(job)}
                onChange={() => handleJobSelection(job)}
                className="mr-2"
              />
              <span className="text-sm">{job}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Subspecialty */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Subspecialty in work field</label>
        <input
          type="text"
          value={formData.subspecialty}
          onChange={(e) => setFormData({ ...formData, subspecialty: e.target.value })}
          className="w-full border rounded-md p-2"
          placeholder="Enter your subspecialty"
        />
      </div>

      {/* Academic Degrees */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Academic Degrees</label>
        <input
          type="text"
          value={formData.academicDegrees}
          onChange={(e) => setFormData({ ...formData, academicDegrees: e.target.value })}
          className="w-full border rounded-md p-2"
          placeholder="Enter your academic degrees"
        />
      </div>

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