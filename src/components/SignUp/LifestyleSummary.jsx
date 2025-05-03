import React from 'react';
import useSignupStore from '../../store/signupStore';

const LifestyleSummary = () => {
  const { lifestyleData } = useSignupStore();

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Lifestyle Summary</h2>

      <ul className="space-y-2 text-gray-700 text-sm">
        <li><strong>Computer Ability:</strong> {lifestyleData.computerAbility}</li>
        <li><strong>Sport Activity:</strong> {lifestyleData.sportActivity}</li>
        <li><strong>Weekly Schedule:</strong> {lifestyleData.weeklySchedule}</li>
        <li><strong>Hobbies:</strong>
          <ul className="list-disc pl-6 mt-1">
            {lifestyleData.interests?.length > 0 ? (
              lifestyleData.interests.map((interest, index) => (
                <li key={index}>{interest}</li>
              ))
            ) : (
              <li>No hobbies selected</li>
            )}
          </ul>
        </li>
        {lifestyleData.interests?.includes('sports') && lifestyleData.sportsSubspecialty && (
          <li><strong>Sports Subspecialty:</strong> {lifestyleData.sportsSubspecialty}</li>
        )}
      </ul>
    </div>
  );
};

export default LifestyleSummary;
