import React from 'react';
import BaseCalendar from './BaseCalendar';
import CreateEventForm from './CreateEventForm';
import RetireeEventDetails from './RetireeEventDetails';

const RetireeCalendar = () => {
  const handleCreateEvent = ({ onClose }) => {
    return <CreateEventForm onClose={onClose} userRole="retiree" />;
  };

  return (
    <BaseCalendar
      userRole="retiree"
      eventDetailsComponent={RetireeEventDetails}
      onCreateEvent={handleCreateEvent}
      showCreateButton={true}
    />
  );
};

export default RetireeCalendar; 