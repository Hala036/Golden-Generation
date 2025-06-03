import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import { FaSignOutAlt } from "react-icons/fa";
import Dashboard from "./Dashboard";

// Mock data for demonstration
const mockSeniors = [
  { id: 1, name: "David Cohen", age: 68, phone: "054-1234567", city: "Springfield", interests: ["Reading", "Gardening"], workFields: ["Education", "Consulting"] },
  { id: 2, name: "Sarah Klein", age: 72, phone: "050-7654321", city: "Riverside", interests: ["Cooking", "Art"], workFields: ["Healthcare"] },
  { id: 3, name: "Jacob Miller", age: 65, phone: "052-9876543", city: "Lincoln", interests: ["Technology", "Music"], workFields: ["IT", "Engineering"] },
  { id: 4, name: "Ruth Gordon", age: 70, phone: "053-3456789", city: "Springfield", interests: ["Walking", "History"], workFields: ["Finance"] },
];

const mockTowns = [
  { id: 1, name: "Springfield", municipality: "Clarke County" },
  { id: 2, name: "Riverside", municipality: "Adams County" },
  { id: 3, name: "Lincoln", municipality: "Jefferson County" },
];

const mockJobRequests = [
  { id: 1, type: "Volunteer", domain: "Medical Escort", description: "Accompany senior to doctor appointment", location: "Springfield" },
  { id: 2, type: "Direct Help", domain: "Home Repair", description: "Fix kitchen sink", location: "Riverside" },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [seniors, setSeniors] = useState(mockSeniors);
  const [towns, setTowns] = useState(mockTowns);
  const [jobRequests, setJobRequests] = useState(mockJobRequests);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-4 border-b">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-300 mr-3"></div>
            <div>
              <h2 className="text-xl font-bold">John Doe</h2>
              <p className="text-gray-600">Admin</p>
            </div>
          </div>
        </div>

        <nav className="p-2">
          <button
            className={`flex items-center w-full p-3 mb-1 rounded ${
              activeTab === "dashboard" ? "bg-yellow-200" : "hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="mr-3">👥</span>
            <span>Dashboard</span>
          </button>
          <button
            className={`flex items-center w-full p-3 mb-1 rounded ${
              activeTab === "seniors" ? "bg-yellow-200" : "hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("seniors")}
          >
            <span className="mr-3">👴</span>
            <span>Seniors</span>
          </button>
          <button
            className={`flex items-center w-full p-3 mb-1 rounded ${
              activeTab === "towns" ? "bg-yellow-200" : "hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("towns")}
          >
            <span className="mr-3">🏙️</span>
            <span>Towns</span>
          </button>
          <button
            className={`flex items-center w-full p-3 mb-1 rounded ${
              activeTab === "jobs" ? "bg-yellow-200" : "hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("jobs")}
          >
            <span className="mr-3">📋</span>
            <span>Job Requests</span>
          </button>
        </nav>

        <div className="absolute bottom-0 w-64 border-t border-gray-200 bg-white p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded hover:bg-gray-100 text-gray-700"
          >
            <span className="mr-3">
              <FaSignOutAlt />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "dashboard" && (
          <Dashboard seniors={seniors} towns={towns} jobRequests={jobRequests} />
        )}
        {/* Other tabs (Seniors, Towns, Jobs) */}
      </div>
    </div>
  );
}
