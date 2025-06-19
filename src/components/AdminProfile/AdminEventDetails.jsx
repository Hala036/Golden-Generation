//AdminEventDetails.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { leaveEvent } from '../../utils/participants';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { FaCheck, FaTimes, FaUser, FaTrash, FaEdit } from 'react-icons/fa';
import BaseEventDetails from '../Calendar/BaseEventDetails';
import CreateEventForm from '../Calendar/CreateEventForm';

const AdminEventDetails = ({ event, onClose }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(event);

  const handleApprove = async (uid) => {
    await updateDoc(doc(db, `events/${event.id}/participants`, uid), {
      status: 'confirmed',
    });
  };

  const handleReject = async (uid) => {
    await leaveEvent(event.id, uid);
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

  // Keep editData in sync with event when modal opens
  useEffect(() => {
    if (showEditModal) {
      setEditData(event);
    }
  }, [showEditModal, event]);

  return (
    <>
      <BaseEventDetails
        event={event}
        onClose={onClose}
        userRole="admin"
        showParticipants={true}
        showJoinLeave={false}
        onApproveParticipant={handleApprove}
        onRejectParticipant={handleReject}
      >
        {/* Admin Controls */}
        <div className="flex gap-3">
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
      </BaseEventDetails>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <CreateEventForm
              onClose={() => setShowEditModal(false)}
              userRole="admin"
              initialData={editData}
              isEditing={true}
              eventId={event.id}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminEventDetails;
