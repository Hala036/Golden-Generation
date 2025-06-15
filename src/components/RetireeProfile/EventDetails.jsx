import React, { useEffect, useState } from 'react';
import { auth } from '../../firebase';
import { joinEvent, leaveEvent, getEventParticipants } from '../../utils/participants';
import { FaTimes, FaUserPlus, FaUserMinus, FaUsers } from 'react-icons/fa';

const EventDetails = ({ event, onClose }) => {
  const [participants, setParticipants] = useState([]);
  const currentUser = auth.currentUser;

  const isJoined = participants.some(p => p.uid === currentUser?.uid);

  const handleJoin = async () => {
    if (!currentUser) return;
    await joinEvent(event.id, currentUser.uid, 'pending');
    loadParticipants();
  };

  const handleLeave = async () => {
    if (!currentUser) return;
    await leaveEvent(event.id, currentUser.uid);
    loadParticipants();
  };

  const loadParticipants = async () => {
    if (!event?.id) return;
    const data = await getEventParticipants(event.id);
    setParticipants(data);
  };

  useEffect(() => {
    loadParticipants();
  }, [event?.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          <FaTimes />
        </button>

        <h2 className="text-xl font-bold mb-2">{event.title}</h2>
        <p className="text-gray-700"><strong>Date:</strong> {event.date} at {event.time}</p>
        <p className="text-gray-700"><strong>Location:</strong> {event.location}</p>
        <p className="text-gray-700"><strong>Description:</strong> {event.description}</p>
        <p className="text-gray-600 mt-4 mb-4 flex items-center gap-2">
          <FaUsers /> {participants.length}/{event.maxParticipants} participants
        </p>

        {isJoined ? (
          <button
            onClick={handleLeave}
            className="bg-red-500 text-white py-2 px-4 rounded-md flex items-center gap-2"
          >
            <FaUserMinus /> Leave Event
          </button>
        ) : (
          <button
            onClick={handleJoin}
            className="bg-green-600 text-white py-2 px-4 rounded-md flex items-center gap-2"
          >
            <FaUserPlus /> Join Event
          </button>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
