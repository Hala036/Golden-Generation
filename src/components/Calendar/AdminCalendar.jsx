import React from 'react';
import BaseCalendar from './BaseCalendar';
import AdminEventDetails from '../AdminProfile/AdminEventDetails';
import CreateEventForm from './CreateEventForm';
import { useAuth } from '../../hooks/useAuth';

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