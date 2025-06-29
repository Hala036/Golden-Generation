import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Bell, Plus, Edit, Trash2, Eye, Check, X, Filter, Search, Settings, Award, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
// Firestore imports
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

const RetireeCalendar = () => {
  const { t } = useTranslation();
  const [currentUser] = useState({
    id: 'admin1',
    role: 'admin', // Switch to 'retiree' to see retiree view
    name: t('calendar.adminName')
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Sample events data
  const [events, setEvents] = useState([
    {
      id: '1',
      title: t('calendar.sampleEvents.yoga.title'),
      date: '2025-06-12',
      time: '09:00',
      duration: 60,
      location: t('calendar.sampleEvents.yoga.location'),
      description: t('calendar.sampleEvents.yoga.description'),
      category: 'fitness',
      createdBy: 'admin1',
      maxParticipants: 15,
      participants: ['ret1', 'ret2', 'ret3'],
      status: 'open',
      recurring: 'weekly',
      color: 'blue'
    },
    {
      id: '2',
      title: t('calendar.sampleEvents.bookClub.title'),
      date: '2025-06-15',
      time: '14:00',
      duration: 90,
      location: t('calendar.sampleEvents.bookClub.location'),
      description: t('calendar.sampleEvents.bookClub.description'),
      category: 'social',
      createdBy: 'admin2',
      maxParticipants: 12,
      participants: ['ret1', 'ret4', 'ret5', 'ret6'],
      status: 'open',
      recurring: 'monthly',
      color: 'green'
    },
    {
      id: '3',
      title: t('calendar.sampleEvents.gardenClub.title'),
      date: '2025-06-18',
      time: '10:30',
      duration: 120,
      location: t('calendar.sampleEvents.gardenClub.location'),
      description: t('calendar.sampleEvents.gardenClub.description'),
      category: 'hobby',
      createdBy: 'ret1',
      maxParticipants: 8,
      participants: ['ret1', 'ret2'],
      status: 'pending',
      recurring: 'none',
      color: 'yellow'
    }
  ]);


  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    description: '',
    category: 'social',
    maxParticipants: 10,
    recurring: 'none'
  });

  // Fetch events from Firestore in real-time
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Get calendar days for current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (day) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return events.filter(event => {
      if (currentUser.role === 'retiree') {
        return event.date === dateStr && (
          event.participants.includes(currentUser.id) ||
          event.createdBy === currentUser.id
        );
      }
      return event.date === dateStr;
    }).filter(event => {
      if (filter === 'all') return true;
      if (filter === 'created') return event.createdBy === currentUser.id;
      if (filter === 'joined') return event.participants.includes(currentUser.id);
      if (filter === 'pending') return event.status === 'pending';
      return event.category === filter;
    }).filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Event color mapping
  const getEventColor = (event) => {
    if (currentUser.role === 'admin') {
      if (event.createdBy === currentUser.id) return 'bg-blue-500';
      if (event.createdBy.startsWith('admin')) return 'bg-green-500';
      return 'bg-yellow-500'; // Retiree submitted
    } else {
      if (event.participants.includes(currentUser.id)) return 'bg-green-500';
      if (event.status === 'pending') return 'bg-orange-500';
      return 'bg-gray-400';
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleJoinEvent = (eventId) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, participants: [...event.participants, currentUser.id] }
        : event
    ));
  };

  const handleLeaveEvent = (eventId) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, participants: event.participants.filter(p => p !== currentUser.id) }
        : event
    ));
  };

  const handleApproveEvent = (eventId) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, status: 'open' }
        : event
    ));
  };

  const handleCreateEvent = async () => {
    const event = {
      ...newEvent,
      createdBy: currentUser.id,
      participants: [currentUser.id],
      status: currentUser.role === 'admin' ? 'open' : 'pending',
      color: currentUser.role === 'admin' ? 'blue' : 'yellow'
    };
    try {
      await addDoc(collection(db, 'events'), event);
      setNewEvent({
        title: '',
        date: '',
        time: '',
        duration: 60,
        location: '',
        description: '',
        category: 'social',
        maxParticipants: 10,
        recurring: 'none'
      });
      setShowCreateModal(false);
    } catch (error) {
      alert('Error creating event: ' + error.message);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const monthNames = [
    t('calendar.months.january'),
    t('calendar.months.february'),
    t('calendar.months.march'),
    t('calendar.months.april'),
    t('calendar.months.may'),
    t('calendar.months.june'),
    t('calendar.months.july'),
    t('calendar.months.august'),
    t('calendar.months.september'),
    t('calendar.months.october'),
    t('calendar.months.november'),
    t('calendar.months.december')
  ];

  const dayNames = [
    t('calendar.days.sun'),
    t('calendar.days.mon'),
    t('calendar.days.tue'),
    t('calendar.days.wed'),
    t('calendar.days.thu'),
    t('calendar.days.fri'),
    t('calendar.days.sat')
  ];

  const isAdmin = currentUser.role === 'admin';

  // Loading skeleton for calendar grid
  const CalendarSkeleton = () => (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 42 }, (_, i) => (
        <div key={i} className="h-24 border border-gray-200 p-1">
          <div className="h-4 bg-gray-200 rounded w-6 mb-1"></div>
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Loading skeleton for events list
  const EventsListSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3 border rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="h-3 bg-gray-200 rounded w-4"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 bg-gray-200 rounded w-4"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="flex space-x-1">
              <div className="h-6 bg-gray-200 rounded w-6"></div>
              <div className="h-6 bg-gray-200 rounded w-6"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="text-blue-600" />
              {t('calendar.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('calendar.welcomeBack', {name: currentUser.name, role: t(`common.${currentUser.role}`)})}
            </p>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                <BarChart3 size={20} />
                {t('dashboard.analytics')}
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
              >
                <Plus size={20} />
                {t('calendar.createEvent')}
              </button>
            </div>
          )}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder={t('calendar.searchEvents')}
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
            <option value="all">{t('calendar.filter.allEvents')}</option>
            {isAdmin ? (
              <>
                <option value="created">{t('calendar.filter.createdByMe')}</option>
                <option value="pending">{t('calendar.filter.pendingApproval')}</option>
              </>
            ) : (
              <>
                <option value="joined">{t('calendar.filter.myEvents')}</option>
                <option value="created">{t('calendar.filter.createdByMe')}</option>
              </>
            )}
            <option value="fitness">{t('calendar.categories.fitness')}</option>
            <option value="social">{t('calendar.categories.social')}</option>
            <option value="hobby">{t('calendar.categories.hobby')}</option>
            <option value="educational">{t('calendar.categories.educational')}</option>
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {t('calendar.month')}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {t('calendar.week')}
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
          {getDaysInMonth().map((day, index) => {
            const dayEvents = getEventsForDate(day);
            
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
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`${getEventColor(event)} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            {event.time}
                          </div>
                          <div className="truncate font-medium">
                            {event.title}
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 3} {t('calendar.more')}
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

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
        <h3 className="font-semibold mb-3">{t('calendar.legend.title')}</h3>
        <div className="flex flex-wrap gap-4">
          {isAdmin ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">{t('calendar.legend.createdByMe')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">{t('calendar.legend.createdByOtherAdmins')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm">{t('calendar.legend.retireeSubmissions')}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">{t('calendar.legend.joinedEvents')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm">{t('calendar.legend.pendingApproval')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className="text-sm">{t('calendar.legend.pastEvents')}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} />
                {selectedEvent.date} {t('calendar.at')} {selectedEvent.time} ({selectedEvent.duration} {t('calendar.min')})
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} />
                {selectedEvent.location}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users size={16} />
                {selectedEvent.participants.length}/{selectedEvent.maxParticipants} {t('calendar.participants')}
              </div>
              <p className="text-gray-700">{selectedEvent.description}</p>
            </div>

            <div className="flex gap-2">
              {isAdmin ? (
                <>
                  {selectedEvent.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleApproveEvent(selectedEvent.id);
                        setShowEventModal(false);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Check size={16} />
                      {t('calendar.approve')}
                    </button>
                  )}
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Edit size={16} />
                    {t('common.edit')}
                  </button>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Trash2 size={16} />
                    {t('common.delete')}
                  </button>
                </>
              ) : (
                <>
                  {selectedEvent.participants.includes(currentUser.id) ? (
                    <button
                      onClick={() => {
                        handleLeaveEvent(selectedEvent.id);
                        setShowEventModal(false);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                      {t('calendar.leaveEvent')}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleJoinEvent(selectedEvent.id);
                        setShowEventModal(false);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg"
                      disabled={selectedEvent.participants.length >= selectedEvent.maxParticipants}
                    >
                      {selectedEvent.participants.length >= selectedEvent.maxParticipants ? t('calendar.full') : t('calendar.joinEvent')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{t('calendar.createNewEvent')}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('calendar.eventTitle')}
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  className="border rounded-lg px-3 py-2"
                />
              </div>

              <input
                type="text"
                placeholder={t('calendar.location')}
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />

              <textarea
                placeholder={t('calendar.description')}
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 h-20"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="social">{t('calendar.categories.social')}</option>
                  <option value="fitness">{t('calendar.categories.fitness')}</option>
                  <option value="hobby">{t('calendar.categories.hobby')}</option>
                  <option value="educational">{t('calendar.categories.educational')}</option>
                </select>
                
                <input
                  type="number"
                  placeholder={t('calendar.maxParticipants')}
                  value={newEvent.maxParticipants}
                  onChange={(e) => setNewEvent({...newEvent, maxParticipants: parseInt(e.target.value)})}
                  className="border rounded-lg px-3 py-2"
                />
              </div>

              <select
                value={newEvent.recurring}
                onChange={(e) => setNewEvent({...newEvent, recurring: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="none">{t('calendar.oneTimeEvent')}</option>
                <option value="weekly">{t('calendar.weekly')}</option>
                <option value="monthly">{t('calendar.monthly')}</option>
              </select>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCreateEvent}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex-1"
                  disabled={!newEvent.title || !newEvent.date || !newEvent.time}
                >
                  {t('calendar.createEvent')}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetireeCalendar;