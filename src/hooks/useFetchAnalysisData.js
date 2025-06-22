import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const useFetchAnalysisData = () => {
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [availableSettlements, setSettlements] = useState([]); // ✅ New: valid settlements
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Fetch all users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsers = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(allUsers);

        // ✅ Fetch all job requests
        const jobsSnapshot = await getDocs(collection(db, "jobRequests"));
        const jobList = jobsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setJobs(jobList);

        // Fetch all events
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const eventList = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        setEvents(eventList);

        // ✅ Fetch available settlements (only those marked as available)
        const settlementsSnapshot = await getDocs(collection(db, "availableSettlements"));
        const validSettlements = settlementsSnapshot.docs
          .filter(doc => doc.data().available === true)
          .map(doc => doc.id); // <-- Use ID as-is
        setSettlements(validSettlements);

      } catch (err) {
        console.error("Error fetching analysis data:", err);
        setError("Failed to load analysis data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Now also returning settlements
  return { users, jobs, events, availableSettlements, loading, error };
};

export default useFetchAnalysisData;
