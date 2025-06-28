import React from 'react';

const DefaultProfilePic = ({ name, size = 40, fontSize = '1.5rem', bgColor }) => {
  // Get the first letter of the actual name by:
  // 1. Handling null/undefined cases
  // 2. Splitting by underscore or space and taking the first part
  // 3. Getting the first letter and converting to uppercase
  const getFirstLetter = (name) => {
    if (!name) return '?';
    // Split by underscore or space and get first part
    const firstName = name.split(/[_\s]/)[0];
    return firstName.charAt(0).toUpperCase();
  };

  const firstLetter = getFirstLetter(name);

  // Define background colors for different user types
  const defaultColors = {
    admin: '#4F46E5', // Indigo
    superadmin: '#DC2626', // Red
    retiree: '#059669', // Green
    default: '#6B7280', // Gray
  };

  // Use provided bgColor or get from defaultColors
  const backgroundColor = bgColor || defaultColors.default;

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize,
        fontWeight: 'bold',
      }}
    >
      {firstLetter}
    </div>
  );
};

export default DefaultProfilePic; 