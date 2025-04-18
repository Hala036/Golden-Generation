import React, { useState } from 'react';
import useSignupStore from '../../store/signupStore';

const Lifestyle = ({ onComplete }) => {
  const { lifestyleData, setLifestyleData } = useSignupStore();
  const [formData, setFormData] = useState(lifestyleData || {
    computerAbility: 0,
    sportActivity: 0,
    weeklySchedule: 0,
    interests: [],
    sportsSubspecialty: ''
  });

  const interestOptions = [
    'Safety read books', 'culture', 'cooking', 'trips', 'Photography', 'sport',
    'other', 'don\'t have', 'study', 'gardening', 'computer', 'craftsmanship'
  ];

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Lifestyle</h3>
        <p className="mt-1 text-sm text-gray-600">Tell us about your daily activities and interests</p>
      </div>

      {/* Computer/Smartphone Ability */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Level of ability in using a computer/smartphone (0 = low, 5 = high)
        </label>
        <div className="flex justify-between gap-2">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <label key={level} className="flex flex-col items-center">
              <input
                type="radio"
                name="computerAbility"
                value={level}
                checked={formData.computerAbility === level}
                onChange={(e) => setFormData({ ...formData, computerAbility: Number(e.target.value) })}
                className="mb-1"
              />
              <span className="text-sm">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sport Activity Level */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Level of weekly "sport" activity (0 = low, 5 = high)
        </label>
        <div className="flex justify-between gap-2">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <label key={level} className="flex flex-col items-center">
              <input
                type="radio"
                name="sportActivity"
                value={level}
                checked={formData.sportActivity === level}
                onChange={(e) => setFormData({ ...formData, sportActivity: Number(e.target.value) })}
                className="mb-1"
              />
              <span className="text-sm">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Weekly Schedule Occupancy */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Occupancy level of the weekly schedule (0 = low, 5 = high)
        </label>
        <div className="flex justify-between gap-2">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <label key={level} className="flex flex-col items-center">
              <input
                type="radio"
                name="weeklySchedule"
                value={level}
                checked={formData.weeklySchedule === level}
                onChange={(e) => setFormData({ ...formData, weeklySchedule: Number(e.target.value) })}
                className="mb-1"
              />
              <span className="text-sm">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Interests (select all that apply)</label>
        <div className="grid grid-cols-3 gap-3">
          {interestOptions.map((interest) => (
            <label key={interest} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.interests.includes(interest)}
                onChange={() => handleInterestSelection(interest)}
                className="mr-2"
              />
              <span className="text-sm">{interest}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sports Subspecialty */}
      {formData.interests.includes('sport') && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Sports Subspecialty</label>
          <input
            type="text"
            value={formData.sportsSubspecialty}
            onChange={(e) => setFormData({ ...formData, sportsSubspecialty: e.target.value })}
            className="w-full border rounded-md p-2"
            placeholder="Enter your sports subspecialty"
          />
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-[#FFD966] hover:bg-[#FFB800] text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Continue
      </button>
    </form>
  );
};

export default Lifestyle; 