import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n'; // Import the i18n instance
import enTranslations from '../translations/en.json';
import heTranslations from '../translations/he.json';
import arTranslations from '../translations/ar.json';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState(enTranslations);

  useEffect(() => {
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('language') || 'en';
    changeLanguage(savedLanguage); // Use changeLanguage to initialize
  }, []);

  const getTranslations = (lang) => {
    switch (lang) {
      case 'en':
        return enTranslations;
      case 'he':
        return heTranslations;
      case 'ar':
        return arTranslations;
      default:
        return enTranslations;
    }
  };

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    setTranslations(getTranslations(newLanguage));
    localStorage.setItem('language', newLanguage);

    // Update i18n instance
    i18n.changeLanguage(newLanguage);

    // Update the direction of the document
    const rtlLanguages = ['he', 'ar'];
    document.documentElement.dir = rtlLanguages.includes(newLanguage) ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return the key if translation not found
      }
    }

    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
