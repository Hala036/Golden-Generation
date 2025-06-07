import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import i18n from 'i18next';

const { Option } = Select;

const LanguageSwitcher = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'he', name: 'עברית' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' }
  ];

  const handleLanguageChange = (value) => {
    i18n.changeLanguage(value);
    setSelectedLanguage(value); // Update the local state
    document.documentElement.dir = ['ar', 'he'].includes(value) ? 'rtl' : 'ltr';
  };

  // Sync the local state with i18n.language if it changes externally
  useEffect(() => {
    setSelectedLanguage(i18n.language);
  }, [i18n.language]);

  return (
    <Select
      value={selectedLanguage}
      onChange={handleLanguageChange}
      style={{ width: 120 }}
    >
      {languages.map((lang) => (
        <Option key={lang.code} value={lang.code}>
          {lang.name}
        </Option>
      ))}
    </Select>
  );
};

export default LanguageSwitcher;
