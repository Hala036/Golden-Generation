import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

const Calendar = ({ events = [], onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reminders, setReminders] = useState({});
  const [editingDate, setEditingDate] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const { t } = useLanguage();
  const editBoxRef = useRef(null);

  // Load reminders from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('calendarReminders');
    if (saved) {
      setReminders(JSON.parse(saved));
    }
  }, []);

  // Save reminders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('calendarReminders', JSON.stringify(reminders));
  }, [reminders]);

  // Click outside to close reminder edit box
  useEffect(() => {
    if (!editingDate) return;
    function handleClickOutside(event) {
      if (editBoxRef.current && !editBoxRef.current.contains(event.target)) {
        setEditingDate(null);
        setEditingValue('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingDate]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleReminderChange = (value) => {
    setEditingValue(value);
  };

  const handleDateClick = (dateKey) => {
    setEditingDate(dateKey);
    setEditingValue(reminders[dateKey] || '');
  };

  const handleSaveReminder = () => {
    setReminders(prev => {
      const updated = { ...prev, [editingDate]: editingValue };
      localStorage.setItem('calendarReminders', JSON.stringify(updated));
      return updated;
    });
    setEditingDate(null);
    setEditingValue('');
  };

  const handleCancelReminder = () => {
    setEditingDate(null);
    setEditingValue('');
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = firstDayOfMonth + daysInMonth;
    const totalWeeks = Math.ceil(totalDays / 7);

    for (let week = 0; week < totalWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        const dayNumber = week * 7 + day - firstDayOfMonth + 1;
        const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
        const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${dayNumber}`;
        const hasEvent = isCurrentMonth && events.some(event => {
          const eventDate = new Date(event.date);
          return eventDate.getDate() === dayNumber &&
                 eventDate.getMonth() === currentDate.getMonth() &&
                 eventDate.getFullYear() === currentDate.getFullYear();
        });
        const eventList = isCurrentMonth ? events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getDate() === dayNumber &&
                 eventDate.getMonth() === currentDate.getMonth() &&
                 eventDate.getFullYear() === currentDate.getFullYear();
        }) : [];

        days.push(
          <div
            key={`${week}-${day}`}
            className={
              `relative flex flex-col border border-gray-200 bg-white overflow-hidden shadow-sm rounded-xl transition-all duration-150 ` +
              (isCurrentMonth
                ? isToday(dayNumber)
                  ? 'outline outline-2 outline-orange-400'
                  : 'hover:shadow-lg hover:border-blue-400'
                : 'bg-gray-100 text-gray-300')
            }
            style={{ minHeight: 90, minWidth: 110, height: 110, padding: 6, boxSizing: 'border-box', cursor: isCurrentMonth ? 'pointer' : 'default', backgroundImage: isCurrentMonth ? `repeating-linear-gradient(white, white 18px, #f3f4f6 19px, white 20px)` : 'none' }}
            onClick={() => isCurrentMonth && handleDateClick(dateKey)}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`font-bold text-base ${isCurrentMonth ? '' : 'text-gray-300'}`}>{isCurrentMonth ? dayNumber : ''}</span>
            </div>
            {/* Events */}
            {isCurrentMonth && eventList.length > 0 && (
              <div className="mb-1">
                {eventList.map((event, idx) => (
                  <div key={idx} className="text-xs font-semibold truncate bg-blue-100 border border-blue-400 text-blue-900 rounded px-1 py-0.5 mb-1 shadow-sm" style={{fontSize: '0.85em'}}>
                    {t(event.title) || event.title} {event.time ? t('calendar.at', { time: event.time }) : ''}
                  </div>
                ))}
              </div>
            )}
            {/* Reminder (editable) */}
            {isCurrentMonth && (
              editingDate === dateKey ? (
                <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center bg-white bg-opacity-90 z-20">
                  <div ref={editBoxRef} className="w-[95%] bg-white border-2 border-blue-400 rounded-xl shadow-lg p-2 flex flex-col gap-2">
                    <textarea
                      className="w-full resize-none bg-gray-50 text-sm text-gray-800 focus:outline-none rounded-md p-1 border border-gray-300"
                      value={editingValue}
                      onChange={e => handleReminderChange(e.target.value)}
                      rows={3}
                      placeholder={t('calendar.reminderPlaceholder') || 'Write a reminder...'}
                      style={{ minHeight: 30 }}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleCancelReminder}
                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-xs font-semibold"
                      >
                        {t('calendar.cancel') || 'Cancel'}
                      </button>
                      <button
                        onClick={handleSaveReminder}
                        className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-semibold"
                      >
                        {t('calendar.save') || 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-line mt-1 min-h-[30px]" style={{ cursor: 'pointer' }}>
                  {reminders[dateKey] || <span className="text-gray-300">{t('calendar.reminderPlaceholder') || 'Write a reminder...'}</span>}
                </div>
              )
            )}
          </div>
        );
      }
    }

    return days;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 overflow-x-auto pb-10">
      {/* Sticky Month Label */}
      <div className="sticky top-0 left-0 z-30 flex items-center gap-4 bg-gray-50 py-4 px-8" style={{minHeight: 70}}>
        <h2 className="text-3xl font-bold tracking-wide text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-200 rounded-full text-2xl text-gray-700 transition"
          aria-label="Previous Month"
        >
          <FaChevronLeft />
        </button>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-200 rounded-full text-2xl text-gray-700 transition"
          aria-label="Next Month"
        >
          <FaChevronRight />
        </button>
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[1400px] border border-gray-200">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center font-semibold text-lg text-gray-600 py-3 border-b border-gray-300 bg-gray-100 rounded-t-md">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2" style={{ minHeight: 900 }}>
            {renderCalendarDays()}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-7 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-lg shadow font-bold transition"
            >
              {t('calendar.close') || 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 