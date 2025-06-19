import React from 'react';
import BaseEventDetails from './BaseEventDetails';

const RetireeEventDetails = ({ event, onClose }) => {
  return (
    <BaseEventDetails
      event={event}
      onClose={onClose}
      userRole="retiree"
      showParticipants={true}
      showJoinLeave={true}
    />
  );
};

export default RetireeEventDetails; 