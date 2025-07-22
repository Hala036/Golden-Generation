import React from "react";
import { FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaTransgender, FaIdCard, FaMapMarkerAlt, FaHome, FaBook, FaGraduationCap, FaGlobe, FaBriefcase, FaStar, FaCheck, FaClock, FaCalendarAlt, FaUsers, FaHeart, FaLanguage, FaLaptop, FaInfoCircle, FaEdit } from "react-icons/fa";
import { MdWork, MdVolunteerActivism } from "react-icons/md";
import { GiSkills, GiPartyPopper } from "react-icons/gi";
import { BsFillPersonLinesFill } from "react-icons/bs";
import profile from "../../assets/profile.jpeg";
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

// Emoji mappings (should match your sign up logic)
const interestEmojis = {
  'Safety read books': '📚', 'culture': '🎭', 'cooking': '🍳', 'trips': '✈️', 'Photography': '📷', 'sport': '🏆', 'other': '🔍', "don't have": '❌', 'study': '🎓', 'gardening': '🌱', 'computer': '💻', 'craftsmanship': '🔨', 'music': '🎵', 'art': '🎨', 'dancing': '💃', 'hiking': '🥾', 'meditation': '🧘', 'yoga': '🧘‍♀️', 'gaming': '🎮', 'writing': '✍️', 'volunteering': '🤝', 'podcasts': '🎧', 'movies': '🎬', 'fashion': '👕', 'languages': '🗣️', 'astronomy': '🔭', 'history': '📜', 'science': '🔬', 'technology': '📱', 'baking': '🍰'
};
const hobbyEmojis = { ...interestEmojis, 'reading': '📖', 'sports': '🏅', 'technology': '💻', 'science': '🔬', 'fashion': '👗', 'other': '🔍' };
const volunteerAreaEmojis = { 'publicity': '📢', 'health': '🏥', 'eater': '🍽️', 'teaching': '👨‍🏫', 'high-tech': '💻', 'tourism': '🗺️', 'safety': '🛡️', 'funds': '💰', 'special-treat': '🎉', 'craftsmanship': '🔨', 'aaliyah': '✈️', 'culture': '🎭' };

const Section = ({ icon, title, children }) => (
  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
    <div className="flex items-center mb-4">
      <span className="text-2xl mr-2">{icon}</span>
      <h3 className="text-xl font-bold">{title}</h3>
    </div>
    <div>{children}</div>
  </div>
);

const InfoRow = ({ icon, label, value }) => (
  value ? (
    <div className="flex items-center mb-2 text-gray-700">
      <span className="mr-2 text-lg">{icon}</span>
      <span className="font-semibold mr-1">{label}:</span>
      <span>{value}</span>
    </div>
  ) : null
);

const ListRow = ({ icon, label, items, emojiMap }) => (
  items && items.length > 0 ? (
    <div className="flex items-center mb-2 text-gray-700 flex-wrap">
      <span className="mr-2 text-lg">{icon}</span>
      <span className="font-semibold mr-1">{label}:</span>
      {items.map((item, idx) => (
        <span key={item+idx} className="mr-2 flex items-center">
          {emojiMap && emojiMap[item] && <span className="mr-1">{emojiMap[item]}</span>}{item}
        </span>
      ))}
    </div>
  ) : null
);

