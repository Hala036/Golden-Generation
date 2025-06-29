import React from 'react';
import { useTranslation } from 'react-i18next';

const Volunteers = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">{t('superAdmin.volunteers.title')} ({t('superAdmin.volunteers.comingSoon')})</h2>
    </div>
  );
};

export default Volunteers;
