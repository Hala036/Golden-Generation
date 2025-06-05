import React, { useRef } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';


// Import images
import FootballImg from "../../assets/Football.png";
import SwimmingImg from "../../assets/Swimming.png";
import TennisImg from "../../assets/Tennis.png";
import WalkingImg from "../../assets/Walking.png";
import YogaImg from "../../assets/Yoga.png";
import GardeningImg from "../../assets/Gardening.png";

const categories = [
  {
    title: "Trip",
    image: FootballImg,
    route: "/events/football" 
  },
  {
    title: "Vacation",
    image: YogaImg
  },
  {
    title: "Workshop",
    image: GardeningImg
  },
  {
    title: "Lecture",
    image: SwimmingImg
  },
  {
    title: "Home Group",
    image: TennisImg
  },
  {
    title: "Social Gathering",
    image: WalkingImg
  }
];

const Cards = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-4 overflow-y-auto">
      <div className="mb-6 flex items-center max-w-md border px-3 py-2 rounded-md bg-white shadow-sm">
        <FaSearch className="text-gray-500" />
        <input 
          type="text" 
          placeholder="Search Events" 
          className="border-none outline-none text-sm ml-2 w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto">
        {categories.map((event, index) => (
          <div
            key={index}
            className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate("/events")}
          >
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-3xl font-bold mb-2 text-center">{event.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cards;
