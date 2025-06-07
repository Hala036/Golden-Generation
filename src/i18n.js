import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './translations/en.json';
import heTranslations from './translations/he.json';
import ruTranslations from './translations/ru.json';
import arTranslations from './translations/ar.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    he: { translation: heTranslations },
    ru: { translation: ruTranslations },
    ar: { translation: arTranslations },
  },
  lng: 'en', // Default language
  fallbackLng: 'en', // Fallback language
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;