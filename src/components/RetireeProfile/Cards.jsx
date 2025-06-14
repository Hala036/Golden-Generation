import { useState, useEffect } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaArrowLeft } from "react-icons/fa";
import { db } from "../../firebase"; // Import your Firebase configuration
import { collection, getDocs } from "firebase/firestore";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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

  return (
    <div className="bg-white p-4">
      {/* Check if an event is selected */}
      {selectedEvent ? (
        // Event Details View
        <div>
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
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <FaArrowLeft className="text-xl" />
              {t("dashboard.events.backToEvents")}
          </button>

          <h2 className="text-xl font-bold mb-4">{selectedEvent.title}</h2>
          <p className="mb-2">
            <FaCalendarAlt className="inline text-[#FFD966] mr-2" />
              {selectedEvent.endDate ? `${selectedEvent.startDate} - ${selectedEvent.endDate}` : selectedEvent.startDate}
          </p>
          <p className="mb-2">
            <FaMapMarkerAlt className="inline text-[#FFD966] mr-2" />
            {selectedEvent.location}
          </p>
          <p className="mb-4">{selectedEvent.description}</p>
          <button
            className="bg-[#FFD966] hover:bg-yellow-500 text-yellow-700 font-bold px-6 py-2 rounded-md transition-colors duration-200"
            onClick={() => alert(`Joined event: ${selectedEvent.title}`)}
          >
            {t("dashboard.events.join")}
          </button>
        </div>
      ) : (
        // Events List View
        <>
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
                  {category.title}
                </option>
              ))}
            </select>
          </div>
          {loading && <p>Loading...</p>}

          {/* Events Grid */}
          {!loading && (
            <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto">
              {filteredEvents.map((event) => {
                const backgroundImage = event.image || categoryImages[event.categoryId];
                return (
                  <div
                    key={event.id}
                    className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0 p-4"
                  >
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
                    {/* More Details Button */}
                    <div className="mt-auto flex justify-end py-2">
                      <button
                        className="bg-[#FFD966] hover:bg-yellow-500 text-yellow-700 font-bold px-6 py-2 rounded-md transition-colors duration-200"
                        onClick={() => handleMoreInfo(event)}
                      >
                        {t("dashboard.events.moreDetails")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Cards;
