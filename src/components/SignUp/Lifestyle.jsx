import React, { useState } from 
'react'
;
import useSignupStore from 
'../../store/signupStore'
;

const Lifestyle = ({ onComplete }) => {
  const { lifestyleData, 
setLifestyleData
 } = useSignupStore();
  const [formData, setFormData] = 
useState
(lifestyleData || {
    computerAbility: 3,
    sportActivity: 2,
    weeklySchedule: 3,
    interests: [],
    sportsSubspecialty: ''
  });

  const interestOptions = [
    'Safety read books', 'culture', 
'cooking'
, 'trips', 'Photography', 'sport',
     'study', 'gardening', 'computer', 'craftsmanship',
    'music', 'art', 'dancing', 'hiking', 'meditation', 'yoga', 'gaming',
    'writing', 'volunteering', 'podcasts', 'movies', 'fashion', 'languages',
    'astronomy', 'history', 'science', 'technology', 'baking' , 'don\'t have', 'other'
  ];

  // Map of interest options to emojis
  const interestEmojis = {
    'Safety read books': '📚',
    'culture': '🎭',
    'cooking': '🍳',
    'trips': '✈️',
    'Photography': '📷',
    'sport': '🏆',
    'other': '🔍',
    'don\'t have': '❌',
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

  // Get emoji based on slider value
  const getLevelEmoji = (level) => {
    const emojis = ['😕', '🙂', '😊', '👍', '👌', '🌟'];
    return emojis[Math.min(5, Math.floor(level))];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Lifestyle 🏡</h3>
        <p className="mt-1 text-sm text-gray-600">Tell us about your daily activities and interests</p>
      </div>

      {/* Computer/Smartphone Ability */}
      <div className="space-y-4">
        <label className="block text-center font-bold text-gray-800">
          <span className="mr-2">💻</span>
          Level of ability in using a computer/smartphone
        </label>
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md flex items-center">
            <span className="text-sm mr-3">Low</span>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={formData.computerAbility}
              onChange={(e) => setFormData({ ...formData, computerAbility: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm ml-3">High</span>
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-xl mr-2">{getLevelEmoji(formData.computerAbility)}</span>
            <span className="text-sm font-medium">{formData.computerAbility.toFixed(1)}/5</span>
          </div>
        </div>
      </div>

      {/* Sport Activity Level */}
      <div className="space-y-4">
        <label className="block text-center font-bold text-gray-800">
          <span className="mr-2">🏃</span>
          Level of weekly "sport" activity
        </label>
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md flex items-center">
            <span className="text-sm mr-3">Low</span>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={formData.sportActivity}
              onChange={(e) => setFormData({ ...formData, sportActivity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm ml-3">High</span>
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-xl mr-2">{getLevelEmoji(formData.sportActivity)}</span>
            <span className="text-sm font-medium">{formData.sportActivity.toFixed(1)}/5</span>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Occupancy */}
      <div className="space-y-4">
        <label className="block text-center font-bold text-gray-800">
          <span className="mr-2">📅</span>
          Occupancy level of the weekly schedule
        </label>
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md flex items-center">
            <span className="text-sm mr-3">Low</span>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={formData.weeklySchedule}
              onChange={(e) => setFormData({ ...formData, weeklySchedule: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm ml-3">High</span>
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-xl mr-2">{getLevelEmoji(formData.weeklySchedule)}</span>
            <span className="text-sm font-medium">{formData.weeklySchedule.toFixed(1)}/5</span>
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-4">
        <label className="block text-center font-bold text-gray-800">
          <span className="mr-2">⭐</span>
          Interests (select all that apply)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {interestOptions.map((interest) => (
            <label key={interest} className="flex items-center p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.interests.includes(interest)}
                onChange={() => handleInterestSelection(interest)}
                className="mr-2"
              />
              <span className="text-sm mr-1">{interestEmojis[interest]}</span>
              <span className="text-sm">{interest}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sports Subspecialty */}
      {formData.interests.includes('sport') && (
        <div className="space-y-2 max-w-md mx-auto">
          <label className="block text-center font-bold text-gray-800">
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

      <div className="flex justify-center mt-8">
        <button
          type="submit"
          className="bg-[#FFD966] hover:bg-[#FFB800] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Continue 👉
        </button>
      </div>
    </form>
  );
};

export default Lifestyle;