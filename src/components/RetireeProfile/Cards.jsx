import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import { db } from "../../firebase"; // Import your Firebase configuration
import { collection, query, where, getDocs } from "firebase/firestore";

// Import local images
import TripImg from "../../assets/Trip.png";
import VacationImg from "../../assets/Vacation.png";
import WorkshopImg from "../../assets/Workshop.png";
import LectureImg from "../../assets/Lecture.png";
import HomeGroupImg from "../../assets/HomeGroup.png";
import SocialEventImg from "../../assets/SocialEvent.png";
import Walking from "../../assets/Walking.png";
import BookClub from "../../assets/BookClub.png";

// Map local images to categories and events
const categoryImages = {
  trip: TripImg,
  vacation: VacationImg,
  workshop: WorkshopImg,
  lecture: LectureImg,
  homegroup: HomeGroupImg,
  socialevent : SocialEventImg,
  walking : Walking,
  bookclub: BookClub
};

const eventImages = {
  trip: TripImg,
  vacation: VacationImg,
  workshop: WorkshopImg,
  lecture: LectureImg,
  homegroup: HomeGroupImg,
  socialevent : SocialEventImg,
  walking : Walking,
  bookclub: BookClub
};

const Cards = () => {
  const [view, setView] = useState("categories"); // Toggle between "categories" and "events"
  const [categories, setCategories] = useState([]); // Store categories
  const [events, setEvents] = useState([]); // Store events for the selected category
  const [selectedCategory, setSelectedCategory] = useState(null); // Track the selected category
  const [loading, setLoading] = useState(false); // Loading state

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const categoriesRef = collection(db, "categories");
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          image: categoryImages[doc.id], // Map local image
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch events for the selected category
  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    setView("events");
    setLoading(true);

    try {
      const eventsRef = collection(db, "events");
      const eventsQuery = query(eventsRef, where("categoryId", "==", category.id));
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        image: eventImages[doc.id], // Map local image
      }));
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setView("categories");
  };

  const handleJoinEvent = async (eventTitle) => {
    try {
      const user = auth.currentUser; // Ensure the user is logged in
      if (!user) {
        alert("Please log in to join events.");
        return;
      }

      // Update the user's joined events in Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        joinedEvents: arrayUnion(eventTitle), // Add the event title to the user's joined events
      });

      alert(`Successfully joined the event: ${eventTitle}`);
    } catch (error) {
      console.error("Error joining event:", error);
      alert("An error occurred while joining the event. Please try again.");
    }
  };

  return (
    <div className="bg-white p-4 overflow-y-auto">
      {/* Search Bar */}
      <div className="mb-6 flex items-center max-w-md border px-3 py-2 rounded-md bg-white shadow-sm">
        <FaSearch className="text-gray-500" />
        <input
          type="text"
          placeholder={`Search ${view === "categories" ? "Categories" : "Events"}`}
          className="border-none outline-none text-sm ml-2 w-full"
        />
      </div>

      {loading && <p>Loading...</p>}

      {/* Categories View */}
      {view === "categories" && !loading && (
        <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:shadow-lg transition"
              onClick={() => handleCategoryClick(category)}
            >
              <img
                src={category.image}
                alt={category.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-3xl font-bold mb-2 text-center">{category.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Events View */}
      {view === "events" && selectedCategory && !loading && (
        <div>
          <button
            className="mb-4 text-yellow-500 font-bold"
            onClick={handleBackToCategories}
          >
            &larr; Back to Categories
          </button>
          <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0"
              >
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-base font-bold mb-2">{event.title}</h3>
                  {/* Date with Calendar Icon */}
                  <div className="flex items-center mb-2">
                    <FaCalendarAlt className="text-[#FFD966] mr-2" />
                    <p className="text-gray-700 font-medium">{event.date}</p>
                  </div>

                  {/* Location with Pin Icon */}
                  <div className="flex items-center mb-3">
                    <FaMapMarkerAlt className="text-[#FFD966] mr-2" />
                    <p className="text-gray-700 font-medium">{event.location}</p>
                  </div>

                  {/* Description */}
                  <p className="text-gray-500 text-sm">{event.description}</p>
                  {/* Join Button */}
                  <div className="mt-auto flex justify-end py-2">
                    <button
                      className="bg-[#FFD966] hover:bg-yellow-500 text-yellow-700 font-bold px-6 py-2 rounded-md transition-colors duration-200"
                      onClick={() => handleJoinEvent(event.title)}
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cards;