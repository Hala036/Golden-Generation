import React, { useContext } from 'react';
import BaseEventDetails from '../Calendar/BaseEventDetails';
import { FaUserPlus, FaUserMinus } from 'react-icons/fa';
import { UserContext } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';

const EventDetails = ({ event, onClose }) => {
  const { userData } = useContext(UserContext);
  return (
    <BaseEventDetails
      event={event}
      onClose={onClose}
      userRole={userData?.role || 'retiree'}
      showParticipants={true}
      showJoinLeave={true}
    />
  );
};

export default EventDetails;
