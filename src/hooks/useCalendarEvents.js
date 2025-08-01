import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { formatDateToDDMMYYYY, isUpcoming, parseDDMMYYYY } from '../utils/calendarUtils';
import { toast } from 'react-hot-toast';

export const useCalendarEvents = (userRole) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSettlement, setUserSettlement] = useState(null);
  const [categories, setCategories] = useState([]);

  // Fetch user's settlement
  useEffect(() => {
    const fetchUserSettlement = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserSettlement(
            (data.idVerification && data.idVerification.settlement) ||
            data.settlement ||
            ""
          );
        }
      } catch (error) {
        console.error('Error fetching user settlement:', error);
      }
    };

    fetchUserSettlement();
  }, []);

  useEffect(() => {
    setLoading(true);

    // 1. Fetch all categories first and create a map for easy lookup.
    const categoriesRef = collection(db, 'categories');
    onSnapshot(categoriesRef, (categorySnapshot) => {
      const categoryMap = new Map();
      const categoriesList = [];
      categorySnapshot.forEach(doc => {
        const categoryData = { id: doc.id, ...doc.data() };
        categoryMap.set(doc.id, categoryData);
        categoriesList.push(categoryData);
      });
      setCategories(categoriesList);

      // 2. Fetch all events and "join" them with their category data.
      const eventsRef = collection(db, 'events');
      const unsubEvents = onSnapshot(eventsRef, (querySnapshot) => {
        const eventsFromDb = [];
        querySnapshot.forEach((doc) => {
          const eventData = doc.data();
          const category = categoryMap.get(eventData.categoryId);
          let eventDate = eventData.date || eventData.startDate;
          
          // Try to use createdAt if no date/startDate
          if (!eventDate && eventData.createdAt && eventData.createdAt.toDate) {
            const d = eventData.createdAt.toDate();
            eventDate = formatDateToDDMMYYYY(d);
          } else {
            eventDate = formatDateToDDMMYYYY(eventDate);
          }

          // Only push events with a valid date
          if (eventDate) {
            eventsFromDb.push({
              id: doc.id,
              ...eventData,
              date: eventDate,
              startDate: eventData.startDate ? formatDateToDDMMYYYY(eventData.startDate) : eventDate,
              endDate: eventData.endDate ? formatDateToDDMMYYYY(eventData.endDate) : eventDate,
              category: category || { id: eventData.categoryId, name: 'Unknown Category' }
            });
          }
        });
        setEvents(eventsFromDb);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
        setLoading(false);
      });

      return () => unsubEvents();
    });

  }, []);

  // Enhanced filtering function with more options
  const getFilteredEvents = (date, filter = 'all', searchTerm = '', additionalFilters = {}) => {
    const {
      statusFilter = 'all',
      categoryFilter = 'all',
      dateRange = 'all',
      settlementFilter = 'all'
    } = additionalFilters;

    let filteredEvents = [...events];

    // Date-specific filtering
    if (date) {
      // Always convert incoming date to DD-MM-YYYY for comparison
      const filterDateStr = formatDateToDDMMYYYY(date);
      if (filter === 'upcoming') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = event.date || event.startDate;
          if (!eventDate) return false;
          
          let parsedDate;
          if (eventDate.includes('-')) {
            const parts = eventDate.split('-');
            if (parts[0].length === 4) {
              // YYYY-MM-DD format
              parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
              // DD-MM-YYYY format
              parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
            }
          }
          
          if (!parsedDate || isNaN(parsedDate.getTime())) return false;
          
          return parsedDate >= today;
        });
      } else {
        // Specific date filtering (fix: compare using DD-MM-YYYY)
        filteredEvents = filteredEvents.filter(event => {
          // Use event.date, event.startDate, event.endDate all in DD-MM-YYYY
          const eventStartStr = event.startDate ? formatDateToDDMMYYYY(event.startDate) : (event.date ? formatDateToDDMMYYYY(event.date) : null);
          const eventEndStr = event.endDate ? formatDateToDDMMYYYY(event.endDate) : eventStartStr;
          if (!eventStartStr || !filterDateStr) return false;
          // Compare as strings
          return filterDateStr >= eventStartStr && filterDateStr <= eventEndStr;
        });
      }
    }

    // Role-based visibility filtering
    filteredEvents = filteredEvents.filter(event => {
      // SuperAdmin: see all events
      if (userRole === 'superadmin') {
        return true;
      }
      
      // Admin: see all events in their settlement, plus pending events from their settlement
      if (userRole === 'admin') {
        if (event.status === 'pending') {
          // Only show pending events from this admin's settlement
          return event.settlement === userSettlement;
        }
        return true;
      }
      
      // Retiree: see only their own events (including pending) and events they joined
      if (userRole === 'retiree') {
        return (
          event.createdBy === auth.currentUser?.uid ||
          event.participants?.includes(auth.currentUser?.uid)
        );
      }
      
      // Default: show open/approved events if joined, created, or open to all
      return (
        event.participants?.includes(auth.currentUser?.uid) ||
        event.createdBy === auth.currentUser?.uid ||
        event.status === 'open' ||
        event.status === 'active'
      );
    });

    // Status filtering
    if (statusFilter !== 'all') {
      filteredEvents = filteredEvents.filter(event => {
        switch (statusFilter) {
          case 'pending':
            // Only show pending events to the creator, admin of settlement, or superadmin
            if (userRole === 'superadmin') return event.status === 'pending';
            if (userRole === 'admin') return event.status === 'pending' && event.settlement === userSettlement;
            if (userRole === 'retiree') return event.status === 'pending' && event.createdBy === auth.currentUser?.uid;
            return false;
          case 'pending-approval':
            // Same logic as pending for admin/superadmin
            if (userRole === 'superadmin') return event.status === 'pending';
            if (userRole === 'admin') return event.status === 'pending' && event.settlement === userSettlement;
            return false;
          case 'approved':
            return event.status === 'active' || event.status === 'open';
          case 'completed':
            return event.status === 'completed';
          case 'my-pending':
            return event.status === 'pending' && event.createdBy === auth.currentUser?.uid;
          case 'my-approved':
            return (event.status === 'active' || event.status === 'open') && 
                   (event.createdBy === auth.currentUser?.uid || event.participants?.includes(auth.currentUser?.uid));
          default:
            return true;
        }
      });
    }

    // Category filtering
    if (categoryFilter !== 'all') {
      filteredEvents = filteredEvents.filter(event => {
        if (typeof categoryFilter === 'string') {
          return event.category?.id === categoryFilter || event.category?.name?.toLowerCase() === categoryFilter.toLowerCase();
        }
        return true;
      });
    }

    // Settlement filtering (for admins and superadmin)
    if (settlementFilter !== 'all' && (userRole === 'admin' || userRole === 'superadmin')) {
      filteredEvents = filteredEvents.filter(event => {
        if (userRole === 'admin' && settlementFilter === 'my-settlement') {
          return event.settlement === userSettlement;
        }
        return event.settlement === settlementFilter;
      });
    }

    // Date range filtering
    if (dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = event.date || event.startDate;
        if (!eventDate) return false;
        
        let parsedDate;
        if (eventDate.includes('-')) {
          const parts = eventDate.split('-');
          if (parts[0].length === 4) {
            parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
          } else {
            parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
          }
        }
        
        if (!parsedDate || isNaN(parsedDate.getTime())) return false;
        
        switch (dateRange) {
          case 'today':
            return parsedDate.getTime() === today.getTime();
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return parsedDate.getTime() === tomorrow.getTime();
          case 'this-week':
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return parsedDate >= weekStart && parsedDate <= weekEnd;
          case 'this-month':
            return parsedDate.getMonth() === today.getMonth() && parsedDate.getFullYear() === today.getFullYear();
          case 'next-week':
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(nextWeekStart.getDate() + 7);
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
            return parsedDate >= nextWeekStart && parsedDate <= nextWeekEnd;
          default:
            return true;
        }
      });
    }

    // Basic filter options
    if (filter !== 'all') {
      filteredEvents = filteredEvents.filter(event => {
        switch (filter) {
          case 'created':
            return event.createdBy === auth.currentUser?.uid;
          case 'joined':
            return event.participants?.includes(auth.currentUser?.uid);
          case 'pending':
            // Only show pending events to the creator, admin of settlement, or superadmin
            if (userRole === 'superadmin') return event.status === 'pending';
            if (userRole === 'admin') return event.status === 'pending' && event.settlement === userSettlement;
            if (userRole === 'retiree') return event.status === 'pending' && event.createdBy === auth.currentUser?.uid;
            return false;
          default:
            // Category-based filtering (legacy support)
            return event.category?.name?.toLowerCase() === filter.toLowerCase();
        }
      });
    }

    // Search filtering
    if (searchTerm) {
      filteredEvents = filteredEvents.filter(event => 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredEvents;
  };

  return {
    events,
    loading,
    getFilteredEvents,
    userSettlement,
    categories
  };
}; 