import React from 'react';
import BaseEventDetails from '../Calendar/BaseEventDetails';
import { FaUserPlus, FaUserMinus } from 'react-icons/fa';

const EventDetails = ({ event, onClose }) => {
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

export default EventDetails;
