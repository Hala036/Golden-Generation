import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(i18n.language || 'en'); // Default to i18n's current language

  // Function to change the language
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang); // Update i18n's language
    setLanguage(lang); // Update context state
    localStorage.setItem('language', lang); // Persist language in localStorage
  };

  // Sync with i18n when the language changes
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || i18n.language || 'en';
    changeLanguage(savedLanguage); // Ensure the app starts with the correct language
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
