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
    sportsSubspecialty: ''
  });

  const interestOptions = [
    { value: 'reading', label: 'Reading' },
    { value: 'writing', label: 'Writing' },
    { value: 'studying', label: 'Studying' },
    { value: 'languages', label: 'Learning Languages' },
    { value: 'chess', label: 'Chess' },
    { value: 'drawing', label: 'Drawing' },
    { value: 'painting', label: 'Painting' },
    { value: 'photography', label: 'Photography' },
    { value: 'pottery', label: 'Pottery' },
    { value: 'cooking', label: 'Cooking' },
    { value: 'baking', label: 'Baking' },
    { value: 'diy', label: 'DIY Crafts' },
    { value: 'music', label: 'Playing Instruments' },
    { value: 'singing', label: 'Singing' },
    { value: 'gardening', label: 'Gardening' },
    { value: 'meditation', label: 'Meditation' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'journaling', label: 'Journaling' },
    { value: 'volunteering', label: 'Volunteering' },
    { value: 'programming', label: 'Programming' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'robotics', label: 'Robotics' },
    { value: 'gaming', label: 'Gaming' },
    { value: '3dprinting', label: '3D Printing' },
    { value: 'traveling', label: 'Traveling' },
    { value: 'hiking', label: 'Hiking' },
    { value: 'camping', label: 'Camping' },
    { value: 'culture', label: 'Cultural Exploration' },
    { value: 'museums', label: 'Visiting Museums' },
    { value: 'walking', label: 'Walking' },
    { value: 'jogging', label: 'Jogging' },
    { value: 'running', label: 'Running' },
    { value: 'cycling', label: 'Cycling' },
    { value: 'swimming', label: 'Swimming' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'soccer', label: 'Soccer' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'volleyball', label: 'Volleyball' },
    { value: 'tabletennis', label: 'Table Tennis' },
    { value: 'martialarts', label: 'Martial Arts' },
    { value: 'pilates', label: 'Pilates' },
    { value: 'crossfit', label: 'CrossFit' },
    { value: 'climbing', label: 'Climbing' },
    { value: 'surfing', label: 'Surfing' },
    { value: 'skiing', label: 'Skiing' },
    { value: 'dancing', label: 'Dancing' },
    { value: 'horseback', label: 'Horseback Riding' },
    { value: 'gym', label: 'Gym Workouts' },
    { value: 'homeworkouts', label: 'Home Workouts' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setLifestyleData(formData);
    navigate('/summary');
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
          options={interestOptions}
          value={interestOptions.filter(option => formData.interests.includes(option.value))}
          onChange={(selectedOptions) => {
            const selectedValues = selectedOptions.map(option => option.value);
            setFormData({ ...formData, interests: selectedValues });
          }}
        />
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
