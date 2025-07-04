import React from 'react';
import { FaCheckCircle, FaMinusCircle, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';

const SettlementCard = ({
  settlement,
  isAvailable,
  adminInfo,
  onClick,
  onDisable,
  onEnable,
  isRTL = false,
}) => (
  <div
    className={`p-6 m-2 border rounded-xl shadow transition transform hover:scale-105 hover:shadow-lg cursor-pointer
      ${isAvailable ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-200'}
      min-h-[320px] flex flex-col justify-between
      ${isRTL ? 'text-right font-[Assistant, Rubik, Noto Sans Hebrew, Arial, sans-serif]' : ''}`}
    onClick={onClick}
    tabIndex={0}
    role="button"
    aria-label={`Settlement ${settlement}`}
    onKeyPress={e => { if (e.key === 'Enter') onClick && onClick(); }}
    dir={isRTL ? 'rtl' : 'ltr'}
    lang={isRTL ? 'he' : undefined}
  >
    <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <FaMapMarkerAlt className="text-yellow-500 text-xl" aria-label="Location" />
        <div className={`flex flex-col ${isRTL ? 'mr-2' : 'ml-2'} ${isRTL ? 'text-right' : ''}`}
          style={isRTL ? { fontFamily: 'Assistant, Rubik, Noto Sans Hebrew, Arial, sans-serif' } : {}}>
          <span className="font-bold text-2xl leading-6">{settlement && settlement.split(' ')[0]}</span>
          <span className="font-bold text-xl text-gray-700 leading-5">{settlement && settlement.split(' ').slice(1).join(' ')}</span>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1
        ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}
        ${isRTL ? 'flex-row-reverse' : ''}`}
        aria-label={isAvailable ? 'Available' : 'Disabled'}
      >
        {isAvailable ? <FaCheckCircle className="text-green-500" /> : <FaMinusCircle className="text-gray-400" />}
        {isAvailable ? 'Available' : 'Disabled'}
      </span>
    </div>
    <hr className="my-2 border-blue-100" />
    <div className="flex flex-col gap-2 text-base mt-2 flex-1">
      {(!isAvailable && (!adminInfo || !(adminInfo.username || adminInfo.email || adminInfo.phone))) ? (
        <div className="text-gray-400 italic flex items-center gap-2 mt-2">
          <FaUser className="text-blue-200" /> Admin was deleted when this settlement was disabled.
        </div>
      ) : adminInfo && (adminInfo.username || adminInfo.email || adminInfo.phone) ? (
        <>
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <FaUser className="text-blue-400" aria-label="Admin username" />
            {adminInfo.username || '-'}
          </div>
          <div className="flex items-center gap-2 text-blue-600">
            <FaEnvelope className="text-blue-300" aria-label="Admin email" />
            {adminInfo.email ? (
              <a href={`mailto:${adminInfo.email}`} className="hover:underline break-all" title={adminInfo.email} dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>{adminInfo.email}</a>
            ) : '-'}
          </div>
          <div className="flex items-center gap-2 text-blue-600">
            <FaPhone className="text-blue-300" aria-label="Admin phone" />
            {adminInfo.phone ? (
              <a href={`tel:${adminInfo.phone}`} className="hover:underline" title={adminInfo.phone} dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>{adminInfo.phone}</a>
            ) : '-'}
          </div>
        </>
      ) : (
        <div className="text-gray-400 italic flex items-center gap-2 mt-2">
          <FaUser className="text-blue-200" /> No admin assigned
        </div>
      )}
    </div>
    {!isAvailable && onEnable && (
      <button
        onClick={e => {
          e.stopPropagation();
          onEnable();
        }}
        className="mt-4 px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 text-base font-semibold w-full flex items-center justify-center gap-2"
        aria-label="Enable settlement"
      >
        Enable
      </button>
    )}
    {isAvailable && onDisable && (
      <button
        onClick={e => { 
          console.log('Disable button clicked in SettlementCard for:', settlement);
          e.stopPropagation(); 
          onDisable(); 
        }}
        className="mt-4 px-4 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200 text-base font-semibold w-full flex items-center justify-center gap-2"
        aria-label="Disable settlement"
      >
        <FaTrash className="mr-1" /> Disable
      </button>
    )}
  </div>
);

export default SettlementCard; 