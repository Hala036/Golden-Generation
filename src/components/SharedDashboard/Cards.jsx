import { useState, useEffect } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaCalendarCheck, FaClock, FaUser, FaFilter, FaTrash } from "react-icons/fa";
import { db, auth } from "../../firebase"; // Import Firebase configuration
import { collection, onSnapshot, query, where, orderBy, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { useLanguage } from "../../context/LanguageContext"; // Import the LanguageContext hook
import AdminEventDetails from "../AdminProfile/AdminEventDetails"; // Import Admin modal
import RetireeEventDetails from "../Calendar/RetireeEventDetails"; // Import Retiree modal
import EmptyState from "../EmptyState"; // Import EmptyState component
import BaseEventDetails from "../Calendar/BaseEventDetails"; // Import BaseEventDetails component
import { getAllSettlements } from '../../utils/getSettlements';

// Import local images for fallback
import TripImg from "../../assets/Trip.png";
import VacationImg from "../../assets/Vacation.png";
import WorkshopImg from "../../assets/Workshop.png";
import LectureImg from "../../assets/Lecture.png";
import HousePartyImg from "../../assets/HouseParty.png";
import SocialEventImg from "../../assets/SocialEvent.png";

// Map local images to categories
const categoryImages = {
  trip: TripImg,
  vacation: VacationImg,
  workshop: WorkshopImg,
  lecture: LectureImg,
  houseparty: HousePartyImg,
  socialevent: SocialEventImg,
};

// Feedback Modal Component (simple scaffold)
const FeedbackModal = ({ eventId, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h2 className="text-lg font-bold mb-4">Rate this event</h2>
        <div className="flex gap-1 mb-4">
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >★</button>
          ))}
        </div>
        <textarea
          className="w-full border rounded p-2 mb-4"
          rows={3}
          placeholder="Leave a comment (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded font-bold w-full"
          onClick={() => onSubmit(eventId, rating, comment)}
          disabled={rating === 0}
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
};

