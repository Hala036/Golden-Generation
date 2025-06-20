import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Search } from 'lucide-react';
import { getDaysInMonth, dayNames, monthNames } from '../../utils/calendarUtils';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { getCategoryAppearance } from '../../utils/categoryColors';

const BaseCalendar = ({
  userRole,
  onEventClick,
  onCreateEvent,
  showCreateButton = true,
  additionalFilters = [],
  eventDetailsComponent: EventDetailsComponent
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { events, loading, getFilteredEvents } = useCalendarEvents(userRole);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    if (onEventClick) onEventClick(event);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);

  const dayEvents = useMemo(() => {
    return days.map((day) =>
      getFilteredEvents(
        day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null,
        filter,
        searchTerm
      )
    );
  }, [days, events, filter, searchTerm, getFilteredEvents, currentDate]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="text-blue-600" />
              Activity Calendar
            </h1>
          </div>
          
          {showCreateButton && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              Create Event
            </button>
          )}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg px-3 py-2 w-64"
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All Events</option>
            {userRole === 'admin' ? (
              <>
                <option value="created">Created by Me</option>
                <option value="pending">Pending Approval</option>
              </>
            ) : (
              <>
                <option value="joined">My Events</option>
                <option value="created">Created by Me</option>
              </>
            )}
            <option value="fitness">Fitness</option>
            <option value="social">Social</option>
            <option value="hobby">Hobbies</option>
            <option value="educational">Educational</option>
            {additionalFilters}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-100">
          {dayNames.map(day => (
            <div key={day} className="p-4 text-center font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const eventsForDay = dayEvents[index] || [];
            return (
              <div
                key={index}
                className="min-h-32 p-2 border-b border-r border-gray-200 bg-white hover:bg-gray-50"
              >
                {day && (
                  <>
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      {day}
                    </div>
                    <div className="space-y-1">
                      {eventsForDay.slice(0, 3).map(event => {
                        const appearance = getCategoryAppearance(event.category);
                        const isPending = event.status === 'pending';
                        
                        return (
                          <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${appearance.className || ''} ${isPending ? 'pending-event-pattern' : ''}`}
                            style={{ ...appearance.style, minHeight: '40px' }}
                          >
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              {event.timeFrom || event.time}
                            </div>
                            <div className="truncate font-medium">
                              {event.title}
                            </div>
                          </div>
                        );
                      })}
                      {eventsForDay.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{eventsForDay.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && EventDetailsComponent && (
        <EventDetailsComponent
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Create Event Modal */}
      {showCreateModal && onCreateEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            {onCreateEvent({ onClose: () => setShowCreateModal(false) })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseCalendar; 