import React from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LanguageProvider } from './context/LanguageContext'; // Import the LanguageProvider
import './i18n'; // Import the i18n configuration
// import './index.css'; // Import global styles if any

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
        <App />
    </LanguageProvider>
  </StrictMode>
);