import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { doc, deleteDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { FaTrash, FaEdit } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';
import BaseEventDetails from './BaseEventDetails';
import CreateEventForm from './CreateEventForm';

const RetireeEventDetails = ({ event, onClose }) => {
  const { currentUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if the current user is the creator of the event
  const isCreator = event.createdBy === currentUser?.uid;

  // Helper to convert date format for the form
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
    if (window.confirm('Are you sure you want to delete your event? This cannot be undone.')) {
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
        userRole="retiree"
        showParticipants={true}
        // Only show Join/Leave if the user is NOT the creator
        showJoinLeave={!isCreator}
      />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <CreateEventForm
              onClose={() => setShowEditModal(false)}
              userRole="retiree" // Pass retiree role
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

export default RetireeEventDetails; 