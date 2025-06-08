import React, { useState } from 'react';
import useSignupStore from '../../store/signupStore';

const VeteransCommunity = ({ onComplete }) => {
  const { veteransData, setVeteransData } = useSignupStore();

  const [formData, setFormData] = useState(veteransData || {
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
  });

  const activityOptions = ['cooking', 'trips', 'choir', 'Torah classes', 'Lectures', 'exercise'];
  const reasonOptions = [
    'Not another challenger',
    'Not relevant',
    'I have no information',
    'not interesting',
    'I don\'t have time'
  ];
  const volunteerAreaOptions = [
    'publicity', 'health', 'eater', 'teaching', 'High tech', 'tourism',
    'safety', 'funds', 'A special treat', 'craftsmanship', 'Aaliyah', 'culture'
  ];
  const frequencyOptions = ['once a month', 'once every two weeks', 'once a week', 'twice a week'];
  const timeOptions = ['morning hours', 'noon hours', 'evening hours'];
  const dayOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const consultationOptions = [
    'company', 'gardening', 'health', 'food/nutrition', 'home economics', 'Order in the house',
    'Marketing', 'Shopping', 'Mobility', 'digital', 'legal', 'psychology', 'House rules', 'sport'
  ];

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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ensure arrays are initialized even if empty
    const finalData = {
      ...formData,
      currentActivities: formData.currentActivities || [],
      volunteerAreas: formData.volunteerAreas || [],
      volunteerDays: formData.volunteerDays || [],
      additionalVolunteerFields: formData.additionalVolunteerFields || [],
      additionalVolunteerDays: formData.additionalVolunteerDays || [],
      consultationFields: formData.consultationFields || []
    };

    // If not participating in activities, ensure reason is set
    if (finalData.currentActivities.length === 0 && !finalData.notParticipatingReason) {
      finalData.notParticipatingReason = reasonOptions[0];
    }

    // Save the complete data to the store
    setVeteransData(finalData);
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Veterans in the Community</h3>
        <p className="mt-1 text-sm text-gray-600">Tell us about your community involvement</p>
      </div>

      {/* Current Activities */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Current Activities</label>
        <div className="grid grid-cols-2 gap-3">
          {activityOptions.map((activity) => (
            <label key={activity} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.currentActivities?.includes(activity)}
                onChange={() => handleArraySelection('currentActivities', activity)}
                className="mr-2"
              />
              <span className="text-sm">{activity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reason for Not Participating */}
      {(!formData.currentActivities || formData.currentActivities.length === 0) && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Reason for not participating</label>
          <select
            value={formData.notParticipatingReason}
            onChange={(e) => setFormData({ ...formData, notParticipatingReason: e.target.value })}
            className="w-full border rounded-md p-2"
          >
            <option value="">Select a reason</option>
            {reasonOptions.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>
      )}

      {/* Volunteering Section */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Are you already a volunteer?</label>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isVolunteer}
              onChange={(e) => setFormData({ ...formData, isVolunteer: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Yes</span>
          </label>

          {formData.isVolunteer && (
            <div className="space-y-4 pl-4">
              {/* Volunteer Areas */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Volunteer Areas</label>
                <div className="grid grid-cols-2 gap-3">
                  {volunteerAreaOptions.map((area) => (
                    <label key={area} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.volunteerAreas?.includes(area)}
                        onChange={() => handleArraySelection('volunteerAreas', area)}
                        className="mr-2"
                      />
                      <span className="text-sm">{area}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <select
                  value={formData.volunteerFrequency}
                  onChange={(e) => setFormData({ ...formData, volunteerFrequency: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select frequency</option>
                  {frequencyOptions.map((freq) => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
              </div>

              {/* Hours */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Hours</label>
                <select
                  value={formData.volunteerHours}
                  onChange={(e) => setFormData({ ...formData, volunteerHours: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select hours</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* Days */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Days</label>
                <div className="grid grid-cols-3 gap-3">
                  {dayOptions.map((day) => (
                    <label key={day} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.volunteerDays?.includes(day)}
                        onChange={() => handleArraySelection('volunteerDays', day)}
                        className="mr-2"
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Volunteering */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Would you like to volunteer additionally?</label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.additionalVolunteering}
            onChange={(e) => setFormData({ ...formData, additionalVolunteering: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Yes</span>
        </label>

        {formData.additionalVolunteering && (
          <div className="space-y-4 pl-4">
            {/* Additional Volunteer Fields */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Areas of Interest</label>
              <div className="grid grid-cols-2 gap-3">
                {volunteerAreaOptions.map((area) => (
                  <label key={area} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.additionalVolunteerFields?.includes(area)}
                      onChange={() => handleArraySelection('additionalVolunteerFields', area)}
                      className="mr-2"
                    />
                    <span className="text-sm">{area}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Frequency */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Preferred Frequency</label>
              <select
                value={formData.additionalVolunteerFrequency}
                onChange={(e) => setFormData({ ...formData, additionalVolunteerFrequency: e.target.value })}
                className="w-full border rounded-md p-2"
              >
                <option value="">Select frequency</option>
                {frequencyOptions.map((freq) => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>

            {/* Additional Hours */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Preferred Hours</label>
              <select
                value={formData.additionalVolunteerHours}
                onChange={(e) => setFormData({ ...formData, additionalVolunteerHours: e.target.value })}
                className="w-full border rounded-md p-2"
              >
                <option value="">Select hours</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {/* Additional Days */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Preferred Days</label>
              <div className="grid grid-cols-3 gap-3">
                {dayOptions.map((day) => (
                  <label key={day} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.additionalVolunteerDays?.includes(day)}
                      onChange={() => handleArraySelection('additionalVolunteerDays', day)}
                      className="mr-2"
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Consultation Needs */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Would you like consultation in any field?</label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.needsConsultation}
            onChange={(e) => setFormData({ ...formData, needsConsultation: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Yes</span>
        </label>

        {formData.needsConsultation && (
          <div className="space-y-4 pl-4">
            <label className="block text-sm font-medium text-gray-700">Fields for Consultation</label>
            <div className="grid grid-cols-2 gap-3">
              {consultationOptions.map((field) => (
                <label key={field} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.consultationFields?.includes(field)}
                    onChange={() => handleArraySelection('consultationFields', field)}
                    className="mr-2"
                  />
                  <span className="text-sm">{field}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-[#FFD966] hover:bg-[#FFB800] text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Create Account
      </button>
    </form>
  );
};

export default VeteransCommunity; 