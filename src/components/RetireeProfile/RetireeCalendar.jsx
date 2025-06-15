//RetireeCalendar.jsx

import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, addDoc, getDocs, serverTimestamp, doc, getDoc, onSnapshot } from "firebase/firestore";
//import { Calendar, X } from "lucide-react";
import EventDetails from './EventDetails';
import AdminEventDetails from '../AdminProfile/AdminEventDetails';
//import { BarChart3, X, Plus, Calendar, Search, Clock } from "lucide-react";
import { Calendar, Clock, Users, MapPin, Bell, Plus, Edit, Trash2, Eye, Check, X, Filter, Search, Settings, Award, BarChart3 } from 'lucide-react';
const RetireeCalendar = () => {
  // Calendar state
  const [currentUser] = useState({
    id: 'admin1',
    role: 'admin', // Switch to 'retiree' to see retiree view
    name: 'Admin Sarah'
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [eventData, setEventData] = useState({
    title: "",
    categoryId: "",
    date: "",
    time: "",
    duration: 60,
    location: "",
    description: "",
    capacity: "",
    requirements: ""
  });
  const [loading, setLoading] = useState(true);

  // Real-time fetch events from Firestore
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'events'), (querySnapshot) => {
      const eventsFromDb = [];
      querySnapshot.forEach((doc) => {
        eventsFromDb.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsFromDb);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesRef = collection(db, "categories");
      const categoriesSnapshot = await getDocs(categoriesRef);
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setEventData((prev) => ({ ...prev, categoryId: categoriesData[0].id }));
      }
    };
    fetchCategories();
  }, []);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setUserRole(userDoc.data().role);
      }
    };
    fetchUserRole();
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
          event.participants?.includes(currentUser.id) ||
          event.createdBy === currentUser.id
        );
      }
      return event.date === dateStr;
    }).filter(event => {
      if (filter === 'all') return true;
      if (filter === 'created') return event.createdBy === currentUser.id;
      if (filter === 'joined') return event.participants?.includes(currentUser.id);
      if (filter === 'pending') return event.status === 'pending';
      return event.category === filter;
    }).filter(event => 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Event color mapping
  const getEventColor = (event) => {
    if (currentUser.role === 'admin') {
      if (event.createdBy === currentUser.id) return 'bg-blue-500';
      if (event.createdBy?.startsWith('admin')) return 'bg-green-500';
      return 'bg-yellow-500'; // Retiree submitted
    } else {
      if (event.participants?.includes(currentUser.id)) return 'bg-green-500';
      if (event.status === 'pending') return 'bg-orange-500';
      return 'bg-gray-400';
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleJoinEvent = (eventId) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, participants: [...(event.participants || []), currentUser.id] }
        : event
    ));
  };

  const handleLeaveEvent = (eventId) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, participants: (event.participants || []).filter(p => p !== currentUser.id) }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userSettlement = userDoc.exists() ? userDoc.data().idVerification?.settlement : "";
      let eventStatus = "active";
      let eventColor = "yellow";
      if (userRole === "retiree") {
        eventStatus = "pending";
        eventColor = "green";
      } else if (userRole === "admin" || userRole === "superadmin") {
        eventColor = "blue";
      }
      const newEvent = {
        ...eventData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        participants: [],
        status: eventStatus,
        color: eventColor,
        settlement: userSettlement
      };
      await addDoc(collection(db, "events"), newEvent);
      setShowCreateModal(false);
      setEventData({
        title: "",
        categoryId: categories.length > 0 ? categories[0].id : "",
        date: "",
        time: "",
        duration: 60,
        location: "",
        description: "",
        capacity: "",
        requirements: ""
      });
    } catch (error) {
      console.error('Error creating event:', error);
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
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="text-blue-600" />
              Retiree Activity Calendar
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {currentUser.name} ({currentUser.role})
            </p>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                <BarChart3 size={20} />
                Dashboard
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
              >
                <Plus size={20} />
                Create Event
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
            {isAdmin ? (
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
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
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
                          +{dayEvents.length - 3} more
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
        <h3 className="font-semibold mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          {isAdmin ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Created by me</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Created by other admins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm">Retiree submissions</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Joined events</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm">Pending approval</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className="text-sm">Past events</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && currentUser.role === 'admin' && (
        <AdminEventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
      {selectedEvent && currentUser.role === 'retiree' && (
        <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create New Event</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Event title"
                value={eventData.title}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              
              <select
                name="categoryId"
                value={eventData.categoryId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name || cat.translations?.en || cat.id}</option>
                ))}
              </select>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  name="date"
                  value={eventData.date}
                  onChange={handleChange}
                  className="border rounded-lg px-3 py-2"
                  required
                />
                <input
                  type="time"
                  name="time"
                  value={eventData.time}
                  onChange={handleChange}
                  className="border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <input
                type="number"
                name="duration"
                placeholder="Duration (minutes)"
                value={eventData.duration}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={eventData.location}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />

              <textarea
                name="description"
                placeholder="Description"
                value={eventData.description}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 h-20"
                required
              />

              <input
                type="number"
                name="capacity"
                placeholder="Max participants"
                value={eventData.capacity}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
              
              <textarea
                name="requirements"
                placeholder="Special requirements"
                value={eventData.requirements}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 h-12"
              />

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex-1"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetireeCalendar;