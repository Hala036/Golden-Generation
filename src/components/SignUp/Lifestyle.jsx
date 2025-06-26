import React, { useState, useEffect } from 'react';
import useSignupStore from '../../store/signupStore';
import { Users, Star, Check } from 'lucide-react';

const Lifestyle = ({ onComplete, editMode = false, data }) => {
  const { lifestyleData, setLifestyleData } = useSignupStore();
  const [formData, setFormData] = useState(
    lifestyleData || {
      computerAbility: 3,
      sportActivity: 2,
      weeklySchedule: 3,
      interests: [],
      sportsSubspecialty: ''
    }
  );

  const interestOptions = [
    'Safety read books', 'culture', 'cooking', 'trips', 'Photography', 'sport',
    'study', 'gardening', 'computer', 'craftsmanship', 'music', 'art', 'dancing',
    'hiking', 'meditation', 'yoga', 'gaming', 'writing', 'volunteering', 'podcasts',
    'movies', 'fashion', 'languages', 'astronomy', 'history', 'science', 'technology',
    'baking', "don't have", 'other'
  ];

  const interestEmojis = {
    'Safety read books': '📚',
    'culture': '🎭',
    'cooking': '🍳',
    'trips': '✈️',
    'Photography': '📷',
    'sport': '🏆',
    'other': '🔍',
    "don't have": '❌',
    'study': '🎓',
    'gardening': '🌱',
    'computer': '💻',
    'craftsmanship': '🔨',
    'music': '🎵',
    'art': '🎨',
    'dancing': '💃',
    'hiking': '🥾',
    'meditation': '🧘',
    'yoga': '🧘‍♀️',
    'gaming': '🎮',
    'writing': '✍️',
    'volunteering': '🤝',
    'podcasts': '🎧',
    'movies': '🎬',
    'fashion': '👕',
    'languages': '🗣️',
    'astronomy': '🔭',
    'history': '📜',
    'science': '🔬',
    'technology': '📱',
    'baking': '🍰'
  };

  const handleInterestSelection = (interest) => {
    const updatedInterests = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest];
    setFormData({ ...formData, interests: updatedInterests });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLifestyleData(formData);
    onComplete();
  };

  const getLevelEmoji = (level) => {
    const emojis = ['😕', '🙂', '😊', '👍', '👌', '🌟'];
    return emojis[Math.min(5, Math.floor(level))];
  };

  // Floating background elements for visual consistency
  const FloatingElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-32 h-32 top-10 left-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '0s' }} />
      <div className="absolute w-24 h-24 top-1/3 right-20 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute w-40 h-40 bottom-20 left-1/4 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '4s' }} />
      <div className="absolute w-20 h-20 bottom-1/3 right-10 rounded-full bg-gradient-to-r from-yellow-200/30 to-blue-200/30 animate-pulse" style={{ animationDelay: '6s' }} />
    </div>
  );

  // Card for slider fields
  const SliderCard = ({ label, icon, value, onChange, min = 0, max = 5 }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm flex flex-col items-center">
      <label className="block text-center font-bold text-gray-800 mb-2">
        <span className="mr-2">{icon}</span>
        {label}
      </label>
      <div className="w-full max-w-md flex items-center">
        <span className="text-sm mr-3">Low</span>
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={onChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm ml-3">High</span>
      </div>
      <div className="mt-2 flex items-center">
        <span className="text-xl mr-2">{getLevelEmoji(value)}</span>
        <span className="text-sm font-medium">{value.toFixed(1)}/5</span>
      </div>
    </div>
  );

  // Card for interests selection
  const SelectionCard = ({ interest, isSelected, onClick }) => (
    <div
      className={`relative overflow-hidden transition-all duration-300 ease-in-out cursor-pointer
        border-2 rounded-xl p-3 bg-gradient-to-br from-white to-gray-50 flex flex-col items-center
        hover:border-yellow-300 hover:shadow-lg hover:scale-105
        ${isSelected
          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-xl shadow-yellow-200/50 scale-105 -translate-y-0.5'
          : 'border-gray-200'
        }`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
    >
      <span className="text-2xl mb-1">{interestEmojis[interest]}</span>
      <span className={`text-sm font-semibold text-center ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{interest}</span>
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400 text-white flex items-center justify-center">
          <Check size={16} />
        </div>
      )}
    </div>
  );

  // Prefill form in edit mode
  useEffect(() => {
    if (editMode && data && Object.keys(data).length > 0) {
      setLifestyleData(data);
    }
    // eslint-disable-next-line
  }, [editMode, data]);

  // Helper to handle parent-driven continue in editMode
  useEffect(() => {
    if (!editMode) return;
    window.__updateLifestyleDataAndContinue = () => {
      setLifestyleData(formData);
      // Do NOT call onComplete here to avoid recursion
    };
    return () => { delete window.__updateLifestyleDataAndContinue; };
    // eslint-disable-next-line
  }, [formData, editMode, onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 relative">
      <FloatingElements />

      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-yellow-500 mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lifestyle
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tell us about your daily activities and interests
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Computer/Smartphone Ability */}
          <SliderCard
            label='Level of ability in using a computer/smartphone'
            icon="💻"
            value={formData.computerAbility}
            onChange={e => setFormData({ ...formData, computerAbility: parseFloat(e.target.value) })}
          />

          {/* Sport Activity Level */}
          <SliderCard
            label='Level of weekly "sport" activity'
            icon="🏃"
            value={formData.sportActivity}
            onChange={e => setFormData({ ...formData, sportActivity: parseFloat(e.target.value) })}
          />

          {/* Weekly Schedule Occupancy */}
          <SliderCard
            label='Occupancy level of the weekly schedule'
            icon="📅"
            value={formData.weeklySchedule}
            onChange={e => setFormData({ ...formData, weeklySchedule: parseFloat(e.target.value) })}
          />

          {/* Interests */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm">
            <label className="block text-center font-bold text-gray-800 mb-4">
              <span className="mr-2">⭐</span>
              Interests (select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {interestOptions.map((interest) => (
                <SelectionCard
                  key={interest}
                  interest={interest}
                  isSelected={formData.interests.includes(interest)}
                  onClick={() => handleInterestSelection(interest)}
                />
              ))}
            </div>
          </div>

          {/* Sports Subspecialty */}
          {formData.interests.includes('sport') && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 backdrop-blur-sm max-w-md mx-auto">
              <label className="block text-center font-bold text-gray-800 mb-2">
                <span className="mr-2">🏅</span>
                Sports Subspecialty
              </label>
              <input
                type="text"
                value={formData.sportsSubspecialty}
                onChange={(e) => setFormData({ ...formData, sportsSubspecialty: e.target.value })}
                className="w-full border rounded-md p-2"
                placeholder="Enter your sports subspecialty"
              />
            </div>
          )}

          {/* Submit Button - only show if not in editMode */}
          {!editMode && (
            <div className="text-center pt-8">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Star className="w-6 h-6" />
                <span>Continue</span>
                <Star className="w-6 h-6" />
              </button>
            </div>
          )}
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

export default Lifestyle;
