import React, { useRef } from "react";
import { FaArrowRight } from "react-icons/fa";

// Import images
import FootballImg from "../assets/Football.png";
import SwimmingImg from "../assets/Swimming.png";
import TennisImg from "../assets/Tennis.png";
import WalkingImg from "../assets/Walking.png";
import YogaImg from "../assets/Yoga.png";
import GardeningImg from "../assets/Gardening.png";

// Event data with correct date format
const events = [
  { title: "Football", date: "01-04-2025", image: FootballImg },
  { title: "Swimming", date: "11-04-2025", image: SwimmingImg },
  { title: "Tennis", date: "26-04-2025", image: TennisImg },
  { title: "Walking in Nature", date: "07-05-2025", image: WalkingImg },
  { title: "Yoga", date: "15-12-2025", image: YogaImg },
  { title: "Gardening", date: "17-12-2025", image: GardeningImg },
];

// Sort events by ascending date (earliest first)
events.sort((a, b) => new Date(a.date) - new Date(b.date));

const Cards = () => {
  const scrollRef = useRef(null);

  // Scroll Right Function
  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  return (
    <div className="relative bg-[#D3D3D3] mt-4 max-w-screen-lg mx-auto">
      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex space-x-6 overflow-x-scroll scrollbar-hide p-2"
        style={{ scrollBehavior: "smooth" }}
      >
        {events.map((event, index) => (
          <div
            key={index}
            className="bg-white shadow-md rounded-lg overflow-hidden w-60 min-h-[300px] flex-shrink-0"
          >
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-72 object-cover"
            />
            <div className="p-4 flex justify-between items-center">
              <h3 className="text-base font-bold">{event.title}</h3>
            </div>
            <div className="px-4 pb-4 flex justify-between items-center">
              <p className="text-gray-500 font-bold">{event.date}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={scrollRight}
        className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-full shadow-md"
      >
        <FaArrowRight />
      </button>
    </div>
  );
};

export default Cards;
