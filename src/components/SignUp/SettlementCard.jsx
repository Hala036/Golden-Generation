import React from 'react';
import { FaCheckCircle, FaMinusCircle, FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';

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
      <h3 className="font-medium text-lg">{settlement}</h3>
      <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1
        ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}
      >
        {isAvailable ? <FaCheckCircle className="text-green-500" /> : <FaMinusCircle className="text-gray-400" />}
        {isAvailable ? 'Available' : 'Disabled'}
      </span>
    </div>
    {adminInfo && (
      <div className="mt-4 pt-3 border-t border-blue-100 flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-2 text-blue-700 font-semibold">
          <FaUser className="text-blue-400" />
          {adminInfo.username || '-'}
        </div>
        <div className="flex items-center gap-2 text-blue-600">
          <FaEnvelope className="text-blue-300" />
          <a href={`mailto:${adminInfo.email}`} className="hover:underline break-all">
            {adminInfo.email || '-'}
          </a>
        </div>
        <div className="flex items-center gap-2 text-blue-600">
          <FaPhone className="text-blue-300" />
          <a href={`tel:${adminInfo.phone}`} className="hover:underline">
            {adminInfo.phone || '-'}
          </a>
        </div>
      </div>
    )}
    {isAvailable && onDisable && (
      <button
        onClick={e => { e.stopPropagation(); onDisable(); }}
        className="mt-3 px-4 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm font-semibold"
        aria-label="Disable settlement"
      >
        Disable
      </button>
    )}
  </div>
);

export default SettlementCard; 