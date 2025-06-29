
import { useState, useEffect } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaCalendarCheck, FaClock} from "react-icons/fa";
import { db } from "../../firebase"; // Import Firebase configuration
import { collection, onSnapshot } from "firebase/firestore";
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
        const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
            const eventsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            
            // Filter events based on role
            const roleBasedEvents = userRole === 'admin'
                ? eventsData.filter(event => event.status === 'active' || event.status === 'pending')
                : eventsData.filter(event => event.status === 'active');
            
            setEvents(roleBasedEvents);
            setFilteredEvents(roleBasedEvents);
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

  // Handle category filter
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category === "all") {
      setFilteredEvents(events.filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase())));
    } else {
      setFilteredEvents(
        events.filter(
          (event) =>
            event.categoryId === category &&
            event.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  };

  // Handle search input
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredEvents(
      events.filter(
        (event) =>
          (selectedCategory === "all" || event.categoryId === selectedCategory) &&
          event.title.toLowerCase().includes(query)
      )
    );
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
            <button
              title="Go to Calendar"
              onClick={() => setSelected && setSelected('calendar')}
              className="ml-2 p-2 rounded-full hover:bg-gray-100"
            >
              <FaCalendarAlt className="text-xl text-blue-600" />
            </button>
          </div>
          {loading && <p>Loading...</p>}

          {/* Events Grid */}
          {!loading && (
            <>
              {filteredEvents.length === 0 ? (
                <EmptyState
                  icon={<FaCalendarCheck className="text-6xl text-gray-300" />}
                  title={t("dashboard.events.noEvents")}
                  message={searchQuery || selectedCategory !== "all" 
                    ? t('emptyStates.noEventsFilterMessage')
                    : t('emptyStates.noEventsMessage')
                  }
                  className="p-8"
                />
              ) : (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 gap-1 md:gap-6 h-full overflow-y-auto">
                  {filteredEvents.map((event) => {
                    const backgroundImage = event.imageUrl || categoryImages[event.categoryId] || SocialEventImg;
                    return (
                      <div key={event.id} className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0 p-2 md:p-4 min-h-[270px] md:min-h-[280px] flex flex-col justify-between">
                        {/* Event Title */}
                        <h3 className="text-sm md:text-base font-bold mb-1 md:mb-2">{event.title}</h3>

                        {/* Event Image (clickable to expand) */}
                        <div className="mb-2 md:mb-2 cursor-pointer" onClick={() => setExpandedImage(backgroundImage)}>
                          <img
                            src={backgroundImage}
                            alt={event.title}
                            className="w-full h-26 md:h-28 object-cover rounded-md transition-transform duration-200 hover:scale-105"
                          />
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
                                className="bg-[#FFD966] hover:bg-yellow-500 text-black font-bold px-4 md:px-6 py-1.5 md:py-2 rounded-md transition-colors duration-200 text-xs md:text-base"
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
