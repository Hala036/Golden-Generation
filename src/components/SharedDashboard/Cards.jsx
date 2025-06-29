import { useState, useEffect } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaCalendarCheck, FaClock, FaUser, FaFilter} from "react-icons/fa";
import { db, auth } from "../../firebase"; // Import Firebase configuration
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useLanguage } from "../../context/LanguageContext"; // Import the LanguageContext hook
import AdminEventDetails from "../AdminProfile/AdminEventDetails"; // Import Admin modal
import RetireeEventDetails from "../Calendar/RetireeEventDetails"; // Import Retiree modal
import EmptyState from "../EmptyState"; // Import EmptyState component

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

const Cards = ({ userRole = 'retiree', setSelected }) => {
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
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);

  // Get current user
  useEffect(() => {
    const user = auth.currentUser;
    setCurrentUser(user);
  }, []);

  // Helper function to check if event is upcoming
  const isEventUpcoming = (event) => {
    const now = new Date();
    
    // Parse the event date from DD-MM-YYYY format
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
      return false;
    }
    
    // If event has time, combine date and time
    if (event.timeFrom) {
      const [hours, minutes] = event.timeFrom.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);
    } else {
      // If no time specified, set to end of day
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
            
            console.log('All events fetched:', eventsData.length);
            console.log('Sample event:', eventsData[0]);
            
            // Filter events based on role and ensure they're upcoming
            const roleBasedEvents = userRole === 'admin'
                ? eventsData.filter(event => 
                    (event.status === 'active' || event.status === 'pending') && 
                    isEventUpcoming(event)
                  )
                : eventsData.filter(event => 
                    event.status === 'active' && 
                    isEventUpcoming(event)
                  );
            
            console.log('Role-based filtered events:', roleBasedEvents.length);
            console.log('Sample filtered event:', roleBasedEvents[0]);
            
            // Sort events by date (upcoming first)
            const sortedEvents = sortEventsByDate(roleBasedEvents);
            
            console.log('Final sorted events:', sortedEvents.length);
            
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

  // Apply filters (category, search, and my events)
  useEffect(() => {
    let filtered = events;

    // Filter by "My Events Only" if enabled
    if (showMyEventsOnly && currentUser) {
      filtered = filtered.filter(event => isEventCreatedByMe(event));
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

    setFilteredEvents(filtered);
  }, [events, selectedCategory, searchQuery, showMyEventsOnly, currentUser]);

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

  // Conditionally render the correct modal based on the user's role
  const renderEventDetailsModal = () => {
    if (!selectedEvent) return null;

    const modalProps = {
      event: selectedEvent,
      onClose: () => setSelectedEvent(null),
    };

    if (userRole === 'admin') {
      return <AdminEventDetails {...modalProps} />;
      }
    return <RetireeEventDetails {...modalProps} />;
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
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-1 shadow-sm w-full">
            <div className="flex items-center max-w-md border px-3 py-2 rounded-md bg-white shadow-sm w-full">
              <FaSearch className="text-gray-500" />
              <input
                type="text"
                placeholder={t("dashboard.search.searchEvents")}
                className="border-none outline-none text-sm ml-2 w-full"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <select
              className="ml-4 border px-2 py-1 rounded-md text-sm"
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
            {/* My Events Only Filter */}
            <button
              onClick={handleMyEventsToggle}
              className={`ml-2 p-2 rounded-md text-sm flex items-center gap-1 transition-colors ${
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
              className="ml-2 p-2 rounded-full hover:bg-gray-100"
            >
              <FaCalendarAlt className="text-xl text-blue-600" />
            </button>
          </div>
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
              <span className="ml-2 text-gray-600">Loading upcoming events...</span>
            </div>
          )}

          {/* Events Grid */}
          {!loading && (
            <>
              {filteredEvents.length === 0 ? (
                <EmptyState
                  icon={<FaCalendarCheck className="text-6xl text-gray-300" />}
                  title={searchQuery || selectedCategory !== "all" 
                    ? t("dashboard.events.noUpcomingEventsFilter") || "No upcoming events found"
                    : t("dashboard.events.noUpcomingEvents") || "No upcoming events"
                  }
                  message={searchQuery || selectedCategory !== "all" 
                    ? t('emptyStates.noUpcomingEventsFilterMessage') || "Try adjusting your search or filter criteria"
                    : t('emptyStates.noUpcomingEventsMessage') || "Check back later for new events or browse past events in the calendar"
                  }
                  className="p-8"
                />
              ) : (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 gap-1 md:gap-6 h-full overflow-y-auto">
                  {filteredEvents.map((event) => {
                    const backgroundImage = event.imageUrl || categoryImages[event.categoryId] || SocialEventImg;
                    
                    // Debug: log participants and current user
                    console.log('Event:', event.title, 'Participants:', event.participants, 'CurrentUser:', currentUser?.uid);
                    
                    // Parse event date for comparison
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
                    
                    const now = new Date();
                    const isToday = eventDate && eventDate.toDateString() === now.toDateString();
                    const isTomorrow = eventDate && new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === eventDate.toDateString();
                    const isMyEvent = isEventCreatedByMe(event);
                    const isJoined = currentUser && Array.isArray(event.participants) && event.participants.includes(currentUser.uid);
                    
                    return (
                      <div 
                        key={event.id} 
                        className={`relative overflow-hidden flex-shrink-0 p-2 md:p-4 min-h-[270px] md:min-h-[280px] flex flex-col justify-between transition-all duration-200 
                          bg-white shadow-md rounded-lg hover:shadow-lg
                        `}
                        style={{}}
                      >
                        {/* Event Image (with floating badge if my event or joined) */}
                        <div className="mb-2 md:mb-2 relative cursor-pointer" onClick={() => setExpandedImage(backgroundImage)}>
                          <img
                            src={backgroundImage}
                            alt={event.title}
                            className="w-full h-26 md:h-28 object-cover rounded-md transition-transform duration-200 hover:scale-105"
                          />
                          {(isMyEvent || isJoined) && (
                            <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
                              {isMyEvent && (
                                <span className="flex items-center px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg border-2 border-white">
                                  <FaUser className="mr-1 text-white text-xs" />
                                  {t("dashboard.events.createdByMe") || "Created by me"}
                                </span>
                              )}
                              {isJoined && !isMyEvent && (
                                <span className="flex items-center px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg border-2 border-white">
                                  <svg className="w-3 h-3 mr-1 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  {t("dashboard.events.joined") || "Joined"}
                                </span>
                              )}
                              {isJoined && isMyEvent && (
                                <span className="flex items-center px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg border-2 border-white">
                                  <svg className="w-3 h-3 mr-1 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  {t("dashboard.events.joined") || "Joined"}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Event Title with Star Icon and Date Badge */}
                        <div className="flex justify-between items-start mb-1 md:mb-2">
                          <h3 className="text-sm md:text-base font-bold flex-1 flex items-center gap-1">
                            {isMyEvent && (
                              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z"/></svg>
                            )}
                            {event.title}
                          </h3>
                          <div className="flex flex-col items-end gap-1">
                            {(isToday || isTomorrow) && (
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                isToday 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {isToday ? 'TODAY' : 'TOMORROW'}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Expanded Image Modal */}
                        {expandedImage && (
                          <div
                            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
                            onClick={() => setExpandedImage(null)}
                          >
                            <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
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
                                className="rounded-lg max-h-[80vh] max-w-[90vw] shadow-2xl border-4 border-white"
                              />
                            </div>
                          </div>
                        )}
                        {/* Date, Time, Location Grouped */}
                        <div className="flex flex-col gap-y-1">
                          {/* Date with Calendar Icon */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-[#FFD966] mr-2 text-xs md:text-base" />
                              <p className="text-gray-800 font-medium text-xs md:text-base">
                                {event.endDate ? `${event.startDate} - ${event.endDate}` : event.startDate}
                              </p>
                            </div>
                            <div className="flex justify-center mt-2 md:mt-4">
                              <button
                                className={`font-bold px-4 md:px-6 py-1.5 md:py-2 rounded-md transition-colors duration-200 text-xs md:text-base ${
                                  isMyEvent
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                    : 'bg-[#FFD966] hover:bg-yellow-500 text-black'
                                }`}
                                onClick={() => setSelectedEvent(event)}
                              >
                                {t("dashboard.events.moreDetails")}
                              </button>
                            </div>
                          </div>
                          {/* Time with Clock Icon */}
                          <div className="flex mb-1 items-center">
                            <FaClock className="text-[#FFD966] mr-2 text-xs md:text-base" />
                            <p className="text-gray-800 font-medium text-xs md:text-base">{event.timeFrom} - {event.timeTo}</p>
                          </div>
                          {/* Location with Pin Icon */}
                          <div className="flex items-center">
                            <FaMapMarkerAlt className="text-[#FFD966] mr-2 text-xs md:text-base" />
                            <p className="text-gray-800 font-medium text-xs md:text-base">{event.location}</p>
                          </div>
                        </div>

                        {/* Description (truncated to 100 chars with ellipsis and read more) */}
                        <p className="text-gray-500 text-xs md:text-sm flex-1 mt-2">
                          {event.description && event.description.length > 100 ? (
                            <>
                              {event.description.slice(0, 100)}
                              ...
                              <button
                                className="ml-1 text-yellow-600 hover:underline text-xs font-medium focus:outline-none"
                                onClick={() => setSelectedEvent(event)}
                                tabIndex={0}
                              >
                                {'Read more'}
                              </button>
                            </>
                          ) : (
                            event.description
                          )}
                        </p>
                        
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

      {/* Centralized Event Details Modal */}
      {renderEventDetailsModal()}
    </div>
  );
};

export default Cards;
