//AdminEventDetails.jsx

import React, { useState } from 'react';
import { db } from '../../firebase';
import { leaveEvent } from '../../utils/participants';
import { doc, deleteDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { FaCheck, FaTimes, FaUser, FaTrash, FaEdit } from 'react-icons/fa';
import BaseEventDetails from '../Calendar/BaseEventDetails';
import CreateEventForm from '../Calendar/CreateEventForm';

const AdminEventDetails = ({ event, onClose }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  // Helper function to convert DD-MM-YYYY to YYYY-MM-DD
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
    if (window.confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) {
      try {
        // First, we need to delete the participants subcollection.
        // (This is a simplified version; for very large numbers of participants,
        // a Cloud Function would be more robust).
        const participantsSnapshot = await getDocs(collection(db, `events/${event.id}/participants`));
        const batch = writeBatch(db);
        participantsSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        // Then, delete the main event document.
        const eventRef = doc(db, 'events', event.id);
        batch.delete(eventRef);

        await batch.commit();
        onClose(); // Close the modal
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event.');
    }
    }
  };

  return (
    <>
      <BaseEventDetails
        event={event}
        onClose={onClose}
        userRole="admin"
        showParticipants={true}
        showJoinLeave={false}
        onApproveParticipant={async (uid) => {
          const participantRef = doc(db, `events/${event.id}/participants`, uid);
          await updateDoc(participantRef, { status: 'confirmed' });
        }}
        onRejectParticipant={leaveEvent}
      >
        {/* Admin Controls */}
        <div className="flex gap-3">
          <button
            onClick={handleEdit}
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
    </>
  );
};

export default AdminEventDetails;
