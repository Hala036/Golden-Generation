import { useState, useEffect } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaArrowLeft } from "react-icons/fa";
import { db, auth } from "../../firebase"; // Import Firebase configuration
import { collection, getDocs, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { useLanguage } from "../../context/LanguageContext"; // Import the LanguageContext hook
import { toast } from 'react-hot-toast';

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

const Cards = () => {
  const { language, t } = useLanguage(); // Access language and translation function
  const [events, setEvents] = useState([]);
  const [baseEvents, setBaseEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
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
        const user = auth.currentUser;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userSettlement = userDoc.exists() ? userDoc.data().idVerification.settlement : "";
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
        const eventsData = eventsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((event) => event.status == "active"); // only include active events
        setEvents(eventsData);

        const settlementFiltered = eventsData.filter((event) => event.settlement === userSettlement);
        setBaseEvents(settlementFiltered);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const applySearchAndCategory = (base) => {
    const filtered = base.filter((event) => {
      const matchesCategory = selectedCategory === "all" || event.categoryId === selectedCategory;
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    setFilteredEvents(filtered);
  };

  useEffect(() => {
    applySearchAndCategory(baseEvents);
  }, [baseEvents, selectedCategory, searchQuery]);

  // Handle category filter
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
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

      toast.success(`Successfully joined event: ${event.title}`);
    } catch (error) {
      console.error("Error joining event:", error);
      toast.error("Failed to join event. Please try again.");
    }
  };

  return (
    <div className="bg-white">
      {/* Check if an event is selected */}
      {selectedEvent ? (
        // Event Details View
        <div class="p-2">
          {/* Back to Events Button */}
          <button
            onClick={handleBackToEvents}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FaArrowLeft className="text-xl" />
            {t("dashboard.events.backToEvents")}
          </button>

          {/* Banner Image */}
          <div className="mb-4">
            <img
              src={selectedEvent.imageUrl || categoryImages[selectedEvent.categoryId]}
              alt={selectedEvent.title}
              className="w-full h-64 object-cover rounded-md"
            />
          </div>

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
            onClick={() => handleJoinEvent(selectedEvent)}
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
                const backgroundImage = event.imageUrl || categoryImages[event.categoryId];
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FaCalendarAlt className="text-[#FFD966] mr-2" />
                        <p className="text-gray-700 font-medium">
                          {event.endDate ? `${event.startDate} - ${event.endDate}` : event.startDate}
                        </p>
                      </div>
                      {/* More Details Button */}
                      <button
                        className="bg-[#FFD966] hover:bg-yellow-500 text-yellow-700 font-bold px-6 py-2 rounded-md transition-colors duration-200"
                        onClick={() => handleMoreInfo(event)}
                      >
                        {t("dashboard.events.moreDetails")}
                      </button>
                    </div>

                    {/* Location with Pin Icon */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="text-[#FFD966] mr-2" />
                        <p className="text-gray-700 font-medium">{event.location}</p>
                      </div>
                      {/* Number of Participants */}
                      <p className="text-gray-500 text-sm">
                        {event.participants ? `${event.participants.length} ${t("dashboard.events.participants")}` : `${t("dashboard.events.noParticipants")}`}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-gray-500 text-sm">{event.description}</p>
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
