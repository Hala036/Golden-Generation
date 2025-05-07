import React, { useState } from 'react';
import Select from 'react-select';
import useSignupStore from '../../store/signupStore';
import { useNavigate } from 'react-router-dom';

const Lifestyle = () => {
  const { lifestyleData, setLifestyleData } = useSignupStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(lifestyleData || {
    computerAbility: 0,
    sportActivity: 0,
    weeklySchedule: 0,
    interests: [],
    sportsSubspecialty: '',
    customInterest: ''
  });

  const [showOtherInput, setShowOtherInput] = useState(false);

  const interestOptions = [
    { value: '3dprinting', label: '3D Printing' },
    { value: 'baking', label: 'Baking' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'camping', label: 'Camping' },
    { value: 'chess', label: 'Chess' },
    { value: 'climbing', label: 'Climbing' },
    { value: 'cooking', label: 'Cooking' },
    { value: 'crossfit', label: 'CrossFit' },
    { value: 'culture', label: 'Cultural Exploration' },
    { value: 'cycling', label: 'Cycling' },
    { value: 'dancing', label: 'Dancing' },
    { value: 'diy', label: 'DIY Crafts' },
    { value: 'drawing', label: 'Drawing' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'gardening', label: 'Gardening' },
    { value: 'gym', label: 'Gym Workouts' },
    { value: 'hiking', label: 'Hiking' },
    { value: 'homeworkouts', label: 'Home Workouts' },
    { value: 'horseback', label: 'Horseback Riding' },
    { value: 'journaling', label: 'Journaling' },
    { value: 'languages', label: 'Learning Languages' },
    { value: 'martialarts', label: 'Martial Arts' },
    { value: 'meditation', label: 'Meditation' },
    { value: 'museums', label: 'Visiting Museums' },
    { value: 'music', label: 'Playing Instruments' },
    { value: 'painting', label: 'Painting' },
    { value: 'photography', label: 'Photography' },
    { value: 'pilates', label: 'Pilates' },
    { value: 'pottery', label: 'Pottery' },
    { value: 'programming', label: 'Programming' },
    { value: 'reading', label: 'Reading' },
    { value: 'robotics', label: 'Robotics' },
    { value: 'running', label: 'Running' },
    { value: 'singing', label: 'Singing' },
    { value: 'skiing', label: 'Skiing' },
    { value: 'soccer', label: 'Soccer' },
    { value: 'studying', label: 'Studying' },
    { value: 'surfing', label: 'Surfing' },
    { value: 'swimming', label: 'Swimming' },
    { value: 'tabletennis', label: 'Table Tennis' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'traveling', label: 'Traveling' },
    { value: 'volleyball', label: 'Volleyball' },
    { value: 'volunteering', label: 'Volunteering' },
    { value: 'walking', label: 'Walking' },
    { value: 'writing', label: 'Writing' },
    { value: 'yoga', label: 'Yoga' },
  ];

  // Sort alphabetically
  const sortedOptions = interestOptions.sort((a, b) => a.label.localeCompare(b.label));

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = { ...formData };
    if (showOtherInput && formData.customInterest.trim()) {
      updatedData.interests = [...formData.interests, formData.customInterest.trim()];
    }
    setLifestyleData(updatedData);
    navigate('/VeteransCommunity');

  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Lifestyle</h3>
        <p className="mt-1 text-sm text-gray-600">Tell us about your daily activities and interests</p>
      </div>

      {/* Computer Ability */}
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
              />
              <span className="text-sm">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sport Activity */}
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
              />
              <span className="text-sm">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Weekly Schedule */}
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
              />
              <span className="text-sm">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Interests (search and select multiple)</label>
        <Select
          isMulti
          options={sortedOptions}
          value={sortedOptions.filter(option => formData.interests.includes(option.value))}
          onChange={(selectedOptions) => {
            const selectedValues = selectedOptions.map(option => option.value);
            setFormData({ ...formData, interests: selectedValues });
          }}
        />
        <button
          type="button"
          onClick={() => setShowOtherInput(!showOtherInput)}
          className="text-sm text-black underline mt-2"
        >
          + Other
        </button>
        {showOtherInput && (
          <input
            type="text"
            placeholder="Enter other interest"
            value={formData.customInterest}
            onChange={(e) => setFormData({ ...formData, customInterest: e.target.value })}
            className="w-full mt-2 p-2 border border-gray-300 rounded"
          />
        )}
      </div>

      {/* Sports Subspecialty */}
      {formData.interests.includes('sports') && (
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
