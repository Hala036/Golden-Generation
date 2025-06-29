import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Check, Users, Heart, Calendar, Clock, MapPin, Star } from 'lucide-react';
import useSignupStore from '../../store/signupStore';

const VeteransCommunity = ({ onComplete, editMode, data }) => {
  const { t } = useLanguage();

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
    consultationFields: [],
    settlement: '',
    professionalBackground: ''
  });

  // Add a ref to always hold the latest formData
  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  const activityOptions = [
    { id: 'cooking', label: t('auth.veteransCommunity.cooking'), icon: '🍳' },
    { id: 'trips', label: t('auth.veteransCommunity.trips'), icon: '🚌' },
    { id: 'choir', label: t('auth.veteransCommunity.choir'), icon: '🎵' },
    { id: 'torah-classes', label: t('auth.veteransCommunity.torahClasses'), icon: '📚' },
    { id: 'lectures', label: t('auth.veteransCommunity.lectures'), icon: '🎤' },
    { id: 'exercise', label: t('auth.veteransCommunity.exercise'), icon: '💪' }
  ];

  const reasonOptions = [
    t('auth.veteransCommunity.noChallenge'),
    t('auth.veteransCommunity.notRelevant'),
    t('auth.veteransCommunity.noInfo'),
    t('auth.veteransCommunity.notInteresting'),
    t('auth.veteransCommunity.noTime')
  ];

  const volunteerAreaOptions = [
    { id: 'publicity', label: t('auth.veteransCommunity.publicity'), icon: '📢' },
    { id: 'health', label: t('auth.veteransCommunity.health'), icon: '🏥' },
    { id: 'eater', label: t('auth.veteransCommunity.eater'), icon: '🍽️' },
    { id: 'teaching', label: t('auth.veteransCommunity.teaching'), icon: '👨‍🏫' },
    { id: 'high-tech', label: t('auth.veteransCommunity.highTech'), icon: '💻' },
    { id: 'tourism', label: t('auth.veteransCommunity.tourism'), icon: '🗺️' },
    { id: 'safety', label: t('auth.veteransCommunity.safety'), icon: '🛡️' },
    { id: 'funds', label: t('auth.veteransCommunity.funds'), icon: '💰' },
    { id: 'special-treat', label: t('auth.veteransCommunity.specialTreat'), icon: '🎉' },
    { id: 'craftsmanship', label: t('auth.veteransCommunity.craftsmanship'), icon: '🔨' },
    { id: 'aaliyah', label: t('auth.veteransCommunity.aaliyah'), icon: '✈️' },
    { id: 'culture', label: t('auth.veteransCommunity.culture'), icon: '🎭' }
  ];

  const frequencyOptions = [
    t('auth.veteransCommunity.onceMonth'),
    t('auth.veteransCommunity.onceTwoWeeks'),
    t('auth.veteransCommunity.onceWeek'),
    t('auth.veteransCommunity.twiceWeek')
  ];

  const timeOptions = [
    t('auth.veteransCommunity.morning'),
    t('auth.veteransCommunity.noon'),
    t('auth.veteransCommunity.evening')
  ];

  const dayOptions = [
    { id: 'sunday', label: t('auth.veteransCommunity.sunday'), short: t('auth.veteransCommunity.sun') },
    { id: 'monday', label: t('auth.veteransCommunity.monday'), short: t('auth.veteransCommunity.mon') },
    { id: 'tuesday', label: t('auth.veteransCommunity.tuesday'), short: t('auth.veteransCommunity.tue') },
    { id: 'wednesday', label: t('auth.veteransCommunity.wednesday'), short: t('auth.veteransCommunity.wed') },
    { id: 'thursday', label: t('auth.veteransCommunity.thursday'), short: t('auth.veteransCommunity.thu') },
    { id: 'friday', label: t('auth.veteransCommunity.friday'), short: t('auth.veteransCommunity.fri') }
  ];

  const consultationOptions = [
    { id: 'company', label: t('auth.veteransCommunity.company'), icon: '🏢' },
    { id: 'gardening', label: t('auth.veteransCommunity.gardening'), icon: '🌱' },
    { id: 'health', label: t('auth.veteransCommunity.health'), icon: '🏥' },
    { id: 'food-nutrition', label: t('auth.veteransCommunity.foodNutrition'), icon: '🥗' },
    { id: 'home-economics', label: t('auth.veteransCommunity.homeEconomics'), icon: '🏠' },
    { id: 'order-house', label: t('auth.veteransCommunity.orderHouse'), icon: '📋' },
    { id: 'marketing', label: t('auth.veteransCommunity.marketing'), icon: '📈' },
    { id: 'shopping', label: t('auth.veteransCommunity.shopping'), icon: '🛒' },
    { id: 'mobility', label: t('auth.veteransCommunity.mobility'), icon: '🚗' },
    { id: 'digital', label: t('auth.veteransCommunity.digital'), icon: '📱' },
    { id: 'legal', label: t('auth.veteransCommunity.legal'), icon: '⚖️' },
    { id: 'psychology', label: t('auth.veteransCommunity.psychology'), icon: '🧠' },
    { id: 'house-rules', label: t('auth.veteransCommunity.houseRules'), icon: '📜' },
    { id: 'sport', label: t('auth.veteransCommunity.sport'), icon: '⚽' }
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

  // Utility to remove forbidden nested keys
  function stripNestedFields(obj) {
    const forbidden = ['lifestyle', 'workBackground', 'personalDetails'];
    const clean = { ...obj };
    forbidden.forEach(key => { if (key in clean) delete clean[key]; });
    return clean;
  }

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

    setVeteransData(stripNestedFields(finalData));
    onComplete();
  };

  const SelectionCard = ({ item, isSelected, onClick, children }) => (
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

  const FloatingElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-32 h-32 top-10 left-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '0s' }} />
      <div className="absolute w-24 h-24 top-1/3 right-20 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute w-40 h-40 bottom-20 left-1/4 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '4s' }} />
      <div className="absolute w-20 h-20 bottom-1/3 right-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '6s' }} />
    </div>
  );

  // Prefill form in edit mode
  useEffect(() => {
    if (editMode && data && Object.keys(data).length > 0) {
      setFormData(stripNestedFields(data));
    }
  }, [editMode, data]);

  // Helper to handle parent-driven continue in editMode
  useEffect(() => {
    if (!editMode) return;
    window.__updateVeteransDataAndContinue = () => {
      const cleaned = stripNestedFields(formDataRef.current);
      setVeteransData(cleaned);
      return cleaned; // Return the latest data
    };
    return () => { delete window.__updateVeteransDataAndContinue; };
    // eslint-disable-next-line
  }, [editMode, setVeteransData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 relative">
      <FloatingElements />
      
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-yellow-500 mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('auth.veteransCommunity.title')}
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('auth.veteransCommunity.description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Settlement and Professional Background */}
          {/* Removed Basic Information section */}
          
          {/* Current Activities Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <Heart className="text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                {t('auth.veteransCommunity.currentActivities')}
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              {t('auth.veteransCommunity.currentActivitiesDescription')}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {activityOptions.map((activity) => (
                <SelectionCard
                  key={activity.id}
                  isSelected={formData.currentActivities.includes(activity.id)}
                  onClick={() => handleArraySelection('currentActivities', activity.id)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{activity.icon}</div>
                    <div className="font-semibold text-gray-800">{activity.label}</div>
                  </div>
                </SelectionCard>
              ))}
            </div>

            {/* Not Participating Reason */}
            {formData.currentActivities.length === 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('auth.veteransCommunity.whyNotParticipating')}
                </label>
                <p className="text-gray-600 mb-4">
                  {t('auth.veteransCommunity.whyNotParticipatingDescription')}
                </p>
                <select
                  value={formData.notParticipatingReason}
                  onChange={(e) => setFormData({ ...formData, notParticipatingReason: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  <option value="">{t('auth.veteransCommunity.selectReason')}</option>
                  {reasonOptions.map((reason, index) => (
                    <option key={index} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Current Volunteering Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <Heart className="text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                {t('auth.veteransCommunity.currentVolunteering')}
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              {t('auth.veteransCommunity.currentVolunteeringDescription')}
            </p>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVolunteer}
                  onChange={(e) => setFormData({ ...formData, isVolunteer: e.target.checked })}
                  className="mr-3 h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                />
                <span className="text-gray-700">
                  {t('auth.veteransCommunity.yesImCurrentlyVolunteering')}
                </span>
              </label>
            </div>

            {formData.isVolunteer && (
              <div className="space-y-6">
                {/* Volunteer Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('auth.veteransCommunity.volunteerAreas')}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {volunteerAreaOptions.map((area) => (
                      <SelectionCard
                        key={area.id}
                        isSelected={formData.volunteerAreas.includes(area.id)}
                        onClick={() => handleArraySelection('volunteerAreas', area.id)}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{area.icon}</div>
                          <div className="font-semibold text-gray-800 text-sm">{area.label}</div>
                        </div>
                      </SelectionCard>
                    ))}
                  </div>
                </div>

                {/* Frequency, Hours, Days */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.veteransCommunity.frequency')}
                    </label>
                    <select
                      value={formData.volunteerFrequency}
                      onChange={(e) => setFormData({ ...formData, volunteerFrequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      <option value="">{t('auth.veteransCommunity.selectFrequency')}</option>
                      {frequencyOptions.map((freq, index) => (
                        <option key={index} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.veteransCommunity.preferredHours')}
                    </label>
                    <select
                      value={formData.volunteerHours}
                      onChange={(e) => setFormData({ ...formData, volunteerHours: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      <option value="">{t('auth.veteransCommunity.selectHours')}</option>
                      {timeOptions.map((time, index) => (
                        <option key={index} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.veteransCommunity.availableDays')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {dayOptions.map((day) => (
                        <label key={day.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.volunteerDays.includes(day.id)}
                            onChange={() => handleArraySelection('volunteerDays', day.id)}
                            className="mr-2 h-3 w-3 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{day.short}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Volunteering Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <Heart className="text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                {t('auth.veteransCommunity.additionalVolunteering')}
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              {t('auth.veteransCommunity.additionalVolunteeringDescription')}
            </p>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.additionalVolunteering}
                  onChange={(e) => setFormData({ ...formData, additionalVolunteering: e.target.checked })}
                  className="mr-3 h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                />
                <span className="text-gray-700">
                  {t('auth.veteransCommunity.yesIdLikeToVolunteerAdditionally')}
                </span>
              </label>
            </div>

            {formData.additionalVolunteering && (
              <div className="space-y-6">
                {/* Additional Volunteer Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('auth.veteransCommunity.areasOfInterest')}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {volunteerAreaOptions.map((area) => (
                      <SelectionCard
                        key={area.id}
                        isSelected={formData.additionalVolunteerFields.includes(area.id)}
                        onClick={() => handleArraySelection('additionalVolunteerFields', area.id)}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{area.icon}</div>
                          <div className="font-semibold text-gray-800 text-sm">{area.label}</div>
                        </div>
                      </SelectionCard>
                    ))}
                  </div>
                </div>

                {/* Additional Frequency, Hours, Days */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.veteransCommunity.preferredFrequency')}
                    </label>
                    <select
                      value={formData.additionalVolunteerFrequency}
                      onChange={(e) => setFormData({ ...formData, additionalVolunteerFrequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      <option value="">{t('auth.veteransCommunity.selectFrequency')}</option>
                      {frequencyOptions.map((freq, index) => (
                        <option key={index} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.veteransCommunity.preferredHours')}
                    </label>
                    <select
                      value={formData.additionalVolunteerHours}
                      onChange={(e) => setFormData({ ...formData, additionalVolunteerHours: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      <option value="">{t('auth.veteransCommunity.selectHours')}</option>
                      {timeOptions.map((time, index) => (
                        <option key={index} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.veteransCommunity.preferredDays')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {dayOptions.map((day) => (
                        <label key={day.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.additionalVolunteerDays.includes(day.id)}
                            onChange={() => handleArraySelection('additionalVolunteerDays', day.id)}
                            className="mr-2 h-3 w-3 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{day.short}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Consultation Services Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <Heart className="text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                {t('auth.veteransCommunity.consultationServices')}
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              {t('auth.veteransCommunity.consultationServicesDescription')}
            </p>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.needsConsultation}
                  onChange={(e) => setFormData({ ...formData, needsConsultation: e.target.checked })}
                  className="mr-3 h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                />
                <span className="text-gray-700">
                  {t('auth.veteransCommunity.yesINeedConsultation')}
                </span>
              </label>
            </div>

            {formData.needsConsultation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('auth.veteransCommunity.fieldsForConsultation')}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {consultationOptions.map((option) => (
                    <SelectionCard
                      key={option.id}
                      isSelected={formData.consultationFields.includes(option.id)}
                      onClick={() => handleArraySelection('consultationFields', option.id)}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="font-semibold text-gray-800 text-sm">{option.label}</div>
                      </div>
                    </SelectionCard>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Star className="w-6 h-6" />
              <span>{t('auth.veteransCommunity.createMyCommunityProfile')}</span>
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

export default VeteransCommunity;