const ProfileDetails = ({ retireeData }) => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const currentUserId = auth.currentUser?.uid;
  const isOwnProfile = retireeData?.id === currentUserId;
  
  console.log('language:', language);
  if (!retireeData) return <div>{t('common.loading')}</div>;

  const idv = retireeData.idVerification || {};
  const creds = retireeData.credentials || {};
  const personal = retireeData.personalDetails || {};
  const work = retireeData.workBackground || {};
  const lifestyle = retireeData.lifestyle || {};
  const veterans = retireeData.veteransCommunity || {};

  const handleEditProfile = () => {
    if (isOwnProfile) {
      navigate('/edit-signup-data');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center mb-8">
        <img
          src={retireeData.profilePicture || profile}
          alt="Profile"
          className="w-28 h-28 rounded-full object-cover mb-4 sm:mb-0 sm:mr-6 border-4 border-yellow-200"
        />
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className={`text-2xl sm:text-3xl font-bold ${language === 'he' ? 'text-right' : 'text-left'}`}>
              {creds.username}
            </h2>
            {/* Show edit button only for own profile */}
            {isOwnProfile && (
              <button
                onClick={handleEditProfile}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors border border-transparent hover:border-blue-200"
                title={t('viewProfile.editProfile')}
              >
                <FaEdit className="text-sm" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start text-gray-600">
            <InfoRow icon={<FaBirthdayCake />} label={t('viewProfile.profileHeader.age')} value={idv.age} />
            <InfoRow icon={<FaTransgender />} label={t('viewProfile.profileHeader.gender')} value={idv.gender ? t(`gender.${idv.gender.toLowerCase().replace(/\s+/g, '-')}`, idv.gender) : undefined} />
            <InfoRow icon={<FaMapMarkerAlt />} label={t('viewProfile.profileHeader.settlement')} value={idv.settlement} />
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <Section icon={<FaUser />} title={t('viewProfile.personalInfo.title')}>
        <InfoRow icon={<FaIdCard />} label={t('viewProfile.personalInfo.idNumber')} value={idv.idNumber} />
        <InfoRow icon={<FaEnvelope />} label={t('viewProfile.personalInfo.email')} value={idv.email || creds.email} />
        <InfoRow icon={<FaPhone />} label={t('viewProfile.personalInfo.phone')} value={idv.phoneNumber} />
        <InfoRow icon={<FaHome />} label={t('viewProfile.personalInfo.address')} value={personal.address} />
        <InfoRow icon={<FaBook />} label={t('viewProfile.personalInfo.maritalStatus')} value={personal.maritalStatus ? t(`maritalStatus.${personal.maritalStatus.toLowerCase()}`, personal.maritalStatus) : undefined} />
        <InfoRow icon={<FaGraduationCap />} label={t('viewProfile.personalInfo.education')} value={personal.education} />
        <InfoRow icon={<FaLanguage />} label={t('viewProfile.personalInfo.nativeLanguage')} value={personal.nativeLanguage} />
        <InfoRow icon={<FaGlobe />} label={t('viewProfile.personalInfo.originCountry')} value={personal.originCountry ? t(`countries.${personal.originCountry}`, personal.originCountry) : undefined} />
      </Section>

      {/* Credentials */}
      <Section icon={<BsFillPersonLinesFill />} title={t('viewProfile.credentials.title')}>
        <InfoRow icon={<FaUser />} label={t('viewProfile.credentials.username')} value={creds.username} />
        <InfoRow icon={<FaEnvelope />} label={t('viewProfile.credentials.email')} value={creds.email} />
      </Section>

      {/* Work Background */}
      <Section icon={<MdWork />} title={t('viewProfile.workBackground.title')}>
        <InfoRow icon={<FaBriefcase />} label={t('viewProfile.workBackground.jobTitle')} value={work.customJobInfo?.originalSelection?.jobTitle} />
        <InfoRow icon={<FaStar />} label={t('viewProfile.workBackground.industry')} value={work.customJobInfo?.originalSelection?.industry ? t(`industries.${work.customJobInfo?.originalSelection?.industry}`, work.customJobInfo?.originalSelection?.industry) : undefined} />
        <InfoRow icon={<GiSkills />} label={t('viewProfile.workBackground.yearsOfExperience')} value={work.yearsOfExperience} />
        <InfoRow icon={<FaCheck />} label={t('viewProfile.workBackground.retired')} value={work.retired ? t('common.yes') : work.retired === false ? t('common.no') : undefined} />
        <InfoRow icon={<FaBook />} label={t('viewProfile.workBackground.professionalBackground')} value={work.professionalBackground} />
      </Section>

      {/* Lifestyle */}
      <Section icon={<GiPartyPopper />} title={t('viewProfile.lifestyle.title')}>
        <ListRow icon={<FaBook />} label={t('viewProfile.lifestyle.hobbies')} items={lifestyle.hobbies && lifestyle.hobbies.map(hobby => t(`hobbies.${hobby}`, hobby))} emojiMap={hobbyEmojis} />
        <ListRow icon={<FaStar />} label={t('viewProfile.lifestyle.interests')} items={lifestyle.interests && lifestyle.interests.map(interest => t(`interests.${interest}`, interest))} emojiMap={interestEmojis} />
        <ListRow icon={<FaLanguage />} label={t('viewProfile.lifestyle.languagesSpoken')} items={lifestyle.languages} />
        <InfoRow icon={<FaLaptop />} label={t('viewProfile.lifestyle.computerAbility')} value={lifestyle.computerAbility} />
        <InfoRow icon={<FaUsers />} label={t('viewProfile.lifestyle.sportActivityLevel')} value={lifestyle.sportActivity} />
        <InfoRow icon={<FaCalendarAlt />} label={t('viewProfile.lifestyle.weeklyScheduleOccupancy')} value={lifestyle.weeklySchedule} />
      </Section>

      {/* Volunteering & Veterans Community */}
      <Section icon={<MdVolunteerActivism />} title={t('viewProfile.volunteering.title')}>
        <ListRow icon={<FaHeart />} label={t('viewProfile.volunteering.currentActivities')} items={veterans.currentActivities} />
        <InfoRow icon={<FaBook />} label={t('viewProfile.volunteering.notParticipatingReason')} value={veterans.notParticipatingReason} />
        <InfoRow icon={<FaCheck />} label={t('viewProfile.volunteering.isVolunteer')} value={veterans.isVolunteer ? t('common.yes') : veterans.isVolunteer === false ? t('common.no') : undefined} />
        <ListRow icon={<FaUsers />} label={t('viewProfile.volunteering.volunteerAreas')} items={veterans.volunteerAreas && veterans.volunteerAreas.map(area => t(`volunteerAreas.${area.toLowerCase().replace(/\s+/g, '-')}`, area))} emojiMap={volunteerAreaEmojis} />
        <InfoRow icon={<FaClock />} label={t('viewProfile.volunteering.volunteerFrequency')} value={veterans.volunteerFrequency ? t(`volunteerFrequency.${veterans.volunteerFrequency}`, veterans.volunteerFrequency) : undefined} />
        <InfoRow icon={<FaClock />} label={t('viewProfile.volunteering.volunteerHours')} value={veterans.volunteerHours ? t(`volunteerHours.${veterans.volunteerHours}`, veterans.volunteerHours) : undefined} />
        <ListRow icon={<FaCalendarAlt />} label={t('viewProfile.volunteering.volunteerDays')} items={veterans.volunteerDays && veterans.volunteerDays.map(day => t(`days.${day.toLowerCase().replace(/\s+/g, '-')}`, day))} />
        <InfoRow icon={<FaCheck />} label={t('viewProfile.volunteering.additionalVolunteering')} value={veterans.additionalVolunteering ? t('common.yes') : veterans.additionalVolunteering === false ? t('common.no') : undefined} />
        <ListRow icon={<FaUsers />} label={t('viewProfile.volunteering.additionalVolunteerFields')} items={veterans.additionalVolunteerFields && veterans.additionalVolunteerFields.map(area => t(`volunteerAreas.${area.toLowerCase().replace(/\s+/g, '-')}`, area))} />
        <InfoRow icon={<FaClock />} label={t('viewProfile.volunteering.additionalVolunteerFrequency')} value={veterans.additionalVolunteerFrequency ? t(`volunteerFrequency.${veterans.additionalVolunteerFrequency}`, veterans.additionalVolunteerFrequency) : undefined} />
        <InfoRow icon={<FaClock />} label={t('viewProfile.volunteering.additionalVolunteerHours')} value={veterans.additionalVolunteerHours ? t(`volunteerHours.${veterans.additionalVolunteerHours}`, veterans.additionalVolunteerHours) : undefined} />
        <ListRow icon={<FaCalendarAlt />} label={t('viewProfile.volunteering.additionalVolunteerDays')} items={veterans.additionalVolunteerDays && veterans.additionalVolunteerDays.map(day => t(`days.${day.toLowerCase().replace(/\s+/g, '-')}`, day))} />
        <InfoRow icon={<FaCheck />} label={t('viewProfile.volunteering.needsConsultation')} value={veterans.needsConsultation ? t('common.yes') : veterans.needsConsultation === false ? t('common.no') : undefined} />
        <ListRow icon={<FaUsers />} label={t('viewProfile.volunteering.consultationFields')} items={veterans.consultationFields && veterans.consultationFields.map(field => t(`consultationFields.${field}`, field))} />
        <InfoRow icon={<FaMapMarkerAlt />} label={t('viewProfile.volunteering.communitySettlement')} value={veterans.settlement} />
        <InfoRow icon={<FaBook />} label={t('viewProfile.volunteering.communityProfessionalBackground')} value={veterans.professionalBackground} />
      </Section>

      {/* System Info */}
      <Section icon={<FaInfoCircle />} title={t('viewProfile.systemInfo.title')}>
        <InfoRow icon={<FaCheck />} label={t('viewProfile.systemInfo.role')} value={retireeData.role ? t(`roles.${retireeData.role.toLowerCase().replace(/\s+/g, '-')}`, retireeData.role) : undefined} />
        <InfoRow icon={<FaCalendarAlt />} label={t('viewProfile.systemInfo.joined')} value={retireeData.createdAt && new Date(retireeData.createdAt).toLocaleDateString()} />
        <InfoRow icon={<FaCalendarAlt />} label={t('viewProfile.systemInfo.lastLogin')} value={retireeData.lastLogin && new Date(retireeData.lastLogin).toLocaleDateString()} />
      </Section>
    </div>
  );
};

export default ProfileDetails;