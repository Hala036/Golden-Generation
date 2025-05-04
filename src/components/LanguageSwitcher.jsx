import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Select } from 'antd';

const { Option } = Select;

const LanguageSwitcher = () => {
  const { language, changeLanguage, t } = useLanguage();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'he', name: 'עברית' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' }
  ];

  const handleLanguageChange = (value) => {
    changeLanguage(value);
  };

  return (
    <Select
      value={language}
      onChange={handleLanguageChange}
      style={{ width: 120 }}
      dropdownStyle={{ direction: 'ltr' }}
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