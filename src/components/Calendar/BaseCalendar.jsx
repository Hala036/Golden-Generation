import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, Search, Filter, X, BarChart3, TrendingUp } from 'lucide-react';
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
import BaseEventDetails from './BaseEventDetails';
import { auth } from '../../firebase';
import { getAllSettlements } from '../../utils/getSettlements';

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsView, setAnalyticsView] = useState('daily'); // 'daily', 'hourly', 'weekly'
  
  // Advanced filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [settlementFilter, setSettlementFilter] = useState('all');
  const [settlements, setSettlements] = useState([]);

  const { events, loading, getFilteredEvents, categories } = useCalendarEvents(userRole);
  console.log('DEBUG BaseCalendar - userRole:', userRole, 'settlements:', settlements);

  // Fetch all settlements for superadmin
  useEffect(() => {
    if (userRole === 'superadmin') {
      (async () => {
        const allSettlements = await getAllSettlements();
        setSettlements(allSettlements);
      })();
    }
  }, [userRole]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    if (onEventClick) onEventClick(event);
  };

  const handleCreateEventForDate = (date) => {
    if (onCreateEvent) {
      setShowCreateModal(true);
      // Pass the selected date to the create event form
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      // Store the selected date in a way that CreateEventForm can access it
      sessionStorage.setItem('selectedEventDate', formattedDate);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);

  // Prepare additional filters object
  const additionalFiltersObj = {
    statusFilter,
    categoryFilter,
    dateRange: dateRangeFilter,
    settlementFilter
  };

  // Assumes event.date or event.endDate is in YYYY-MM-DD format
  const isPastEvent = (event) => {
    const now = new Date();
    // Try all possible date fields
    const dateStr = event.endDate || event.startDate || event.date;
    const timeStr = event.timeTo || event.timeFrom || '23:59';

    if (!dateStr) return false;

    // Detect format: if first part is 4 digits, it's YYYY-MM-DD, else DD-MM-YYYY
      const parts = dateStr.split('-');
    let year, month, day;
      if (parts.length === 3) {
      if (parts[0].length === 4) {
          // YYYY-MM-DD
        [year, month, day] = parts;
      } else {
        // DD-MM-YYYY
        [day, month, year] = parts;
      }
      // Pad month and day
      month = month.padStart(2, '0');
      day = day.padStart(2, '0');
      const eventDate = new Date(`${year}-${month}-${day}T${timeStr}`);
      return eventDate < now;
    }
    return false;
  };

  // Analytics functions
  const getAnalyticsData = () => {
    const allEvents = getFilteredEvents(null, filter, searchTerm, additionalFiltersObj);
    
    if (analyticsView === 'daily') {
      // Daily event frequency for current month
      const dailyData = {};
      days.forEach((day, index) => {
        if (day) {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = allEvents.filter(event => event.date === dateStr);
          dailyData[day] = dayEvents.length;
        }
      });
      return dailyData;
    } else if (analyticsView === 'hourly') {
      // Hourly event frequency
      const hourlyData = {};
      for (let hour = 0; hour < 24; hour++) {
        const hourStr = `${hour.toString().padStart(2, '0')}:00`;
        const hourEvents = allEvents.filter(event => {
          if (!event.timeFrom) return false;
          const eventHour = parseInt(event.timeFrom.split(':')[0]);
          return eventHour === hour;
        });
        hourlyData[hourStr] = hourEvents.length;
      }
      return hourlyData;
    } else if (analyticsView === 'weekly') {
      // Weekly event frequency for current month
      const weeklyData = {};
      const weeks = Math.ceil(days.length / 7);
      for (let week = 1; week <= weeks; week++) {
        const weekEvents = allEvents.filter(event => {
          if (!event.date) return false;
          const eventDay = parseInt(event.date.split('-')[2]);
          const eventWeek = Math.ceil(eventDay / 7);
          return eventWeek === week;
        });
        weeklyData[`Week ${week}`] = weekEvents.length;
      }
      return weeklyData;
    }
    return {};
  };

  // Collision detection and handling
  const processEventsWithCollisions = (eventsForDay) => {
    if (!eventsForDay || eventsForDay.length === 0) return [];

    // Sort events by start time
    const sortedEvents = [...eventsForDay].sort((a, b) => {
      const timeA = a.timeFrom ? a.timeFrom : '00:00';
      const timeB = b.timeFrom ? b.timeFrom : '00:00';
      return timeA.localeCompare(timeB);
    });

    const processedEvents = [];
    const collisionGroups = [];

    sortedEvents.forEach(event => {
      const eventStart = event.timeFrom ? event.timeFrom : '00:00';
      const eventEnd = event.timeTo ? event.timeTo : '01:00';
      
      // Find overlapping events
      const overlappingEvents = sortedEvents.filter(otherEvent => {
        if (event.id === otherEvent.id) return false;
        
        const otherStart = otherEvent.timeFrom ? otherEvent.timeFrom : '00:00';
        const otherEnd = otherEvent.timeTo ? otherEvent.timeTo : '01:00';
        
        // Check for overlap
        return (
          (eventStart < otherEnd && eventEnd > otherStart) ||
          (otherStart < eventEnd && otherEnd > eventStart)
        );
      });

      if (overlappingEvents.length > 0) {
        // Add to collision group
        const collisionGroup = [event, ...overlappingEvents];
        const groupId = collisionGroup.map(e => e.id).sort().join('-');
        
        if (!collisionGroups.find(group => group.id === groupId)) {
          collisionGroups.push({
            id: groupId,
            events: collisionGroup
          });
        }
      }

      // Calculate position for collision handling
      const totalColumns = Math.max(1, overlappingEvents.length + 1);
      const column = processedEvents.filter(e => 
        overlappingEvents.some(oe => oe.id === e.id)
      ).length;

      processedEvents.push({
        ...event,
        totalColumns,
        column,
        hasCollision: overlappingEvents.length > 0
      });
    });

    return processedEvents;
  };

  // Get collision-aware events for day view
  const dayViewEventsWithCollisions = useMemo(() => {
    const filtered = getFilteredEvents(currentDate, filter, searchTerm, additionalFiltersObj)
      .filter(event => showPastEvents || !isPastEvent(event));
    const processed = processEventsWithCollisions(filtered);
    return processEventsForDayView(processed);
  }, [currentDate, events, filter, searchTerm, getFilteredEvents, additionalFiltersObj, showPastEvents]);

  const dayEvents = useMemo(() => {
    return days.map((day) =>
      getFilteredEvents(
        day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null,
        filter,
        searchTerm,
        additionalFiltersObj
      )
      .filter(event => {
        const result = showPastEvents || !isPastEvent(event);
        return result;
      })
    );
  }, [days, events, filter, searchTerm, getFilteredEvents, currentDate, additionalFiltersObj, showPastEvents]);

  // For week view
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  // For day view
  const dayHours = useMemo(() => getDayHours(), []);

  // Events for week view
  const weekEvents = useMemo(() => {
    return weekDays.map((date) =>
      getFilteredEvents(date, filter, searchTerm, additionalFiltersObj)
        .filter(event => showPastEvents || !isPastEvent(event))
    );
  }, [weekDays, events, filter, searchTerm, getFilteredEvents, additionalFiltersObj, showPastEvents]);

  // Events for day view
  const dayViewEvents = useMemo(() => {
    const filtered = getFilteredEvents(currentDate, filter, searchTerm, additionalFiltersObj);
    return processEventsForDayView(filtered);
  }, [currentDate, events, filter, searchTerm, getFilteredEvents, additionalFiltersObj]);

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

  // Clear all filters
  const clearAllFilters = () => {
    setFilter('all');
    setStatusFilter('all');
    setCategoryFilter('all');
    setDateRangeFilter('all');
    setSettlementFilter('all');
    setSearchTerm('');
  };

  // Check if any filters are active
  const hasActiveFilters = filter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' || 
                          dateRangeFilter !== 'all' || settlementFilter !== 'all' || searchTerm;

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
          <div className="space-y-4">
            {/* Basic Filters Row */}
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

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  showAdvancedFilters ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-300'
                }`}
              >
                <Filter size={16} />
                Advanced Filters
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              )}

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
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className={`flex items-center gap-2 px-3 py-1 rounded ${
                    showAnalytics ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <BarChart3 size={16} />
                  Analytics
                </button>
              </div>
            </div>

            {/* Toggle to show/hide past events */}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="showPastEvents"
                checked={showPastEvents}
                onChange={() => setShowPastEvents(v => !v)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <label htmlFor="showPastEvents" className="text-sm text-gray-700">Show Past Events</label>
            </div>

            {/* Advanced Filters Row */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Events</option>
                    <option value="created">Created by Me</option>
                    <option value="joined">My Events</option>
                    {userRole === 'admin' || userRole === 'superadmin' ? (
                      <>
                        <option value="pending-approval">Pending Approval</option>
                        <option value="upcoming">Upcoming Events</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                      </>
                    ) : null}
                    {userRole === 'retiree' ? (
                      <>
                        <option value="my-pending">My Pending</option>
                        <option value="my-approved">My Approved</option>
                      </>
                    ) : null}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this-week">This Week</option>
                    <option value="next-week">Next Week</option>
                    <option value="this-month">This Month</option>
                  </select>
                </div>

                {/* Settlement Filter */}
                {(userRole === 'admin' || userRole === 'superadmin') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Settlement</label>
                    <select
                      value={settlementFilter}
                      onChange={(e) => setSettlementFilter(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="all">All Settlements</option>
                      {userRole === 'admin' && <option value="my-settlement">My Settlement</option>}
                      {userRole === 'superadmin' && settlements.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('all')} className="ml-1">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    Category: {categories.find(c => c.id === categoryFilter)?.name || categoryFilter}
                    <button onClick={() => setCategoryFilter('all')} className="ml-1">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {dateRangeFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    Date: {dateRangeFilter}
                    <button onClick={() => setDateRangeFilter('all')} className="ml-1">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {settlementFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    Settlement: {settlementFilter}
                    <button onClick={() => setSettlementFilter('all')} className="ml-1">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="ml-1">
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
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

        {/* Analytics Bar Chart */}
        {showAnalytics && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-purple-600" />
                Event Analytics
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setAnalyticsView('daily')}
                  className={`px-3 py-1 rounded text-sm ${
                    analyticsView === 'daily' ? 'bg-purple-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setAnalyticsView('hourly')}
                  className={`px-3 py-1 rounded text-sm ${
                    analyticsView === 'hourly' ? 'bg-purple-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  Hourly
                </button>
                <button
                  onClick={() => setAnalyticsView('weekly')}
                  className={`px-3 py-1 rounded text-sm ${
                    analyticsView === 'weekly' ? 'bg-purple-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {(() => {
                const analyticsData = getAnalyticsData();
                const maxValue = Math.max(...Object.values(analyticsData), 1);
                const entries = Object.entries(analyticsData);
                
                return (
                  <div className="space-y-3">
                    {entries.map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-16 text-sm font-medium text-gray-600">
                          {key}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-6 rounded-full transition-all duration-300"
                            style={{ width: `${(value / maxValue) * 100}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white drop-shadow-sm">
                              {value} {value === 1 ? 'event' : 'events'}
                            </span>
                          </div>
                        </div>
                        <div className="w-12 text-sm text-gray-500 text-right">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-700">
                <strong>Insight:</strong> This chart shows event frequency distribution. 
                {analyticsView === 'daily' && ' Higher bars indicate busier days.'}
                {analyticsView === 'hourly' && ' Higher bars indicate peak activity hours.'}
                {analyticsView === 'weekly' && ' Higher bars indicate busier weeks.'}
              </p>
            </div>
          </div>
        )}

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
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                              {day}
                            </div>
                            {/* Add Event Button - only show for future dates and when user can create events */}
                            {showCreateButton && onCreateEvent && (() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const eventDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                              eventDate.setHours(0, 0, 0, 0);
                              return eventDate >= today;
                            })() && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateEventForDate(day);
                                }}
                                className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 hover:scale-110"
                                title="Add event for this date"
                              >
                                +
                              </button>
                            )}
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
                                      className={`p-0.5 sm:p-1 rounded-md text-white text-left text-xs sm:text-xs md:text-sm cursor-pointer truncate ${appearance.className || ''} ${isPending ? 'pending-event-pattern' : ''} ${isPastEvent(event) ? 'opacity-50 bg-gray-300 text-gray-700 cursor-default pointer-events-none relative' : ''}`}
                                      style={appearance.style}
                                    >
                                      <span className="font-semibold">{event.timeFrom}</span> {event.title}
                                      {isPastEvent(event) && <span className="ml-2 bg-gray-700 text-white px-1 rounded text-[10px]">Past</span>}
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
                      {/* Add Event Button - only show for future dates and when user can create events */}
                      {showCreateButton && onCreateEvent && (() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const eventDate = new Date(date);
                        eventDate.setHours(0, 0, 0, 0);
                        return eventDate >= today;
                      })() && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const selectedDate = date.toISOString().split('T')[0];
                            sessionStorage.setItem('selectedEventDate', selectedDate);
                            setShowCreateModal(true);
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 hover:scale-110 z-10"
                          title="Add event for this date"
                        >
                          +
                        </button>
                      )}
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
                                  className={`p-0.5 sm:p-1 rounded-md text-white text-left text-xs sm:text-xs md:text-sm cursor-pointer truncate ${appearance.className || ''} ${isPending ? 'pending-event-pattern' : ''} ${isPastEvent(event) ? 'opacity-50 bg-gray-300 text-gray-700 cursor-default pointer-events-none relative' : ''}`}
                                  style={appearance.style}
                                >
                                  <span className="font-semibold">{event.timeFrom}</span> {event.title}
                                  {isPastEvent(event) && <span className="ml-2 bg-gray-700 text-white px-1 rounded text-[10px]">Past</span>}
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

                {/* Timeline indicators for each hour */}
                {dayHours.map((hour, index) => (
                  <div key={index} className="absolute left-0 w-full h-[60px] pointer-events-none">
                    <div className="absolute left-0 w-2 h-full border-l-2 border-gray-300 opacity-30"></div>
                    <div className="absolute left-4 w-1 h-full border-l border-gray-200 opacity-20"></div>
                  </div>
                ))}

                {/* Current time indicator */}
                {(() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const currentMinute = now.getMinutes();
                  const currentTimeTop = (currentHour * 60 + currentMinute) * (60 / 60); // 60px per hour
                  
                  if (now.toDateString() === currentDate.toDateString()) {
                    return (
                      <div 
                        className="absolute left-0 w-full pointer-events-none z-20"
                        style={{ top: `${currentTimeTop}px` }}
                      >
                        <div className="absolute left-0 w-2 h-0.5 bg-red-500 rounded-full"></div>
                        <div className="absolute left-2 w-2 h-2 bg-red-500 rounded-full"></div>
                        <div className="absolute left-4 right-0 h-0.5 bg-red-500 opacity-50"></div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Events with timeline lines */}
                <div className="absolute top-0 left-0 w-full h-full">
                  {dayViewEventsWithCollisions.map(event => {
                    const { top, height } = getEventPositionAndDimensions(event);
                    const appearance = getCategoryAppearance(event.category);
                    const isPending = event.status === 'pending';
                    
                    const width = `calc(${100 / event.totalColumns}% - 6px)`;
                    const left = `calc(${event.column * (100 / event.totalColumns)}%)`;

                    return (
                      <Tooltip.Root key={event.id}>
                        <Tooltip.Trigger asChild>
                          <div className="relative">
                            {/* Timeline line connecting start to end */}
                            <div 
                              className="absolute left-0 w-1 bg-gray-400 opacity-30 rounded-full"
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: '8px'
                              }}
                            />
                            
                            {/* Event block */}
                            <button
                              onClick={() => handleEventClick(event)}
                              className={`absolute p-1.5 sm:p-2 rounded-lg text-white shadow-md cursor-pointer transition-all duration-200 ease-in-out text-xs sm:text-sm md:text-base ${appearance.className || ''} ${isPending ? 'pending-event-pattern' : ''}`}
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: left,
                                width: width,
                                zIndex: event.hasCollision ? 10 : 1,
                                marginLeft: '16px', // Space for timeline line
                                ...appearance.style
                              }}
                              type="button"
                            >
                              {/* Event content */}
                              <div className="h-full flex flex-col justify-between">
                                <div>
                                  <p className="font-bold text-xs sm:text-sm md:text-base leading-tight">{event.title}</p>
                                  <p className="text-[10px] sm:text-xs opacity-90">{event.timeFrom} - {event.timeTo}</p>
                                </div>
                                
                                {/* Event duration indicator */}
                                <div className="flex items-center justify-between mt-1">
                                  <div className="flex items-center gap-1">
                                    <Clock size={10} className="opacity-70" />
                                    <span className="text-xs opacity-70">
                                      {(() => {
                                        const start = event.timeFrom ? event.timeFrom : '00:00';
                                        const end = event.timeTo ? event.timeTo : '01:00';
                                        const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
                                        const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
                                        const duration = endMinutes - startMinutes;
                                        if (duration <= 0) return '1h';
                                        const hours = Math.floor(duration / 60);
                                        const minutes = duration % 60;
                                        if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
                                        if (hours > 0) return `${hours}h`;
                                        return `${minutes}m`;
                                      })()}
                                    </span>
                                  </div>
                                  
                                  {/* Collision indicator */}
                                  {event.hasCollision && (
                                    <div className="w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                                  )}
                                </div>
                              </div>
                              
                              {isPastEvent(event) && (
                                <span className="absolute top-1 right-1 bg-gray-700 text-white px-1 rounded text-[10px]">Past</span>
                              )}
                            </button>
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

                {/* Empty state */}
                {dayViewEventsWithCollisions.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No events scheduled for this day</p>
                      <p className="text-xs opacity-70 mb-4">Click "Create Event" to add an activity</p>
                      {/* Add Event Button for day view */}
                      {showCreateButton && onCreateEvent && (() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const eventDate = new Date(currentDate);
                        eventDate.setHours(0, 0, 0, 0);
                        return eventDate >= today;
                      })() && (
                        <button
                          onClick={() => {
                            const selectedDate = currentDate.toISOString().split('T')[0];
                            sessionStorage.setItem('selectedEventDate', selectedDate);
                            setShowCreateModal(true);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors duration-200"
                          title="Add event for today"
                        >
                          <span className="text-lg font-bold">+</span>
                          Add Event
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <BaseEventDetails
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            userRole={userRole}
            showParticipants={userRole === 'admin' || userRole === 'superadmin' || selectedEvent.createdBy === (auth.currentUser && auth.currentUser.uid)}
            showJoinLeave={!(userRole === 'admin' || userRole === 'superadmin' || selectedEvent.createdBy === (auth.currentUser && auth.currentUser.uid))}
          />
        )}

        {/* Create Event Modal */}
        {showCreateModal && onCreateEvent && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full">
              {onCreateEvent({ onClose: () => setShowCreateModal(false) })}
            </div>
          </div>
        )}

        {/* Color Guidance Legend */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            Event Color Guide
          </h3>
          <div className="space-y-6">
            {/* Dynamic category color legend */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Event Categories</h4>
              <div className="flex flex-wrap gap-4">
                {categories && categories.length > 0 ? (
                  categories.map(category => (
                    <div key={category.id} className="flex items-center gap-2 mb-2">
                      <div
                        className="w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: category.color || '#CCCCCC' }}
                        title={category.translations?.en || category.name}
                      ></div>
                      <span className="text-sm text-gray-700">
                        {category.translations?.en || category.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">No categories found</span>
                )}
              </div>
            </div>

            {/* General legend */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 mb-2">General</h4>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-300 rounded border border-gray-400"></div>
                <span className="text-sm text-gray-600">Past events</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Full capacity</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-600">Special events</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-4 h-4 bg-blue-500 rounded border-2 border-white shadow-lg"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-sm text-gray-600">Overlapping events</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-1 bg-gray-400 rounded-full opacity-30"></div>
                <span className="text-sm text-gray-600">Timeline line</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-0.5 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Current time</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Tip:</strong> Click on any event to view details. Past events are faded and cannot be interacted with.
            </p>
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
};

export default BaseCalendar; 