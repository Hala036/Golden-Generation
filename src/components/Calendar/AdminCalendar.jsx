import React, { useState, useEffect } from 'react';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUsers, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import BaseCalendar from './BaseCalendar';
import AdminEventDetails from '../AdminProfile/AdminEventDetails';
import CreateEventForm from './CreateEventForm';

const AdminCalendar = () => {
  const { currentUser } = useAuth();

  const handleCreateEvent = ({ onClose }) => {
    return <CreateEventForm onClose={onClose} userRole="admin" />;
  };

  return (
    <BaseCalendar
      userRole="admin"
      eventDetailsComponent={AdminEventDetails}
      onCreateEvent={handleCreateEvent}
      showCreateButton={true}
      additionalFilters={[
        <option key="settlement" value="settlement">My Settlement</option>
      ]}
    />
  );
};

export default AdminCalendar; 