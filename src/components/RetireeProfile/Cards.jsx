import { useState, useEffect } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import { db } from "../../firebase"; // Import Firebase configuration
import { collection, onSnapshot } from "firebase/firestore";
import { useLanguage } from "../../context/LanguageContext"; // Import the LanguageContext hook
import RetireeEventDetails from "../Calendar/RetireeEventDetails"; // Import the centralized event details component

// Import local images for fallback
import TripImg from "../../assets/Trip.png";
import VacationImg from "../../assets/Vacation.png";
import WorkshopImg from "../../assets/Workshop.png";
import LectureImg from "../../assets/Lecture.png";
import HomeGroupImg from "../../assets/HomeGroup.png";
import SocialEventImg from "../../assets/SocialEvent.png";

// Map local images to categories
const categoryImages = {
  trip: TripImg,
  vacation: VacationImg,
  workshop: WorkshopImg,
  lecture: LectureImg,
  homegroup: HomeGroupImg,
  socialevent: SocialEventImg,
};

const Cards = () => {
  const { language, t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null); // Used to show the modal

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
            const eventsData = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((event) => event.status === "active");
            setEvents(eventsData);
            setFilteredEvents(eventsData);
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
  }, []);

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

  return (
    <div className="bg-white p-4">
      {/* Search Bar and Filter */}
      <div className="sticky top-0 bg-white z-10 flex items-center justify-between mb-4 p-1 shadow-sm w-full">
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
      </div>
      {loading && <p>Loading...</p>}

      {/* Events Grid */}
      {!loading && (
        <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto">
          {filteredEvents.map((event) => {
            const backgroundImage = event.imageUrl || categoryImages[event.categoryId] || SocialEventImg;
            return (
              <div key={event.id} className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0 p-4">
                {/* Event Title */}
                <h3 className="text-base font-bold mb-2">{event.title}</h3>

                {/* Event Image */}
                <div className="mb-4">
                  <img
                    src={backgroundImage}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-md"
                  />
                </div>
                {/* Date with Calendar Icon */}
                <div className="flex items-center mb-2">
                  <FaCalendarAlt className="text-[#FFD966] mr-2" />
                  <p className="text-gray-700 font-medium">
                    {event.endDate ? `${event.startDate} - ${event.endDate}` : event.startDate}
                  </p>
                </div>

                {/* Location with Pin Icon */}
                <div className="flex items-center mb-3">
                  <FaMapMarkerAlt className="text-[#FFD966] mr-2" />
                  <p className="text-gray-700 font-medium">{event.location}</p>
                </div>

                {/* Description */}
                <p className="text-gray-500 text-sm">{event.description}</p>
                <div className="flex justify-center mt-4">
                  <button
                    className="bg-[#FFD966] hover:bg-yellow-500 text-black font-bold px-6 py-2 rounded-md transition-colors duration-200"
                    onClick={() => setSelectedEvent(event)}
                  >
                    {t("dashboard.events.moreDetails")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Centralized Event Details Modal */}
      {selectedEvent && (
        <RetireeEventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default Cards;
