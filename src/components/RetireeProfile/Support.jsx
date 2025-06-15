import React, { useState, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { auth, getUserData, getUsersBySettlement } from "../../firebase"; // Assuming getUsersBySettlement fetches users by settlement

const Support = () => {
  const [message, setMessage] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("No user is currently logged in.");
          toast.error("No user is logged in.");
          return;
        }

        const userData = await getUserData(user.uid);

        if (!userData || !userData.idVerification) {
          console.error("No user data found for the given UID.");
          toast.error("Failed to load user data.");
          return;
        }

        const settlement = userData.idVerification.settlement; // Get the user's settlement
        if (!settlement) {
          console.error("Settlement information is missing.");
          toast.error("Settlement information is missing.");
          return;
        }

        // Fetch users in the same settlement
        const usersInSettlement = await getUsersBySettlement(settlement);

        if (!usersInSettlement || usersInSettlement.length === 0) {
          console.error("No users found in the settlement.");
          toast.error("No users found in the settlement.");
          return;
        }

        // Find the admin in the settlement
        const admin = usersInSettlement.find((user) => user.role === "admin");

        if (!admin) {
          console.error("No admin found in the settlement.");
          toast.error("No admin found in the settlement.");
          return;
        }

        // Set the admin's information
        setAdminInfo({
          username: admin.credentials?.username || "Admin",
          firstname: admin.idVerification?.firstName || "N/A",
          lastname: admin.idVerification?.lastName || "N/A",
          email: admin.credentials?.email || "N/A",
          phone: admin.personalDetails?.phoneNumber || "N/A",
        });
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast.error("Failed to load admin data.");
      }
    };

    fetchAdminInfo();
  }, []);

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error("Please enter a message before sending.");
      return;
    }

    // Simulate sending the message (replace with actual API call if needed)
    toast.success("Your message has been sent successfully!");
    setMessage(""); // Clear the input field
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Admin Info Section */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold mb-2 text-yellow-500">Admin Information</h2>
        {adminInfo ? (
          <div className="text-gray-600">
            <p><strong>Username:</strong> {adminInfo.username}</p>
            <p><strong>Name:</strong> {adminInfo.firstname} {adminInfo.lastname}</p>
            <p><strong>Email:</strong> {adminInfo.email}</p>
            <p><strong>Phone:</strong> {adminInfo.phone}</p>
          </div>
        ) : (
          <p className="text-gray-500">Loading admin information...</p>
        )}
      </div>

      {/* Support Message Section */}
      <h2 className="text-xl font-bold mb-4 text-yellow-500">Customer Support</h2>
      <p className="text-gray-600 mb-4">
        If you have any questions or need assistance, feel free to reach out to us by sending a message below.
      </p>
      <textarea
        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
        placeholder="Type your message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      ></textarea>
      <button
        onClick={handleSendMessage}
        className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
      >
        <FaPaperPlane />
        Send Message
      </button>
    </div>
  );
};

export default Support;