const Cards = ({ setSelected }) => {
  const { language, t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('retiree');
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(null); // eventId or null
  const [eventToRepeat, setEventToRepeat] = useState(null); // event object or null
  const [settlements, setSettlements] = useState([]);
  const [settlementFilter, setSettlementFilter] = useState('all');
  const [userSettlement, setUserSettlement] = useState('');

  // Get current user and fetch their role
  useEffect(() => {
    const fetchUserAndRole = async () => {
    const user = auth.currentUser;
    setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'retiree');
        }
      }
    };
    fetchUserAndRole();
  }, []);

  // Fetch settlements for superadmin/admin
  useEffect(() => {
    if (userRole === 'superadmin') {
      getAllSettlements().then(setSettlements);
    } else if (userRole === 'admin') {
      // Fetch admin's settlement
      const fetchUserSettlement = async () => {
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserSettlement((data.idVerification && data.idVerification.settlement) || data.settlement || '');
        }
      };
      fetchUserSettlement();
    }
  }, [userRole]);

  // Helper function to check if event is upcoming
  const isEventUpcoming = (event) => {
    const now = new Date();
    let eventDate;
    if (event.startDate && event.startDate.includes('-')) {
      const parts = event.startDate.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 2) {
          // DD-MM-YYYY format
          const [day, month, year] = parts;
          eventDate = new Date(year, month - 1, day);
        } else {
          // YYYY-MM-DD format
          const [year, month, day] = parts;
          eventDate = new Date(year, month - 1, day);
        }
      }
    }
    if (!eventDate || isNaN(eventDate.getTime())) return false;

    // Use timeTo (end time) if available, otherwise timeFrom (start time), otherwise end of day
    if (event.timeTo) {
      const [hours, minutes] = event.timeTo.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);
    } else if (event.timeFrom) {
      const [hours, minutes] = event.timeFrom.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);
    } else {
      eventDate.setHours(23, 59, 59, 999);
    }

    return eventDate > now;
  };

  // Helper function to sort events by date (upcoming first)
  const sortEventsByDate = (eventsList) => {
    return eventsList.sort((a, b) => {
      const getEventDateTime = (event) => {
        let eventDate;
        if (event.startDate && event.startDate.includes('-')) {
          const parts = event.startDate.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 2) {
              // DD-MM-YYYY format
              const [day, month, year] = parts;
              eventDate = new Date(year, month - 1, day);
            } else {
              // YYYY-MM-DD format
              const [year, month, day] = parts;
              eventDate = new Date(year, month - 1, day);
            }
          }
        }
        
        if (!eventDate || isNaN(eventDate.getTime())) {
          return new Date(0); // Invalid dates go to the end
        }
        
        // If event has time, combine date and time
        if (event.timeFrom) {
          const [hours, minutes] = event.timeFrom.split(':').map(Number);
          eventDate.setHours(hours, minutes, 0, 0);
        }
        
        return eventDate;
      };
      
      const dateA = getEventDateTime(a);
      const dateB = getEventDateTime(b);
      return dateA - dateB;
    });
  };

  // Helper function to check if event was created by current user
  const isEventCreatedByMe = (event) => {
    return currentUser && event.createdBy === currentUser.uid;
  };

  // Helper to determine if event is past
  const isPastEvent = (event) => {
    const now = new Date();
    let eventDate;
    if (event.endDate && event.endDate.includes('-')) {
      const parts = event.endDate.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 2) {
          // DD-MM-YYYY
          const [day, month, year] = parts;
          eventDate = new Date(year, month - 1, day);
        } else {
          // YYYY-MM-DD
          const [year, month, day] = parts;
          eventDate = new Date(year, month - 1, day);
        }
      }
    }
    if (!eventDate || isNaN(eventDate.getTime())) return false;

    // Use timeTo (end time) if available, otherwise timeFrom (start time), otherwise end of day
    if (event.timeTo) {
      const [hours, minutes] = event.timeTo.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);
    } else if (event.timeFrom) {
      const [hours, minutes] = event.timeFrom.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);
    } else {
      eventDate.setHours(23, 59, 59, 999);
    }

    return eventDate < now;
  };

  // Fetch categories and events from Firestore in real-time
  useEffect(() => {
    const fetchCategories = async () => {
        const categoriesRef = collection(db, "categories");
        const categoriesSnapshot = await onSnapshot(categoriesRef, (snapshot) => {
            const categoriesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCategories(categoriesData);
        });
        return categoriesSnapshot;
    };

    const fetchEvents = () => {
        setLoading(true);
        const eventsRef = collection(db, "events");
        
        // Fetch all events and filter on client side due to date format differences
        const eventsQuery = query(
          eventsRef,
          orderBy("createdAt", "desc") // Order by creation date for better performance
        );
        
        const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
            const eventsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                        
            // Filter events based on role (do NOT filter by isEventUpcoming here)
            const roleBasedEvents = userRole === 'admin' || userRole === 'superadmin'
                ? eventsData.filter(event => (event.status === 'active' || event.status === 'pending' || event.status === 'completed'))
                : eventsData.filter(event => (event.status === 'active' || event.status === 'completed' || (event.status === 'pending' && event.createdBy === (currentUser && currentUser.uid))));
                        
            // Sort events by date (upcoming first)
            const sortedEvents = sortEventsByDate(roleBasedEvents);
                        
            setEvents(sortedEvents);
            setFilteredEvents(sortedEvents);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching events in real-time:", error);
        setLoading(false);
        });
        return unsubscribe;
    };

    fetchCategories();
    const unsubscribeEvents = fetchEvents();

    return () => {
      // Unsubscribe from listeners when component unmounts
      unsubscribeEvents();
    };
  }, [userRole]);

  // Apply filters (category, search, my events, settlement)
  useEffect(() => {
    let filtered = events;

    // Filter by "My Events Only" if enabled
    if (showMyEventsOnly && currentUser) {
      filtered = filtered.filter(event =>
        event.createdBy === currentUser.uid ||
        (Array.isArray(event.participants) && event.participants.includes(currentUser.uid))
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(event => event.categoryId === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Settlement filter
    if (settlementFilter !== 'all') {
      if (userRole === 'admin' && settlementFilter === 'my-settlement') {
        filtered = filtered.filter(event => event.settlement === userSettlement);
      } else {
        filtered = filtered.filter(event => event.settlement === settlementFilter);
      }
    }

    setFilteredEvents(filtered);
  }, [events, selectedCategory, searchQuery, showMyEventsOnly, currentUser, settlementFilter, userRole, userSettlement]);

  // Handle category filter
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Handle search input
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
  };

  // Handle "My Events Only" toggle
  const handleMyEventsToggle = () => {
    setShowMyEventsOnly(!showMyEventsOnly);
  };

  // Log filteredEvents before filtering for past events
  const displayedEvents = showPast
    ? filteredEvents.filter(event => {
        const result = isPastEvent(event) &&
          (
            userRole === 'admin' || userRole === 'superadmin' ||
            (currentUser && (
              event.createdBy === currentUser.uid ||
              (Array.isArray(event.participants) && event.participants.includes(currentUser.uid))
            ))
          );
        return result;
      })
    : filteredEvents.filter(event => !isPastEvent(event));

  // Conditionally render the correct modal based on the user's role
  const renderEventDetailsModal = () => {
    if (!selectedEvent) return null;

    const isCreator = selectedEvent.createdBy === currentUser?.uid;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';

    return (
      <BaseEventDetails
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        userRole={userRole}
        showParticipants={isAdmin || isCreator}
        showJoinLeave={!isAdmin && !isCreator}
      />
    );
  };

  const handleFeedbackSubmit = (eventId, rating, comment) => {
    // TODO: Save feedback to your database and mark event as feedbackGiven for this user
    alert(`Feedback submitted! Rating: ${rating}, Comment: ${comment}`);
    setShowFeedbackModal(null);
  };

  const handleRepeatEvent = (event) => {
    setEventToRepeat(event);
    // TODO: Open your event creation form/modal pre-filled with event's data
    alert('Repeat event: open event creation form pre-filled with this event\'s data.');
  };

  // Delete event handler (copied from BaseEventDetails)
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
    try {
      const eventRef = doc(db, 'events', eventId);
      // Batch delete participants subcollection and the event itself
      const participantsSnapshot = await getDocs(collection(db, `events/${eventId}/participants`));
      const batch = writeBatch(db);
      participantsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      batch.delete(eventRef);
      await batch.commit();
      // Remove from UI
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setFilteredEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event.');
    }
  };

  return (
    <div className="bg-white p-3">
      {/* Header showing upcoming events */}
      <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-400">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <FaCalendarCheck className="mr-2 text-yellow-600" />
          {t("dashboard.events.upcomingEvents") || "Upcoming Events"}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {t("dashboard.events.upcomingEventsDescription") || "Discover and join exciting events happening soon"}
        </p>
      </div>

      {/* Search Bar and Filter */}
      <div className="sticky top-0 bg-white z-50 flex flex-col sm:flex-row items-start sm:items-center justify-between p-1 shadow-sm w-full">
        <div className="flex items-center max-w-full sm:max-w-md border px-3 py-2 rounded-md bg-white shadow-sm w-full">
          <FaSearch className="text-gray-500" />
          <input
            type="text"
            placeholder={t("dashboard.search.searchEvents")}
            className="border-none outline-none text-sm ml-2 w-full"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <select
            className="border px-2 py-1 rounded-md text-sm"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="all">{t("dashboard.filter.allCategories")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.translations[language]} {/* Display translation based on current language */}
              </option>
            ))}
          </select>
          <select
            className="border px-2 py-1 rounded-md text-sm"
            value={settlementFilter}
            onChange={(e) => setSettlementFilter(e.target.value)}
          >
            <option value="all">{t('dashboard.events.allSettlements')}</option>
            {userRole === 'admin' && <option value="my-settlement">{t('eventDetails.mySettlement')}</option>}
            {userRole === 'superadmin' && settlements.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={handleMyEventsToggle}
            className={`p-2 rounded-md text-sm flex items-center gap-1 transition-colors ${
              showMyEventsOnly 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={showMyEventsOnly ? "Show all events" : "Show only my events"}
          >
            <FaUser className="text-xs" />
            <span className="hidden sm:inline">
              {showMyEventsOnly ? t("dashboard.filter.myEventsOnly") || "My Events" : t("dashboard.filter.myEvents") || "My Events"}
            </span>
          </button>
          <button
            title="Go to Calendar"
            onClick={() => setSelected && setSelected('calendar')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FaCalendarAlt className="text-xl text-blue-600" />
          </button>
        </div>
      </div>

      {/* Badges Row */}
      <div className="w-full flex flex-wrap gap-2 items-center mb-4 relative z-0">
        {showMyEventsOnly && (
          <span className="bg-blue-700 text-white px-3 py-1 rounded-full font-bold text-xs">{t('eventDetails.createdByMe')}</span>
        )}
      </div>

      {/* Tabs for Upcoming/Past Events */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded ${!showPast ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setShowPast(false)}
        >
          {t("dashboard.events.upcomingEvents") || "Upcoming Events"}
        </button>
        <button
          className={`px-4 py-2 rounded ${showPast ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setShowPast(true)}
        >
          {t("dashboard.events.pastEvents") || "Past Events"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          <span className="ml-2 text-gray-600">{t('eventDetails.loading')}</span>
        </div>
      )}

      {/* Events Grid */}
      {!loading && (
        <>
          {displayedEvents.length === 0 ? (
            <EmptyState
              icon={<FaCalendarCheck className="text-6xl text-gray-300" />}
              title={showPast ? t("dashboard.events.noPastEvents") || "No past events" : (searchQuery || selectedCategory !== "all" 
                ? t("dashboard.events.noUpcomingEventsFilter") || "No upcoming events found"
                : t("dashboard.events.noUpcomingEvents") || "No upcoming events"
              )}
              message={showPast ? t('emptyStates.noPastEventsMessage') || "No events have ended yet." : (searchQuery || selectedCategory !== "all" 
                ? t('emptyStates.noUpcomingEventsFilterMessage') || "Try adjusting your search or filter criteria"
                : t('emptyStates.noUpcomingEventsMessage') || "Check back later for new events or browse past events in the calendar"
              )}
              className="p-8"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
              {displayedEvents.map((event) => {
                const backgroundImage = event.imageUrl || categoryImages[event.categoryId] || SocialEventImg;
                const isMyEvent = currentUser && event.createdBy === currentUser.uid;
                const isJoined = currentUser && Array.isArray(event.participants) && event.participants.includes(currentUser.uid);
                const categoryName = categories.find((cat) => cat.id === event.categoryId)?.translations?.[language] || event.categoryId;
                const statusColor = event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                   event.status === 'active' ? 'bg-green-100 text-green-800' : 
                                   event.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                   'bg-gray-200 text-gray-700';
                const past = isPastEvent(event);
                return (
                  <div
                    key={event.id}
                    className={`bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-[320px] hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 group ${past ? 'opacity-60 grayscale relative' : ''}`}
                    aria-label={`Event card: ${event.title}`}
                  >
                    {/* Past badge */}
                    {past && <span className="absolute top-2 left-2 bg-gray-700 text-white px-2 py-1 rounded-full text-xs shadow z-20">Past</span>}
                    {/* Image with overlay and badges */}
                    <div className="mb-2 md:mb-2 relative cursor-pointer" onClick={() => setExpandedImage(backgroundImage)}>
                      <img
                        src={backgroundImage}
                        alt={event.title}
                        className="w-full h-26 md:h-28 object-cover rounded-md transition-transform duration-200 hover:scale-105"
                      />
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-2 z-10">
                        {isMyEvent && <span className="bg-blue-700 text-white px-2 py-1 rounded-full text-xs shadow">{t("dashboard.events.createdByMe") || "Created by me"}</span>}
                        {isJoined && <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs shadow flex items-center"><svg className="w-3 h-3 mr-1 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>{t("dashboard.events.joined") || "Joined"}</span>}
                      </div>
                      {/* Category chip */}
                      <span className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs shadow">{categoryName}</span>
                      {/* Status indicator */}
                      <span className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold shadow ${statusColor}`}>{event.status}</span>
                      {/* Gradient overlay */}
                      <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between p-4">
                      <div>
                        {/* Organizer info (avatar/initials) */}
                        {event.organizerName && (
                          <div className="flex items-center mb-1">
                            <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs mr-2">
                              {event.organizerInitials || event.organizerName.split(' ').map((n) => n[0]).join('').toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-500">{event.organizerName}</span>
                          </div>
                        )}
                        <h3 className="text-lg font-bold mb-1 line-clamp-1" title={event.title}>{event.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <FaCalendarAlt className="mr-1 text-yellow-400" /> {event.startDate}{event.endDate ? ` - ${event.endDate}` : ''}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <FaClock className="mr-1 text-yellow-400" /> {event.timeFrom} - {event.timeTo}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <FaMapMarkerAlt className="mr-1 text-yellow-400" /> {event.location}
                        </div>
                        {/* Participants */}
                        <div className="flex items-center text-xs text-gray-400 mt-1">
                          <FaUser className="mr-1" /> {event.participants?.length || 0} {t("dashboard.events.participants") || "joined"}
                        </div>
                        {/* Description */}
                        <p className="text-gray-500 text-xs mt-2 line-clamp-2" title={event.description}>
                          {event.description}
                        </p>
                        {/* Repeat and Feedback for past events */}
                        {past && (
                          <div className="flex gap-2 mt-2 items-center">
                            {/* Remove Repeat Event button */}
                            {isJoined && !event.feedbackGiven && (
                              <button
                                className="text-blue-600 underline text-xs font-bold"
                                onClick={() => setShowFeedbackModal(event.id)}
                              >
                                Rate this event
                              </button>
                            )}
                            {/* Delete button for past events (creator, admin, superadmin) */}
                            {(isMyEvent || userRole === 'admin' || userRole === 'superadmin') && (
                              <button
                                style={{ filter: 'none', opacity: 1 }}
                                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold border border-red-700 ml-2 shadow z-10"
                                onClick={() => handleDeleteEvent(event.id)}
                                title="Delete Event"
                              >
                                <FaTrash className="text-xs" /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Footer */}
                      <div className="mt-4 flex justify-end border-t pt-2">
                        <button
                          className="bg-[#FFD966] hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400 group-hover:scale-105"
                          onClick={() => setSelectedEvent(event)}
                          aria-label={t("dashboard.events.moreDetails")}
                        >
                          {t("dashboard.events.moreDetails")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Centralized Event Details Modal */}
      {renderEventDetailsModal()}

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-200 z-10"
              onClick={() => setExpandedImage(null)}
              aria-label="Close"
            >
              <span className="text-xl font-bold">&times;</span>
            </button>
            <img
              src={expandedImage}
              alt="Expanded Event"
              className="rounded-lg max-h-[60vh] max-w-[70vw] shadow-2xl"
            />
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <FeedbackModal
          eventId={showFeedbackModal}
          onClose={() => setShowFeedbackModal(null)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
);
};

export default Cards;
