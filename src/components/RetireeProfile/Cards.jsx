import { useState, useEffect } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaArrowLeft } from "react-icons/fa";
import { db, auth } from "../../firebase"; // Import Firebase configuration
import { collection, getDocs, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { useLanguage } from "../../context/LanguageContext"; // Import the LanguageContext hook
import { useTheme } from '../../context/ThemeContext';
import { CalendarDays, MapPin } from 'lucide-react';

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

const EventCard = ({ event }) => {
  const { theme } = useTheme();

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'} transition-colors duration-200`}>
      <img
        src={event.imageUrl || 'https://via.placeholder.com/400x200'} // Placeholder image
        alt={event.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {event.title}
        </h3>
        <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {event.description}
        </p>
        <div className="flex items-center text-sm mb-2">
          <CalendarDays className={`w-4 h-4 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{event.date}</span>
        </div>
        <div className="flex items-center text-sm">
          <MapPin className={`w-4 h-4 mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{event.location}</span>
        </div>
      </div>
    </div>
  );
};

const Cards = () => {
  const { language, t } = useLanguage(); // Access language and translation function
  const { theme } = useTheme();
  const [events, setEvents] = useState([]); // Store all events
  const [filteredEvents, setFilteredEvents] = useState([]); // Store filtered events
  const [categories, setCategories] = useState([]); // Store categories
  const [selectedCategory, setSelectedCategory] = useState("all"); // Track selected category
  const [searchQuery, setSearchQuery] = useState(""); // Track search input
  const [loading, setLoading] = useState(false); // Loading state
  const [selectedEvent, setSelectedEvent] = useState(null); // Track the selected event for details view

  // Fetch categories and events from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const categoriesRef = collection(db, "categories");
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoriesData);

        // Fetch events
        const eventsRef = collection(db, "events");
        const eventsSnapshot = await getDocs(eventsRef);
        const eventsData = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventsData);
        setFilteredEvents(eventsData); // Initially show all events
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Handle "More Info" button click
  const handleMoreInfo = (event) => {
    setSelectedEvent(event); // Set the selected event for details view
  };

  // Handle "Back to Events" button click
  const handleBackToEvents = () => {
    setSelectedEvent(null); // Reset the selected event to go back to the events list
  };

  // Handle "Join Event" button click
  const handleJoinEvent = async (event) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to join events.");
        return;
      }

      // Add the user's ID to the participants list in the event document
      const eventDocRef = doc(db, "events", event.id);
      await updateDoc(eventDocRef, {
        participants: arrayUnion(user.uid),
      });

      // Add the event ID to the user's registered events list
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          registeredEvents: arrayUnion(event.id),
        });
      } else {
        // If the user document doesn't exist, create it with the registeredEvents field
        await updateDoc(userDocRef, {
          registeredEvents: [event.id],
        });
      }

      alert(`Successfully joined event: ${event.title}`);
    } catch (error) {
      console.error("Error joining event:", error);
      alert("Failed to join event. Please try again.");
    }
  };

  return (
    <div className={`p-4 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* Check if an event is selected */}
      {selectedEvent ? (
        // Event Details View
        <div className={`p-4 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'}`}>
          {/* Banner Image */}
          <div className="mb-4">
            <img
              src={selectedEvent.image || categoryImages[selectedEvent.categoryId]}
              alt={selectedEvent.title}
              className="w-full h-64 object-cover rounded-md"
            />
          </div>

          {/* Back to Events Button */}
          <button
            onClick={handleBackToEvents}
            className={`flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} mb-4`}
          >
            <FaArrowLeft className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            {t("dashboard.events.backToEvents")}
          </button>

          <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {selectedEvent.title}
          </h2>
          <p className={`mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            <CalendarDays className="inline text-[#FFD966] mr-2" />
            {selectedEvent.endDate ? `${selectedEvent.startDate} - ${selectedEvent.endDate}` : selectedEvent.startDate}
          </p>
          <p className={`mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            <MapPin className="inline text-[#FFD966] mr-2" />
            {selectedEvent.location}
          </p>
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {selectedEvent.description}
          </p>
          <button
            className="bg-[#FFD966] hover:bg-yellow-500 text-gray-900 font-bold px-6 py-2 rounded-md transition-colors duration-200"
            onClick={() => handleJoinEvent(selectedEvent)}
          >
            {t("dashboard.events.join")}
          </button>
        </div>
      ) : (
        // Events List View
        <>
          {/* Search Bar and Filter */}
          <div className={`sticky top-0 z-10 flex items-center justify-between mb-4 p-1 shadow-sm w-full ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-white'
          }`}>
            <div className={`flex items-center max-w-md border px-3 py-2 rounded-md shadow-sm w-full ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
            }`}>
              <FaSearch className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
              <input
                type="text"
                placeholder={t("dashboard.search.searchEvents")}
                className={`border-none outline-none text-sm ml-2 w-full ${
                  theme === 'dark' ? 'bg-gray-800 text-gray-200 placeholder-gray-400' : 'bg-white text-gray-900'
                }`}
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <select
              className={`ml-4 border px-2 py-1 rounded-md text-sm ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-900'
              }`}
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
          {loading && <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Loading...</p>}

          {/* Events Grid */}
          {!loading && (
            <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto">
              {filteredEvents.map((event) => (
                <div key={event.id} className={`rounded-lg shadow-md overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'
                }`}>
                  <img
                    src={event.image || categoryImages[event.categoryId]}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {event.title}
                    </h3>
                    <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {event.description}
                    </p>
                    <div className="flex items-center text-sm mb-2">
                      <FaCalendarAlt className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {event.startDate}
                      </span>
                    </div>
                    <div className="flex items-center text-sm mb-4">
                      <FaMapMarkerAlt className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {event.location}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMoreInfo(event)}
                      className="bg-[#FFD966] hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-md transition-colors duration-200"
                    >
                      {t("dashboard.events.moreInfo")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Cards;
