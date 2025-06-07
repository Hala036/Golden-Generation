import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import i18n from 'i18next';
import { useLanguage } from '../context/LanguageContext'; // Import the LanguageContext hook

const { Option } = Select;

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useLanguage(); // Access global language and changeLanguage function

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'he', name: 'עברית' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' }
  ];

  return (
    <Select
      value={language}
      onChange={changeLanguage}
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
