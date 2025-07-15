import React from 'react';
import BaseCalendar from './BaseCalendar';
import AdminEventDetails from '../AdminProfile/AdminEventDetails';
import CreateEventForm from './CreateEventForm';

const SuperAdminCalendar = () => {
  const handleCreateEvent = ({ onClose }) => {
    return <CreateEventForm onClose={onClose} userRole="superadmin" />;
  };

  return (
    <BaseCalendar
      userRole="superadmin"
      eventDetailsComponent={AdminEventDetails}
      onCreateEvent={handleCreateEvent}
      showCreateButton={true}
    />
  );
};

export default SuperAdminCalendar; 