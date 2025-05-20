import React, { useRef } from "react";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";

// Import images
import FootballImg from "../../assets/Football.png";
import SwimmingImg from "../../assets/Swimming.png";
import TennisImg from "../../assets/Tennis.png";
import WalkingImg from "../../assets/Walking.png";
import YogaImg from "../../assets/Yoga.png";
import GardeningImg from "../../assets/Gardening.png";

// Event data with correct date format
const events = [
  {
    title: "Football",
    date: "01-06-2025",
    location: "Sports Center",
    description: "Join us for a friendly football match suitable for all skill levels and a great way to stay active.",
    image: FootballImg
  },
  {
    title: "Swimming",
    date: "11-05-2025",
    location: "Community Pool",
    description: "Enjoy a relaxing swim in our heated pool. Lanes available for all speeds and abilities.",
    image: SwimmingImg
  },
  {
    title: "Tennis",
    date: "26-07-2025",
    location: "West Court Club",
    description: "Meet others for casual singles and doubles matches on professional-grade courts.",
    image: TennisImg
  },
  {
    title: "Walking in Nature",
    date: "07-07-2025",
    location: "Greenhill Nature Reserve",
    description: "Take a peaceful group walk through scenic trails and enjoy the beauty of the outdoors.",
    image: WalkingImg
  },
  {
    title: "Yoga",
    date: "15-12-2025",
    location: "Wellness Studio A",
    description: "A gentle yoga class focused on breathing, stretching, and mindfulness — perfect for all levels.",
    image: YogaImg
  },
  {
    title: "Gardening",
    date: "17-12-2025",
    location: "Community Garden",
    description: "Learn and share tips while tending to flower beds and vegetable patches in good company.",
    image: GardeningImg
  }
];

// Sort events by ascending date (earliest first)
events.sort((a, b) => new Date(a.date) - new Date(b.date));

const Cards = () => {
  return (
    <div className="bg-white p-4 overflow-y-auto">
      {/* Grid Container */}
      <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto">
        {events.map((event, index) => (
          <div
            key={index}
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
              <p className="text-gray-500 text-sm">
                {event.description}
              </p>

              {/* Join Button */}
              <div className="mt-auto flex justify-end py-2">
                <button
                  className="bg-[#FFD966] hover:bg-yellow-500 text-yellow-700 font-bold px-6 py-2 rounded-md transition-colors duration-200"
                  onClick={() => {/* Handle join logic */}}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cards;
