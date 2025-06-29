import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Search } from 'lucide-react';
import {
  getDaysInMonth,
  dayNames,
  monthNames,
  getWeekDays,
  getDayHours,
  processEventsForDayView,
} from '../../utils/calendarUtils';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { getCategoryAppearance } from '../../utils/categoryColors';
import * as Tooltip from '@radix-ui/react-tooltip';
import EventPopover from './EventPopover';

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

  // For week view
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  // For day view
  const dayHours = useMemo(() => getDayHours(), []);

  // Events for week view
  const weekEvents = useMemo(() => {
    return weekDays.map((date) =>
      getFilteredEvents(date, filter, searchTerm)
    );
  }, [weekDays, events, filter, searchTerm, getFilteredEvents]);

  // Events for day view
  const dayViewEvents = useMemo(() => {
    const filtered = getFilteredEvents(currentDate, filter, searchTerm);
    return processEventsForDayView(filtered);
  }, [currentDate, events, filter, searchTerm, getFilteredEvents]);

  // Function to position events in the day view
  const getEventPositionAndDimensions = (event) => {
    const timeToMinutes = (time) => {
      if (!time) return 0;
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(event.timeFrom);
    const endMinutes = timeToMinutes(event.timeTo);
    const duration = endMinutes > startMinutes ? endMinutes - startMinutes : 60; // Default to 60 mins if no end time

    const top = (startMinutes / 60) * 60; // 60px per hour
    const height = (duration / 60) * 60;

    return { top, height };
  };

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6 flex flex-col w-full min-w-0">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 w-full min-w-0">
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
        <div className="bg-white rounded-lg shadow-sm p-2 sm:p-3 md:p-4 mb-4 sm:mb-6 w-full min-w-0">
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
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto w-full min-w-0 flex-1 flex flex-col">
          {viewMode === 'month' && (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-gray-100 w-full min-w-0">
                {dayNames.map(day => (
                  <div key={day} className="p-2 sm:p-3 md:p-4 text-center font-semibold text-gray-700 text-xs sm:text-sm md:text-base">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar Days */}
              <div className="grid grid-cols-7 w-full min-w-0 flex-1">
                {days.map((day, index) => {
                  const eventsForDay = dayEvents[index] || [];
                  return (
                    <div
                      key={index}
                      className="min-h-24 sm:min-h-32 p-1 sm:p-2 md:p-3 border-b border-r border-gray-200 bg-white hover:bg-gray-50 flex flex-col w-full min-w-0"
                    >
                      {day && (
                        <>
                          <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                            {day}
                          </div>
                          <div className="space-y-0.5 sm:space-y-1">
                            {eventsForDay.slice(0, 3).map(event => {
                              const appearance = getCategoryAppearance(event.category);
                              const isPending = event.status === 'pending';
                              return (
                                <Tooltip.Root key={event.id}>
                                  <Tooltip.Trigger asChild>
                                    <div
                                      onClick={() => handleEventClick(event)}
                                      className={`p-0.5 sm:p-1 rounded-md text-white text-left text-xs sm:text-xs md:text-sm cursor-pointer truncate ${appearance.className || ''} ${isPending ? 'pending-event-pattern' : ''}`}
                                      style={appearance.style}
                                    >
                                      <span className="font-semibold">{event.timeFrom}</span> {event.title}
                                    </div>
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content side="right" sideOffset={5} className="radix-side-right:animate-slide-left-fade radix-side-bottom:animate-slide-up-fade">
                                      <EventPopover event={event} />
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
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
              <div className="grid grid-cols-7 bg-gray-100 w-full min-w-0">
                {weekDays.map(date => (
                  <div key={date.toISOString()} className="p-2 sm:p-3 md:p-4 text-center font-semibold text-gray-700 text-xs sm:text-sm md:text-base">
                    {dayNames[date.getDay()]} {date.getDate()}
                  </div>
                ))}
              </div>
              {/* Week Days */}
              <div className="grid grid-cols-7 w-full min-w-0 flex-1">
                {weekDays.map((date, index) => {
                  const eventsForDay = weekEvents[index] || [];
                  return (
                    <div
                      key={date.toISOString()}
                      className="min-h-24 sm:min-h-32 p-1 sm:p-2 md:p-3 border-b border-r border-gray-200 bg-white hover:bg-gray-50 flex flex-col w-full min-w-0"
                    >
                      <div className="space-y-0.5 sm:space-y-1">
                        {eventsForDay.length === 0 && (
                          <div className="text-xs text-gray-400">No events</div>
                        )}
                        {eventsForDay.map(event => {
                          const appearance = getCategoryAppearance(event.category);
                          const isPending = event.status === 'pending';
                          return (
                            <Tooltip.Root key={event.id}>
                              <Tooltip.Trigger asChild>
                                <div
                                  onClick={() => handleEventClick(event)}
                                  className={`p-0.5 sm:p-1 rounded-md text-white text-left text-xs sm:text-xs md:text-sm cursor-pointer truncate ${appearance.className || ''} ${isPending ? 'pending-event-pattern' : ''}`}
                                  style={appearance.style}
                                >
                                  <span className="font-semibold">{event.timeFrom}</span> {event.title}
                                </div>
                              </Tooltip.Trigger>
                              <Tooltip.Portal>
                                <Tooltip.Content side="right" sideOffset={5} className="radix-side-right:animate-slide-left-fade radix-side-bottom:animate-slide-up-fade">
                                  <EventPopover event={event} />
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Root>
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
            <div className="relative pl-10 sm:pl-14 md:pl-16 w-full min-w-0 flex-1">
              {/* Hour labels (absolutely positioned into the padding) */}
              <div className="absolute left-0 top-0 w-10 sm:w-14 md:w-16 h-full">
                {dayHours.map((hour, index) => (
                  <div key={index} className="h-[60px] text-right pr-1 sm:pr-2 -mt-2.5 text-xs text-gray-500 relative">
                    <span className="absolute right-1 sm:right-2">{hour}</span>
                  </div>
                ))}
              </div>

              {/* Event container with background lines */}
              <div className="relative h-[1440px] ml-0.5 w-full min-w-0">
                {/* Background Lines */}
                {dayHours.map((_, index) => (
                  <div key={index} className="h-[60px] border-t border-gray-200" />
                ))}

                {/* Events */}
                <div className="absolute top-0 left-0 w-full h-full">
                  {dayViewEvents.map(event => {
                    const { top, height } = getEventPositionAndDimensions(event);
                    const appearance = getCategoryAppearance(event.category);
                    const isPending = event.status === 'pending';
                    
                    const width = `calc(${100 / event.totalColumns}% - 6px)`;
                    const left = `calc(${event.column * (100 / event.totalColumns)}%)`;

                    return (
                      <Tooltip.Root key={event.id}>
                        <Tooltip.Trigger asChild>
                          <button
                            onClick={() => handleEventClick(event)}
                            className={`absolute p-1.5 sm:p-2 rounded-lg text-white shadow-md cursor-pointer transition-all duration-200 ease-in-out text-xs sm:text-sm md:text-base ${appearance.className || ''} ${isPending ? 'pending-event-pattern' : ''}`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left: left,
                              width: width,
                              ...appearance.style,
                            }}
                            type="button"
                          >
                            <p className="font-bold text-xs sm:text-sm md:text-base leading-tight">{event.title}</p>
                            <p className="text-[10px] sm:text-xs opacity-90">{event.timeFrom} - {event.timeTo}</p>
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content side="right" sideOffset={5} className="radix-side-right:animate-slide-left-fade radix-side-bottom:animate-slide-up-fade">
                            <EventPopover event={event} />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    );
                  })}
                </div>
              </div>
            </div>
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
    </Tooltip.Provider>
  );
};

export default BaseCalendar; 