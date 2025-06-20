import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Search } from 'lucide-react';
import { getDaysInMonth, dayNames, monthNames, getWeekDays, getDayHours, getEventDateRange } from '../../utils/calendarUtils';
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

  // Helper: map date string (DD-MM-YYYY) to events for that day
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(event => {
      const dates = getEventDateRange(event);
      dates.forEach(dateStr => {
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(event);
      });
    });
    return map;
  }, [events]);

  // For month view: get events for each day in the month
  const dayEvents = useMemo(() => {
    return days.map((day) => {
      if (!day) return [];
      const d = day.toString().padStart(2, '0');
      const m = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const y = currentDate.getFullYear();
      const dateStr = `${d}-${m}-${y}`;
      return (eventsByDate[dateStr] || []).filter(event => {
        // Apply filter and search
        return getFilteredEvents(
          new Date(y, m - 1, d),
          filter,
          searchTerm
        ).some(e => e.id === event.id);
      });
    });
  }, [days, eventsByDate, filter, searchTerm, getFilteredEvents, currentDate]);

  // For week view
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  // For day view
  const dayHours = useMemo(() => getDayHours(), []);

  // For week view: get events for each day in the week
  const weekEvents = useMemo(() => {
    return weekDays.map((date) => {
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear();
      const dateStr = `${d}-${m}-${y}`;
      return (eventsByDate[dateStr] || []).filter(event => {
        return getFilteredEvents(
          date,
          filter,
          searchTerm
        ).some(e => e.id === event.id);
      });
    });
  }, [weekDays, eventsByDate, filter, searchTerm, getFilteredEvents]);

  // For day view: get all events for the current day
  const dayViewEvents = useMemo(() => {
    const d = currentDate.getDate().toString().padStart(2, '0');
    const m = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const y = currentDate.getFullYear();
    const dateStr = `${d}-${m}-${y}`;
    return (eventsByDate[dateStr] || []).filter(event => {
      return getFilteredEvents(
        currentDate,
        filter,
        searchTerm
      ).some(e => e.id === event.id);
    });
  }, [currentDate, eventsByDate, filter, searchTerm, getFilteredEvents]);

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
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded ${viewMode === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Day
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
        {viewMode === 'month' && (
          <>
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
          </>
        )}
        {viewMode === 'week' && (
          <>
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 bg-gray-100">
              {weekDays.map(date => (
                <div key={date.toISOString()} className="p-4 text-center font-semibold text-gray-700">
                  {dayNames[date.getDay()]} {date.getDate()}
                </div>
              ))}
            </div>
            {/* Week Days */}
            <div className="grid grid-cols-7">
              {weekDays.map((date, index) => {
                const eventsForDay = weekEvents[index] || [];
                return (
                  <div
                    key={date.toISOString()}
                    className="min-h-32 p-2 border-b border-r border-gray-200 bg-white hover:bg-gray-50"
                  >
                    <div className="space-y-1">
                      {eventsForDay.length === 0 && (
                        <div className="text-xs text-gray-400 text-center">No events</div>
                      )}
                      {eventsForDay.map(event => {
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
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {viewMode === 'day' && (
          <>
            {/* Day Header */}
            <div className="bg-gray-100 p-4 text-center font-semibold text-gray-700">
              {dayNames[currentDate.getDay()]} {currentDate.getDate()} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            {/* Day Hours */}
            <div className="grid grid-cols-1 divide-y">
              {dayHours.map(hour => {
                const eventsForHour = dayViewEvents.filter(event => {
                  // Assume event.timeFrom is in 'HH:MM' format
                  return event.timeFrom && event.timeFrom.startsWith(hour.slice(0, 2));
                });
                return (
                  <div key={hour} className="flex items-center min-h-12 p-2">
                    <div className="w-16 text-xs text-gray-400">{hour}</div>
                    <div className="flex-1 space-y-1">
                      {eventsForHour.length === 0 && (
                        <span className="text-xs text-gray-300">No events</span>
                      )}
                      {eventsForHour.map(event => {
                        const appearance = getCategoryAppearance(event.category);
                        const isPending = event.status === 'pending';
                        return (
                          <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`inline-block text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${appearance.className || ''} ${isPending ? 'pending-event-pattern' : ''}`}
                            style={{ ...appearance.style, minHeight: '24px' }}
                          >
                            <span className="font-medium">{event.title}</span>
                            <span className="ml-2">{event.timeFrom || event.time}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
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