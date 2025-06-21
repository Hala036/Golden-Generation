import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { formatDateToDDMMYYYY, isUpcoming, parseDDMMYYYY } from '../utils/calendarUtils';
import { toast } from 'react-hot-toast';

export const useCalendarEvents = (userRole) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSettlement, setUserSettlement] = useState(null);

  // Fetch user's settlement
  useEffect(() => {
    const fetchUserSettlement = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserSettlement(userDoc.data().idVerification?.settlement);
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
      categorySnapshot.forEach(doc => {
        categoryMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

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
              category: category || { id: eventData.categoryId }
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

  // Filter events based on user role and settlement
  const getFilteredEvents = (date, filter = 'all', searchTerm = '') => {
    if (!date) return [];
    
    // For upcoming filter, we want all future events
    if (filter === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return events.filter(event => {
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
        
        // For retirees, only show relevant events
        if (userRole === 'retiree') {
          return parsedDate >= today && (
            event.participants?.includes(auth.currentUser?.uid) ||
            event.createdBy === auth.currentUser?.uid ||
            event.status === 'open'
          );
        }
        
        // For admins, show all future events
        return parsedDate >= today;
      });
    }
    
    // For other filters, use the existing date-specific filtering
    const dateStr = formatDateToDDMMYYYY(date);
    
    return events.filter(event => {
      if (!event.startDate && !event.date) return false;
      // Use startDate and endDate for range check
      const eventStart = event.startDate ? parseDDMMYYYY(event.startDate) : null;
      const eventEnd = event.endDate ? parseDDMMYYYY(event.endDate) : eventStart;
      const current = parseDDMMYYYY(dateStr);
      if (!eventStart || !current) return false;
      // Check if current date is within event range (inclusive)
      const inRange = current >= eventStart && current <= eventEnd;
      if (!inRange) return false;
      // Admin: see all events in their settlement
      if (userRole === 'admin') {
        if (event.status === 'pending') {
          // Only show pending retiree events in this admin's settlement
          return (!event.settlement || event.settlement === userSettlement);
        }
        return true;
      }
      // Retiree:
      if (event.status === 'pending') {
        // Only show if created by this retiree
        return event.createdBy === auth.currentUser?.uid;
      }
      // Show open events if joined, created, or open to all
      return (
        event.participants?.includes(auth.currentUser?.uid) ||
        event.createdBy === auth.currentUser?.uid ||
        event.status === 'open'
      );
    }).filter(event => {
      // Apply category filter
      if (filter === 'all') return true;
      if (filter === 'created') return event.createdBy === auth.currentUser?.uid;
      if (filter === 'joined') return event.participants?.includes(auth.currentUser?.uid);
      if (filter === 'pending') return event.status === 'pending';
      return event.category === filter;
    }).filter(event => 
      // Apply search filter
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return {
    events,
    loading,
    getFilteredEvents,
    userSettlement
  };
}; 