import React from 'react';
import { FaCheckCircle, FaMinusCircle, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const SettlementCard = ({
  settlement,
  isAvailable,
  adminInfo,
  onClick,
  onDisable,
}) => (
  <div
    className={`p-4 border rounded-xl shadow transition transform hover:scale-105 hover:shadow-lg cursor-pointer
      ${isAvailable ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-200'}`}
    onClick={onClick}
    tabIndex={0}
    role="button"
    aria-label={`Settlement ${settlement}`}
    onKeyPress={e => { if (e.key === 'Enter') onClick && onClick(); }}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <FaMapMarkerAlt className="text-yellow-500 text-xl" />
        <div className="flex flex-col ml-2">
          <span className="font-bold text-2xl leading-6">{settlement && settlement.split(' ')[0]}</span>
          <span className="font-bold text-xl text-gray-700 leading-5">{settlement && settlement.split(' ').slice(1).join(' ')}</span>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1
        ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}
      >
        {isAvailable ? <FaCheckCircle className="text-green-500" /> : <FaMinusCircle className="text-gray-400" />}
        {isAvailable ? 'Available' : 'Disabled'}
      </span>
    </div>
    <hr className="my-2 border-blue-100" />
    <div className="flex flex-col gap-2 text-base mt-2">
      <div className="flex items-center gap-2 text-blue-700 font-semibold">
        <FaUser className="text-blue-400" />
        {adminInfo && adminInfo.username ? adminInfo.username : '-'}
      </div>
      <div className="flex items-center gap-2 text-blue-600">
        <FaEnvelope className="text-blue-300" />
        {adminInfo && adminInfo.email ? (
          <a href={`mailto:${adminInfo.email}`} className="hover:underline break-all">{adminInfo.email}</a>
        ) : '-'}
      </div>
      <div className="flex items-center gap-2 text-blue-600">
        <FaPhone className="text-blue-300" />
        {adminInfo && adminInfo.phone ? (
          <a href={`tel:${adminInfo.phone}`} className="hover:underline">{adminInfo.phone}</a>
        ) : '-'}
      </div>
    </div>
    {isAvailable && onDisable && (
      <button
        onClick={e => { e.stopPropagation(); onDisable(); }}
        className="mt-4 px-4 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200 text-base font-semibold w-full"
        aria-label="Disable settlement"
      >
        Disable
      </button>
    )}
  </div>
);

export default SettlementCard; 