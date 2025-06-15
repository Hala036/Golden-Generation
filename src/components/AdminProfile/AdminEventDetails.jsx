//AdminEventDetails.jsx


import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { getEventParticipants, leaveEvent } from '../../utils/participants';
import { updateDoc, doc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { FaCheck, FaTimes, FaUser, FaTrash, FaEdit } from 'react-icons/fa';

const AdminEventDetails = ({ event, onClose }) => {
  const [participants, setParticipants] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(event);

  // Real-time participants sync
  useEffect(() => {
    if (!event?.id) return;
    const unsub = onSnapshot(collection(db, 'events', event.id, 'participants'), (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push(doc.data());
      });
      setParticipants(data);
    });
    return () => unsub();
  }, [event?.id]);

  const handleApprove = async (uid) => {
    await updateDoc(doc(db, `events/${event.id}/participants`, uid), {
      status: 'confirmed',
    });
    loadParticipants();
  };

  const handleReject = async (uid) => {
    await leaveEvent(event.id, uid);
    loadParticipants();
  };

  const handleDeleteEvent = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this event?');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'events', event.id));
      onClose(); // Close modal
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      const ref = doc(db, 'events', event.id);
      // Only update fields that are editable by the admin
      const {
        title,
        description,
        date,
        time,
        duration,
        location,
        category,
        recurring,
        maxParticipants,
        status,
        color
      } = editData;
      await updateDoc(ref, {
        title,
        description,
        date,
        time,
        duration,
        location,
        category,
        recurring,
        maxParticipants,
        status,
        color
      });
      setShowEditModal(false);
      onClose(); // Refresh calendar
    } catch (err) {
      alert('Failed to update event: ' + err.message);
      console.error('Failed to update event:', err);
    }
  };

  // const loadParticipants = async () => {
  //   const data = await getEventParticipants(event.id);
  //   setParticipants(data);
  // };

  useEffect(() => {
    // loadParticipants();
  }, [event?.id]);

  // Keep editData in sync with event when modal opens
  useEffect(() => {
    if (showEditModal) {
      setEditData(event);
    }
  }, [showEditModal, event]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          <FaTimes />
        </button>

        <h2 className="text-xl font-bold mb-2">{event.title}</h2>
        <p className="text-gray-700"><strong>Date:</strong> {event.date} at {event.time}</p>
        <p className="text-gray-700"><strong>Location:</strong> {event.location}</p>
        <p className="text-gray-700 mb-4"><strong>Description:</strong> {event.description}</p>

        {/* Participants List */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Participants ({participants.length}/{event.maxParticipants})</h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {participants.map(p => (
              <li key={p.uid} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                <span className="flex items-center gap-2 text-sm text-gray-800">
                  <FaUser /> {p.uid}
                  <span className="text-xs px-2 py-1 rounded bg-gray-200">
                    {p.status}
                  </span>
                </span>
                {p.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(p.uid)} className="text-green-600 hover:text-green-800">
                      <FaCheck />
                    </button>
                    <button onClick={() => handleReject(p.uid)} className="text-red-500 hover:text-red-700">
                      <FaTimes />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Admin Controls */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaEdit /> Edit
          </button>
          <button
            onClick={handleDeleteEvent}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full relative">
            <h2 className="text-lg font-bold mb-4">Edit Event</h2>

            <input
              type="text"
              value={editData.title}
              onChange={(e) => handleEditChange('title', e.target.value)}
              placeholder="Title"
              className="w-full mb-2 border p-2 rounded"
            />

            <div className="flex gap-2 mb-2">
              <input
                type="date"
                value={editData.date}
                onChange={(e) => handleEditChange('date', e.target.value)}
                className="w-1/2 border p-2 rounded"
              />
              <input
                type="time"
                value={editData.time}
                onChange={(e) => handleEditChange('time', e.target.value)}
                className="w-1/2 border p-2 rounded"
              />
            </div>

            <input
              type="text"
              value={editData.location}
              onChange={(e) => handleEditChange('location', e.target.value)}
              placeholder="Location"
              className="w-full mb-2 border p-2 rounded"
            />

            <textarea
              value={editData.description}
              onChange={(e) => handleEditChange('description', e.target.value)}
              placeholder="Description"
              className="w-full mb-2 border p-2 rounded"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowEditModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
              <button onClick={handleSaveEdit} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventDetails;
