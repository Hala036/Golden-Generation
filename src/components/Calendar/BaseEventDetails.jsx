import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { getEventParticipants, leaveEvent, joinEvent } from '../../utils/participants';
import { doc, getDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { FaTimes, FaUsers, FaUser, FaCheck, FaCalendarAlt, FaClock, FaMapPin, FaInfoCircle, FaStar, FaTrash, FaEdit } from 'react-icons/fa';
import { format } from 'date-fns';
import CreateEventForm from './CreateEventForm';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const getInitials = (user) => {
  // Try to use first and last name for initials
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  if (user?.username) {
    const parts = user.username.split(' ');
    if (parts.length === 1) return user.username[0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return '?';
};

const BaseEventDetails = ({ 
  event, 
  onClose, 
  userRole = 'retiree',
  children = null,
  showParticipants = true,
  showJoinLeave = true,
  onApproveParticipant = null,
  onRejectParticipant = null
}) => {
  const { t } = useTranslation();
  const [participants, setParticipants] = useState([]);
  const [participantUsers, setParticipantUsers] = useState([]); // [{uid, username, ...}]
  const [loadingAction, setLoadingAction] = useState(false);
  const currentUser = auth.currentUser;
  const [showEditModal, setShowEditModal] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const navigate = useNavigate();
  const [loadingProfileUid, setLoadingProfileUid] = useState(null);

  const isJoined = participants.some(p => p.uid === currentUser?.uid);
  const isCreator = event.createdBy === currentUser?.uid;

  const loadParticipants = async () => {
    const participantsList = await getEventParticipants(event.id);
    setParticipants(participantsList);
    // Fetch user data for each participant (for admin/superadmin)
    if (participantsList.length > 0 && (userRole === 'admin' || userRole === 'superadmin')) {
      const userFetches = participantsList.map(async (p) => {
        const userDoc = await getDoc(doc(db, 'users', p.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        // Try to get full name from idVerification
        const idv = userData.idVerification || {};
        const firstName = idv.firstName || '';
        const lastName = idv.lastName || '';
        return {
          uid: p.uid,
          firstName,
          lastName,
          username: userData.credentials?.username || userData.username || p.uid,
          status: p.status || 'confirmed',
          isCreator: event.createdBy === p.uid,
        };
      });
      setParticipantUsers(await Promise.all(userFetches));
    } else {
      setParticipantUsers([]);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, [event.id]);

  const handleJoin = async () => {
    if (!currentUser) return;
    setLoadingAction(true);
    await joinEvent(event.id, currentUser.uid);
    await loadParticipants();
    setLoadingAction(false);
  };

  const handleLeave = async () => {
    if (!currentUser) return;
    setLoadingAction(true);
    await leaveEvent(event.id, currentUser.uid);
    await loadParticipants();
    setLoadingAction(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    let dateObj;
    // Parse DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      dateObj = new Date(year, month - 1, day);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Parse YYYY-MM-DD
      const [year, month, day] = dateString.split('-');
      dateObj = new Date(year, month - 1, day);
    } else {
      // Try native Date
      dateObj = new Date(dateString);
    }
    if (isNaN(dateObj)) return dateString;
    return format(dateObj, 'E, d MMM yyyy');
  };

  // Status badge color
  const statusColor = event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                     event.status === 'active' ? 'bg-green-100 text-green-800' : 
                     event.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                     'bg-gray-200 text-gray-700';

  const formatToYyyyMmDd = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm(t('calendar.eventDetails.deleteConfirm'))) return;
    try {
      const eventRef = doc(db, 'events', event.id);
      // Batch delete participants subcollection and the event itself
      const participantsSnapshot = await getDocs(collection(db, `events/${event.id}/participants`));
      const batch = writeBatch(db);
      participantsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      batch.delete(eventRef);
      await batch.commit();
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(t('eventDetails.deleteFailed'));
    }
  };

  // Handler to fetch full user data and navigate
  const handleParticipantClick = async (uid) => {
    setLoadingProfileUid(uid);
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = { id: uid, ...userDoc.data() };
        navigate('/view-profile', { state: { retireeData: userData } });
      } else {
        alert(t('eventDetails.profileNotFound'));
      }
    } catch (err) {
      alert(t('eventDetails.profileLoadFailed'));
    } finally {
      setLoadingProfileUid(null);
    }
  };

  const getStatusDisplayText = (status) => {
    const translationKey = `eventDetails.status.${status}`;
    const translated = t(translationKey);
    
    // If the translation returns the same key, it means the translation wasn't found
    if (translated === translationKey) {
      // Fallback to appropriate language based on current language setting
      const { language } = useLanguage();
      
      switch (status) {
        case 'rejected':
          return language === 'he' ? 'נדחה' : 
                 language === 'ar' ? 'مرفوض' : 
                 'Rejected';
        case 'pending':
          return language === 'he' ? 'ממתין' : 
                 language === 'ar' ? 'قيد الانتظار' : 
                 'Pending';
        case 'active':
          return language === 'he' ? 'פעיל' : 
                 language === 'ar' ? 'نشط' : 
                 'Active';
        case 'completed':
          return language === 'he' ? 'הושלם' : 
                 language === 'ar' ? 'مكتمل' : 
                 'Completed';
        case 'confirmed':
          return language === 'he' ? 'מאושר' : 
                 language === 'ar' ? 'مؤكد' : 
                 'Confirmed';
        default:
          return status.charAt(0).toUpperCase() + status.slice(1);
      }
    }
    
    return translated;
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-3xl w-full max-h-[95vh] flex flex-col focus:outline-none" tabIndex={0}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${statusColor} mr-2`} aria-label={`Status: ${event.status}`}>{getStatusDisplayText(event.status)}</span>
            {isCreator && (
              <span className="flex items-center px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300 mr-2 relative group cursor-pointer" tabIndex={0} aria-label="You are the creator of this event">
                <FaStar className="mr-1 text-yellow-400" />
                {t('eventDetails.createdByMe')}
                <span className="absolute left-0 top-full mt-1 w-max bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">{t('eventDetails.createdByMe')}</span>
              </span>
            )}
            <h2 className="text-3xl font-bold text-gray-800">{event.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close event details">
            <FaTimes size={24}/>
          </button>
        </div>

        {/* Main Content: Two columns */}
        <div className="flex flex-col md:flex-row flex-grow overflow-y-auto gap-8">
          {/* Left: Event Details */}
          <div className="flex-1 overflow-y-auto pr-2">
            {/* Event Image */}
            {event.imageUrl && (
              <div className="mb-6 flex justify-center">
                <img
                  src={event.imageUrl}
                  alt="Event"
                  className="rounded-xl border border-gray-200 shadow max-h-64 object-contain"
                />
              </div>
            )}
            {/* Event Details Grid */}
            <div className="grid grid-cols-1 gap-y-6 mb-6">
              <div className="flex items-start">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 mr-3"><FaCalendarAlt size={20}/></span>
                <div>
                  <h3 className="font-semibold text-gray-700">{t('eventDetails.date')}</h3>
                  <p className="text-gray-600">
                    {formatDate(event.startDate || event.date)}
                    {event.endDate && event.endDate !== (event.startDate || event.date) && ` - ${formatDate(event.endDate)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 mr-3"><FaClock size={20}/></span>
                <div>
                  <h3 className="font-semibold text-gray-700">{t('eventDetails.time')}</h3>
                  {event.timeFrom ? (
                    <p className="text-gray-600">
                      {t('eventDetails.from')} {event.timeFrom} {event.timeTo && `${t('eventDetails.to')} ${event.timeTo}`}                    </p>
                  ) : <p className="text-gray-500 italic">{t('eventDetails.notSpecified')}</p>}
                </div>
              </div>

              <div className="flex items-start">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 mr-3"><FaMapPin size={20}/></span>
                <div>
                  <h3 className="font-semibold text-gray-700">{t('eventDetails.location')}</h3>
                  <p className="text-gray-600">{event.location || t('eventDetails.notSpecified')}</p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 mr-3"><FaInfoCircle size={20}/></span>
                <div>
                  <h3 className="font-semibold text-gray-700">{t('eventDetails.description')}</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{event.description || t('eventDetails.noDescription')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Participants */}
          {showParticipants && (
            <div className="md:w-1/3 w-full mb-6 md:mb-0 md:order-last order-first">
              <div className="bg-gray-50 rounded-xl shadow p-4 h-full flex flex-col">
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                  <FaUsers className="text-gray-400 mr-3" size={20}/>
                  {t('eventDetails.participants')} ({participants.length}/{event.maxParticipants || event.capacity || '∞'})
                </h3>
                <div className="border-b border-gray-200 mb-2" />
                {userRole === 'admin' || userRole === 'superadmin' ? (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {participantUsers.length > 0 ? participantUsers.map(p => (
                      <li key={p.uid} className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm hover:bg-blue-50 transition group">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700 text-sm mr-2">
                          {getInitials(p)}
                        </div>
                        <span className="font-medium text-gray-700">
                          {/* Prefer full name, fallback to username or uid */}
                          {p.uid !== currentUser?.uid ? (
                            <button
                              className="hover:underline text-blue-700 bg-transparent border-none p-0 m-0 cursor-pointer font-medium"
                              style={{ background: 'none' }}
                              onClick={() => handleParticipantClick(p.uid)}
                              disabled={loadingProfileUid === p.uid}
                            >
                              {loadingProfileUid === p.uid ? t('eventDetails.loadingProfile') : (
                                p.firstName && p.lastName
                                  ? `${p.firstName} ${p.lastName}`
                                  : p.firstName
                                  ? p.firstName
                                  : p.username || p.uid
                              )}
                            </button>
                          ) : (
                            <>{p.firstName && p.lastName
                                ? `${p.firstName} ${p.lastName}`
                                : p.firstName
                                ? p.firstName
                                : p.username || p.uid}</>
                          )}
                          {p.uid === currentUser?.uid ? ` (${t('eventDetails.createdByMe')})` : ''}
                        </span>
                        {p.isCreator && (
                          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-300" title={t('eventDetails.creator')}>
                            {t('eventDetails.creator')}
                          </span>
                        )}
                        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          p.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {getStatusDisplayText(p.status)}
                        </span>
                      </li>
                    )) : (
                      <p className="text-center text-gray-500 italic p-4">{t('eventDetails.noParticipants')}</p>
                    )}
                  </ul>
                ) : (
                  <div>
                    <p className="flex items-center gap-2 text-gray-600 mt-2">
                      <FaUsers />
                      {participants.length} {t('eventDetails.participant', { count: participants.length })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col md:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          {/* Edit/Delete for creator, admin, or superadmin */}
          {(isCreator || userRole === 'admin' || userRole === 'superadmin') && (
            <>
              <button
                onClick={handleEdit}
                className="px-4 py-2 rounded font-semibold bg-yellow-500 hover:bg-yellow-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200 w-full md:w-auto"
                aria-label="Edit Event"
              >
                <FaEdit className="inline mr-2" /> {t('eventDetails.editEvent')}
              </button>
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 rounded font-semibold bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors duration-200 w-full md:w-auto"
                aria-label="Delete Event"
              >
                <FaTrash className="inline mr-2" /> {t('eventDetails.deleteEvent')}
              </button>
            </>
          )}
          {/* Join/Leave for other retirees */}
          {userRole === 'retiree' && !isCreator && (
            <button
              onClick={isJoined ? handleLeave : handleJoin}
              className={`px-4 py-2 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200 w-full md:w-auto ${
                isJoined
                  ? 'bg-red-600 hover:bg-red-700 text-white' : loadingAction
                  ? 'bg-green-400 text-white cursor-wait' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              aria-label={isJoined ? 'Leave Event' : 'Join Event'}
              disabled={loadingAction}
            >
              {loadingAction ? (
                <span className="flex items-center gap-2 justify-center"><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>{t('eventDetails.processing')}</span>
              ) : isJoined ? t('eventDetails.leaveEvent') : t('eventDetails.joinEvent')}
            </button>
          )}
        </div>
        {children}
      </div>
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white p-3 md:p-6 rounded-lg max-w-lg w-full">
            <CreateEventForm
              onClose={() => setShowEditModal(false)}
              userRole={userRole}
              initialData={{
                ...event,
                startDate: formatToYyyyMmDd(event.startDate),
                endDate: formatToYyyyMmDd(event.endDate),
              }}
              isEditing={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseEventDetails;