import React from "react";
import { FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaTransgender, FaIdCard, FaMapMarkerAlt, FaHome, FaBook, FaGraduationCap, FaGlobe, FaBriefcase, FaStar, FaCheck, FaClock, FaCalendarAlt, FaUsers, FaHeart, FaLanguage, FaLaptop, FaInfoCircle } from "react-icons/fa";
import { MdWork, MdVolunteerActivism } from "react-icons/md";
import { GiSkills, GiPartyPopper } from "react-icons/gi";
import { BsFillPersonLinesFill } from "react-icons/bs";
import profile from "../../assets/profile.jpeg";

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
  if (!retireeData) return <div>Loading...</div>;
  const idv = retireeData.idVerification || {};
  const creds = retireeData.credentials || {};
  const personal = retireeData.personalDetails || {};
  const work = retireeData.workBackground || {};
  const lifestyle = retireeData.lifestyle || {};
  const veterans = retireeData.veteransCommunity || {};

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Profile Header */}
      <div className="flex items-center mb-8">
        <img src={retireeData.profilePicture || profile} alt="Profile" className="w-28 h-28 rounded-full object-cover mr-6 border-4 border-yellow-200" />
        <div>
          <h2 className="text-3xl font-bold mb-1">{idv.firstName} {idv.lastName}</h2>
          <div className="flex flex-wrap items-center text-gray-600">
            <InfoRow icon={<FaBirthdayCake />} label="Age" value={idv.age} />
            <InfoRow icon={<FaTransgender />} label="Gender" value={idv.gender} />
            <InfoRow icon={<FaMapMarkerAlt />} label="Settlement" value={idv.settlement} />
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <Section icon={<FaUser />} title="Personal Information">
        <InfoRow icon={<FaIdCard />} label="ID Number" value={idv.idNumber} />
        <InfoRow icon={<FaEnvelope />} label="Email" value={idv.email || creds.email} />
        <InfoRow icon={<FaPhone />} label="Phone" value={idv.phoneNumber} />
        <InfoRow icon={<FaHome />} label="Address" value={personal.address} />
        <InfoRow icon={<FaBook />} label="Marital Status" value={personal.maritalStatus} />
        <InfoRow icon={<FaGraduationCap />} label="Education" value={personal.education} />
        <InfoRow icon={<FaLanguage />} label="Native Language" value={personal.nativeLanguage} />
        <InfoRow icon={<FaGlobe />} label="Origin Country" value={personal.originCountry} />
      </Section>

      {/* Credentials */}
      <Section icon={<BsFillPersonLinesFill />} title="Credentials">
        <InfoRow icon={<FaUser />} label="Username" value={creds.username} />
        <InfoRow icon={<FaEnvelope />} label="Email" value={creds.email} />
      </Section>

      {/* Work Background */}
      <Section icon={<MdWork />} title="Work Background">
        <InfoRow icon={<FaBriefcase />} label="Job Title" value={work.customJobInfo?.originalSelection?.jobTitle} />
        <InfoRow icon={<FaStar />} label="Industry" value={work.customJobInfo?.originalSelection?.industry} />
        <InfoRow icon={<GiSkills />} label="Years of Experience" value={work.yearsOfExperience} />
        <InfoRow icon={<FaCheck />} label="Retired" value={work.retired ? "Yes" : work.retired === false ? "No" : undefined} />
        <InfoRow icon={<FaBook />} label="Professional Background" value={work.professionalBackground} />
      </Section>

      {/* Lifestyle */}
      <Section icon={<GiPartyPopper />} title="Lifestyle">
        <ListRow icon={<FaBook />} label="Hobbies" items={lifestyle.hobbies} emojiMap={hobbyEmojis} />
        <ListRow icon={<FaStar />} label="Interests" items={lifestyle.interests} emojiMap={interestEmojis} />
        <ListRow icon={<FaLanguage />} label="Languages Spoken" items={lifestyle.languages} />
        <InfoRow icon={<FaLaptop />} label="Computer Ability" value={lifestyle.computerAbility} />
        <InfoRow icon={<FaUsers />} label="Sport Activity Level" value={lifestyle.sportActivity} />
        <InfoRow icon={<FaCalendarAlt />} label="Weekly Schedule Occupancy" value={lifestyle.weeklySchedule} />
      </Section>

      {/* Volunteering & Veterans Community */}
      <Section icon={<MdVolunteerActivism />} title="Volunteering & Community">
        <ListRow icon={<FaHeart />} label="Current Activities" items={veterans.currentActivities} />
        <InfoRow icon={<FaBook />} label="Not Participating Reason" value={veterans.notParticipatingReason} />
        <InfoRow icon={<FaCheck />} label="Is Volunteer" value={veterans.isVolunteer ? "Yes" : veterans.isVolunteer === false ? "No" : undefined} />
        <ListRow icon={<FaUsers />} label="Volunteer Areas" items={veterans.volunteerAreas} emojiMap={volunteerAreaEmojis} />
        <InfoRow icon={<FaClock />} label="Volunteer Frequency" value={veterans.volunteerFrequency} />
        <InfoRow icon={<FaClock />} label="Volunteer Hours" value={veterans.volunteerHours} />
        <ListRow icon={<FaCalendarAlt />} label="Volunteer Days" items={veterans.volunteerDays} />
        <InfoRow icon={<FaCheck />} label="Additional Volunteering" value={veterans.additionalVolunteering ? "Yes" : veterans.additionalVolunteering === false ? "No" : undefined} />
        <ListRow icon={<FaUsers />} label="Additional Volunteer Fields" items={veterans.additionalVolunteerFields} />
        <InfoRow icon={<FaClock />} label="Additional Volunteer Frequency" value={veterans.additionalVolunteerFrequency} />
        <InfoRow icon={<FaClock />} label="Additional Volunteer Hours" value={veterans.additionalVolunteerHours} />
        <ListRow icon={<FaCalendarAlt />} label="Additional Volunteer Days" items={veterans.additionalVolunteerDays} />
        <InfoRow icon={<FaCheck />} label="Needs Consultation" value={veterans.needsConsultation ? "Yes" : veterans.needsConsultation === false ? "No" : undefined} />
        <ListRow icon={<FaUsers />} label="Consultation Fields" items={veterans.consultationFields} />
        <InfoRow icon={<FaMapMarkerAlt />} label="Community Settlement" value={veterans.settlement} />
        <InfoRow icon={<FaBook />} label="Community Professional Background" value={veterans.professionalBackground} />
      </Section>

      {/* System Info */}
      <Section icon={<FaInfoCircle />} title="System Info">
        <InfoRow icon={<FaCheck />} label="Role" value={retireeData.role} />
        <InfoRow icon={<FaCalendarAlt />} label="Joined" value={retireeData.createdAt && new Date(retireeData.createdAt).toLocaleDateString()} />
        <InfoRow icon={<FaCalendarAlt />} label="Last Login" value={retireeData.lastLogin && new Date(retireeData.lastLogin).toLocaleDateString()} />
      </Section>
    </div>
  );
};

export default ProfileDetails;