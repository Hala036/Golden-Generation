import React from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import './i18n';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
      })
      .catch((err) => {
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);
