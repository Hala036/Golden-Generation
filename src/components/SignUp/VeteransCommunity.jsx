import React, { useState } from 'react';
import { Check, Users, Heart, Calendar, Clock, MapPin, Star } from 'lucide-react';
import useSignupStore from '../../store/signupStore';
import { useLanguage } from '../../context/LanguageContext';

const VeteransCommunity = ({ onComplete }) => {
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

  const activityOptions = [
    { id: 'cooking', label: t('Cooking'), icon: '🍳' },
    { id: 'trips', label: t('Trips'), icon: '🚌' },
    { id: 'choir', label: t('Choir'), icon: '🎵' },
    { id: 'torah-classes', label: t('Torah Classes'), icon: '📚' },
    { id: 'lectures', label: t('Lectures'), icon: '🎤' },
    { id: 'exercise', label: t('Exercise'), icon: '💪' }
  ];

  const reasonOptions = [
    t('Not another challenger'),
    t('Not relevant'),
    t('I have no information'),
    t('Not interesting'),
    t("I don't have time")
  ];

  const volunteerAreaOptions = [
    { id: 'publicity', label: t('Publicity'), icon: '📢' },
    { id: 'health', label: t('Health'), icon: '🏥' },
    { id: 'eater', label: t('Catering'), icon: '🍽️' },
    { id: 'teaching', label: t('Teaching'), icon: '👨‍🏫' },
    { id: 'high-tech', label: t('High Tech'), icon: '💻' },
    { id: 'tourism', label: t('Tourism'), icon: '🗺️' },
    { id: 'safety', label: t('Safety'), icon: '🛡️' },
    { id: 'funds', label: t('Fundraising'), icon: '💰' },
    { id: 'special-treat', label: t('Special Events'), icon: '🎉' },
    { id: 'craftsmanship', label: t('Craftsmanship'), icon: '🔨' },
    { id: 'aaliyah', label: t('Aaliyah'), icon: '✈️' },
    { id: 'culture', label: t('Culture'), icon: '🎭' }
  ];

  const frequencyOptions = [
    t('Once a month'),
    t('Once every two weeks'),
    t('Once a week'),
    t('Twice a week')
  ];

  const timeOptions = [
    t('Morning hours'),
    t('Noon hours'),
    t('Evening hours')
  ];

  const dayOptions = [
    { id: 'sunday', label: t('Sunday'), short: t('Sun') },
    { id: 'monday', label: t('Monday'), short: t('Mon') },
    { id: 'tuesday', label: t('Tuesday'), short: t('Tue') },
    { id: 'wednesday', label: t('Wednesday'), short: t('Wed') },
    { id: 'thursday', label: t('Thursday'), short: t('Thu') },
    { id: 'friday', label: t('Friday'), short: t('Fri') }
  ];

  const consultationOptions = [
    { id: 'company', label: t('Company'), icon: '🏢' },
    { id: 'gardening', label: t('Gardening'), icon: '🌱' },
    { id: 'health', label: t('Health'), icon: '🏥' },
    { id: 'food-nutrition', label: t('Food/Nutrition'), icon: '🥗' },
    { id: 'home-economics', label: t('Home Economics'), icon: '🏠' },
    { id: 'order-house', label: t('House Organization'), icon: '📋' },
    { id: 'marketing', label: t('Marketing'), icon: '📈' },
    { id: 'shopping', label: t('Shopping'), icon: '🛒' },
    { id: 'mobility', label: t('Mobility'), icon: '🚗' },
    { id: 'digital', label: t('Digital'), icon: '📱' },
    { id: 'legal', label: t('Legal'), icon: '⚖️' },
    { id: 'psychology', label: t('Psychology'), icon: '🧠' },
    { id: 'house-rules', label: t('House Rules'), icon: '📜' },
    { id: 'sport', label: t('Sport'), icon: '⚽' }
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
    const finalData = {
      ...formData,
      currentActivities: formData.currentActivities || [],
      volunteerAreas: formData.volunteerAreas || [],
      volunteerDays: formData.volunteerDays || [],
      additionalVolunteerFields: formData.additionalVolunteerFields || [],
      additionalVolunteerDays: formData.additionalVolunteerDays || [],
      consultationFields: formData.consultationFields || []
    };
    if (finalData.currentActivities.length === 0 && !finalData.notParticipatingReason) {
      finalData.notParticipatingReason = reasonOptions[0];
    }
    const mappedData = {
      ...finalData,
      lifestyle: {
        interests: [
          ...(finalData.volunteerAreas || []),
          ...(finalData.additionalVolunteerFields || [])
        ]
      },
      workBackground: {
        category: finalData.professionalBackground || ""
      },
      personalDetails: {
        settlement: finalData.settlement || ""
      },
      volunteerDays: finalData.volunteerDays,
      additionalVolunteerDays: finalData.additionalVolunteerDays,
    };
    setVeteransData(mappedData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 relative">
      <FloatingElements />
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-yellow-500 mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('Veterans Community')}
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("Join our vibrant community and make a difference. Tell us about your interests and how you'd like to contribute.")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Current Activities Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <div className="flex items-center mb-6">
              <Heart className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('Current Activities')}
                </h3>
                <p className="text-gray-600 text-lg">{t('What activities are you currently participating in?')}</p>
              </div>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {activityOptions.map((activity) => (
                <SelectionCard
                  key={activity.id}
                  isSelected={formData.currentActivities?.includes(activity.id)}
                  onClick={() => handleArraySelection('currentActivities', activity.id)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{activity.icon}</span>
                    <span className="font-semibold text-gray-800">{activity.label}</span>
                  </div>
                </SelectionCard>
              ))}
            </div>
          </div>

          {/* Reason for Not Participating */}
          {(!formData.currentActivities || formData.currentActivities.length === 0) && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t("Why aren't you participating?")}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">{t('Help us understand your situation better')}</p>
              <select
                value={formData.notParticipatingReason}
                onChange={(e) => setFormData({ ...formData, notParticipatingReason: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 transition-all duration-300 bg-white hover:border-gray-300"
              >
                <option value="">{t('Select a reason')}</option>
                {reasonOptions.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
          )}

          {/* Current Volunteering Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <div className="flex items-center mb-6">
              <Star className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('Current Volunteering')}
                </h3>
                <p className="text-gray-600 text-lg">{t('Are you already volunteering somewhere?')}</p>
              </div>
            </div>
            <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-300 transition-all duration-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVolunteer}
                onChange={(e) => setFormData({ ...formData, isVolunteer: e.target.checked })}
                className="w-5 h-5 text-yellow-500 border-2 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2 transition-all duration-200"
              />
              <span className="text-lg font-semibold text-gray-800">{t("Yes, I'm currently volunteering")}</span>
            </label>
            {formData.isVolunteer && (
              <div className="mt-8 space-y-8" style={{ animation: 'fadeIn 0.6s ease-in-out' }}>
                {/* Volunteer Areas */}
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-4">{t('Volunteer Areas')}</h4>
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {volunteerAreaOptions.map((area) => (
                      <SelectionCard
                        key={area.id}
                        isSelected={formData.volunteerAreas?.includes(area.id)}
                        onClick={() => handleArraySelection('volunteerAreas', area.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{area.icon}</span>
                          <span className="font-semibold text-gray-800">{area.label}</span>
                        </div>
                      </SelectionCard>
                    ))}
                  </div>
                </div>
                {/* Frequency and Hours */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-4">
                      <Calendar className="w-6 h-6 text-blue-500 mr-2" />
                      <h4 className="text-xl font-bold text-gray-800">{t('Frequency')}</h4>
                    </div>
                    <select
                      value={formData.volunteerFrequency}
                      onChange={(e) => setFormData({ ...formData, volunteerFrequency: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 transition-all duration-300 bg-white hover:border-gray-300"
                    >
                      <option value="">{t('Select frequency')}</option>
                      {frequencyOptions.map((freq) => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center mb-4">
                      <Clock className="w-6 h-6 text-green-500 mr-2" />
                      <h4 className="text-xl font-bold text-gray-800">{t('Preferred Hours')}</h4>
                    </div>
                    <select
                      value={formData.volunteerHours}
                      onChange={(e) => setFormData({ ...formData, volunteerHours: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 transition-all duration-300 bg-white hover:border-gray-300"
                    >
                      <option value="">{t('Select hours')}</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Days */}
                <div>
                  <div className="flex items-center mb-4">
                    <MapPin className="w-6 h-6 text-purple-500 mr-2" />
                    <h4 className="text-xl font-bold text-gray-800">{t('Available Days')}</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {dayOptions.map((day) => (
                      <SelectionCard
                        key={day.id}
                        isSelected={formData.volunteerDays?.includes(day.id)}
                        onClick={() => handleArraySelection('volunteerDays', day.id)}
                      >
                        <div className="text-center">
                          <div className="font-bold text-gray-800">{day.short}</div>
                          <div className="text-sm text-gray-600">{day.label}</div>
                        </div>
                      </SelectionCard>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Volunteering Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('Additional Volunteering')}
            </h3>
            <p className="text-gray-600 mb-6 text-lg">{t('Would you like to volunteer in additional areas?')}</p>
            <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-300 transition-all duration-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.additionalVolunteering}
                onChange={(e) => setFormData({ ...formData, additionalVolunteering: e.target.checked })}
                className="w-5 h-5 text-yellow-500 border-2 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2 transition-all duration-200"
              />
              <span className="text-lg font-semibold text-gray-800">{t("Yes, I'd like to volunteer additionally")}</span>
            </label>
            {formData.additionalVolunteering && (
              <div className="mt-8 space-y-8" style={{ animation: 'fadeIn 0.6s ease-in-out' }}>
                {/* Additional Areas */}
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-4">{t('Areas of Interest')}</h4>
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {volunteerAreaOptions.map((area) => (
                      <SelectionCard
                        key={area.id}
                        isSelected={formData.additionalVolunteerFields?.includes(area.id)}
                        onClick={() => handleArraySelection('additionalVolunteerFields', area.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{area.icon}</span>
                          <span className="font-semibold text-gray-800">{area.label}</span>
                        </div>
                      </SelectionCard>
                    ))}
                  </div>
                </div>
                {/* Additional Frequency and Hours */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">{t('Preferred Frequency')}</h4>
                    <select
                      value={formData.additionalVolunteerFrequency}
                      onChange={(e) => setFormData({ ...formData, additionalVolunteerFrequency: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 transition-all duration-300 bg-white hover:border-gray-300"
                    >
                      <option value="">{t('Select frequency')}</option>
                      {frequencyOptions.map((freq) => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">{t('Preferred Hours')}</h4>
                    <select
                      value={formData.additionalVolunteerHours}
                      onChange={(e) => setFormData({ ...formData, additionalVolunteerHours: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 transition-all duration-300 bg-white hover:border-gray-300"
                    >
                      <option value="">{t('Select hours')}</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Additional Days */}
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-4">{t('Preferred Days')}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {dayOptions.map((day) => (
                      <SelectionCard
                        key={day.id}
                        isSelected={formData.additionalVolunteerDays?.includes(day.id)}
                        onClick={() => handleArraySelection('additionalVolunteerDays', day.id)}
                      >
                        <div className="text-center">
                          <div className="font-bold text-gray-800">{day.short}</div>
                          <div className="text-sm text-gray-600">{day.label}</div>
                        </div>
                      </SelectionCard>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Consultation Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('Consultation Services')}
            </h3>
            <p className="text-gray-600 mb-6 text-lg">{t('Would you like consultation in any field?')}</p>
            <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-300 transition-all duration-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.needsConsultation}
                onChange={(e) => setFormData({ ...formData, needsConsultation: e.target.checked })}
                className="w-5 h-5 text-yellow-500 border-2 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2 transition-all duration-200"
              />
              <span className="text-lg font-semibold text-gray-800">{t('Yes, I need consultation')}</span>
            </label>
            {formData.needsConsultation && (
              <div className="mt-8" style={{ animation: 'fadeIn 0.6s ease-in-out' }}>
                <h4 className="text-xl font-bold text-gray-800 mb-4">{t('Fields for Consultation')}</h4>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                  {consultationOptions.map((field) => (
                    <SelectionCard
                      key={field.id}
                      isSelected={formData.consultationFields?.includes(field.id)}
                      onClick={() => handleArraySelection('consultationFields', field.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{field.icon}</span>
                        <span className="font-semibold text-gray-800">{field.label}</span>
                      </div>
                    </SelectionCard>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center pt-8">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95"
            >
              <span className="flex items-center justify-center space-x-2">
                <Star className="w-6 h-6" />
                <span>{t('Create My Community Profile')}</span>
                <Star className="w-6 h-6" />
              </span>
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
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
