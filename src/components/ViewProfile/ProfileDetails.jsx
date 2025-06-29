import React from "react";
import { useLanguage } from '../../context/LanguageContext';

const ProfileDetails = ({ retireeData }) => {
  const { t } = useLanguage();
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('viewProfile.profileDetails.title')}</h2>
      <p><strong>{t('viewProfile.profileDetails.name')}:</strong> {retireeData.idVerification.firstName}</p>
      <p><strong>{t('viewProfile.profileDetails.age')}:</strong> {retireeData.idVerification.age}</p>
      <p><strong>{t('viewProfile.profileDetails.gender')}:</strong> {retireeData.idVerification.gender}</p>
      {/* <p><strong>Work Background:</strong> {retireeData.workBackground}</p> */}
    </div>
  );
};

export default ProfileDetails;