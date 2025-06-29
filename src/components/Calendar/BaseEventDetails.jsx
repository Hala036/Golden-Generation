import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { getEventParticipants, leaveEvent, joinEvent } from '../../utils/participants';
import { collection, onSnapshot } from 'firebase/firestore';
import { FaTimes, FaUsers, FaUser, FaCheck, FaCalendarAlt, FaClock, FaMapPin, FaInfoCircle } from 'react-icons/fa';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

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
  const [participants, setParticipants] = useState([]);
  const currentUser = auth.currentUser;
  const { t } = useTranslation();

  const isJoined = participants.some(p => p.uid === currentUser?.uid);

  const loadParticipants = async () => {
    const participantsList = await getEventParticipants(event.id);
    setParticipants(participantsList);
  };

  useEffect(() => {
    loadParticipants();
  }, [event.id]);

  const handleJoin = async () => {
    if (!currentUser) return;
    await joinEvent(event.id, currentUser.uid);
    loadParticipants();
  };

  const handleLeave = async () => {
    if (!currentUser) return;
    await leaveEvent(event.id, currentUser.uid);
    loadParticipants();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'E, d MMM yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-gray-800">{event.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" title={t('calendar.etails.close')}>
            <FaTimes size={24}/>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-grow overflow-y-auto pr-2">
          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
            <div className="flex items-start">
              <FaCalendarAlt className="text-gray-400 mt-1 mr-3 flex-shrink-0" size={20}/>
              <div>
                <h3 className="font-semibold text-gray-700">{t('calendar.eventDetails.date')}</h3>
                <p className="text-gray-600">
                  {formatDate(event.startDate || event.date)}
                  {event.endDate && event.endDate !== (event.startDate || event.date) && ` - ${formatDate(event.endDate)}`}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <FaClock className="text-gray-400 mt-1 mr-3 flex-shrink-0" size={20}/>
              <div>
                <h3 className="font-semibold text-gray-700">{t('calendar.eventDetails.time')}</h3>
                {event.timeFrom ? (
                  <p className="text-gray-600">
                    {t('calendar.eventDetails.from')} {event.timeFrom} {event.timeTo && `${t('calendar.eventDetails.to')} ${event.timeTo}`}
                  </p>
                ) : <p className="text-gray-500 italic">{t('calendar.etails.notSpecified')}</p>}
              </div>
            </div>

            <div className="flex items-start col-span-1 md:col-span-2">
              <FaMapPin className="text-gray-400 mt-1 mr-3 flex-shrink-0" size={20}/>
              <div>
                <h3 className="font-semibold text-gray-700">{t('calendar.eventDetails.location')}</h3>
                <p className="text-gray-600">{event.location || t('calendar.eventDetails.notAvailable')}</p>
              </div>
            </div>

            <div className="flex items-start col-span-1 md:col-span-2">
              <FaInfoCircle className="text-gray-400 mt-1 mr-3 flex-shrink-0" size={20}/>
              <div>
                <h3 className="font-semibold text-gray-700">{t('calendar.eventDetails.description')}</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{event.description || t('calendar.eventDetails.noDescription')}</p>
              </div>
            </div>
          </div>
          
          {/* Participants Section */}
          {showParticipants && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                <FaUsers className="text-gray-400 mr-3" size={20}/>
                {t('calendar.eventDetails.participants')} ({participants.length}/{event.maxParticipants || event.capacity || '∞'})
              </h3>
              
              {userRole === 'admin' ? (
                /* Admin View: Detailed participant list with controls */
                <ul className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 p-2 rounded-lg">
                  {participants.length > 0 ? participants.map(p => (
                    <li key={p.uid} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                      <span className="flex items-center gap-2">
                        <FaUser className="text-gray-500" />
                        <span className="font-medium text-gray-700">{p.name || p.uid}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          p.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {t(`calendar.eventDetails.status.${p.status}`)}
                        </span>
                      </span>
                      {p.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onApproveParticipant?.(p.uid)}
                            className="p-1 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                            title={t('calendar.eventDetails.approve')}
                          >
                            <FaCheck size={14}/>
                          </button>
                          <button
                            onClick={() => onRejectParticipant?.(p.uid)}
                            className="p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                            title={t('calendar.eventDetails.reject')}
                          >
                            <FaTimes size={14}/>
                          </button>
                        </div>
                      )}
                    </li>
                  )) : (
                    <p className="text-center text-gray-500 italic p-4">{t('calendar.etails.noParticipants')}</p>
                  )}
                </ul>
              ) : (
                /* Retiree View: Simple participant count */
                <p className="flex items-center gap-2 text-gray-600">
                  <FaUsers />
                  {t('calendar.eventDetails.joinedCount', { count: participants.length })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          {showJoinLeave && userRole === 'retiree' && (
            <button
              onClick={isJoined ? handleLeave : handleJoin}
              className={`px-4 py-2 rounded ${
                isJoined
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isJoined ? t('calendar.leaveEvent') : t('calendar.joinEvent')}
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseEventDetails; 