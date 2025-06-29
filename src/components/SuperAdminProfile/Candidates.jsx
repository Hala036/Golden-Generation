import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Candidates = () => {
  const { t } = useLanguage();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">{t('candidates.title')} ({t('candidates.comingSoon')})</h2>
    </div>
  );
};

export default Candidates;