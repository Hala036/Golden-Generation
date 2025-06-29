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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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
    // This function is now only for the final deletion
    try {
      const participantsSnapshot = await getDocs(collection(db, `events/${event.id}/participants`));
      const batch = writeBatch(db);
      participantsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      const eventRef = doc(db, 'events', event.id);
      batch.delete(eventRef);

      await batch.commit();
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event.');
    }
  };

  const handleInitialDeleteClick = () => {
    setIsConfirmingDelete(true);
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
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
      />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
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
