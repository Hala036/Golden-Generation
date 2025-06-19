import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { getEventParticipants, leaveEvent, joinEvent } from '../../utils/participants';
import { collection, onSnapshot } from 'firebase/firestore';
import { FaTimes, FaUsers, FaUser, FaCheck } from 'react-icons/fa';

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">{event.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        {/* Event Details */}
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="font-semibold">Date & Time:</h3>
            <p>
              {event.startDate || event.date} 
              {event.endDate && event.endDate !== (event.startDate || event.date) && ` - ${event.endDate}`}
            </p>
            {event.timeFrom && (
              <p className="text-sm text-gray-600">
                From {event.timeFrom} {event.timeTo && `to ${event.timeTo}`}
              </p>
            )}
          </div>
          <div>
            <h3 className="font-semibold">Location:</h3>
            <p>{event.location}</p>
          </div>
          <div>
            <h3 className="font-semibold">Description:</h3>
            <p>{event.description}</p>
          </div>
          
          {/* Participants Section */}
          {showParticipants && (
            <div>
              <h3 className="font-semibold mb-2">
                Participants ({participants.length}/{event.maxParticipants || event.capacity})
              </h3>
              
              {userRole === 'admin' ? (
                /* Admin View: Detailed participant list with controls */
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {participants.map(p => (
                    <li key={p.uid} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                      <span className="flex items-center gap-2">
                        <FaUser className="text-gray-600" />
                        <span>{p.name || p.uid}</span>
                        <span className={`text-sm px-2 py-0.5 rounded ${
                          p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          p.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {p.status}
                        </span>
                      </span>
                      {p.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onApproveParticipant?.(p.uid)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => onRejectParticipant?.(p.uid)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                /* Retiree View: Simple participant count */
                <p className="flex items-center gap-2">
                  <FaUsers />
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          {showJoinLeave && userRole === 'retiree' && (
            <button
              onClick={isJoined ? handleLeave : handleJoin}
              className={`px-4 py-2 rounded ${
                isJoined
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isJoined ? 'Leave Event' : 'Join Event'}
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseEventDetails; 