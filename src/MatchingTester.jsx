import React, { useState } from "react";
import { performSeniorMatching } from "./matching"; // عدّل المسار حسب مشروعك

const MatchingTester = () => {
  const [jobRequestId, setJobRequestId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMatch = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Starting matching for jobRequestId:", jobRequestId);
      const matches = await performSeniorMatching(jobRequestId);
      console.log("Match results:", matches);
      setResults(matches);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Test Matching Seniors</h2>

      <input
        type="text"
        value={jobRequestId}
        onChange={(e) => setJobRequestId(e.target.value)}
        placeholder="Enter jobRequestId"
        className="border p-2 rounded mr-2"
      />
      <button
        onClick={handleMatch}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading || !jobRequestId}
      >
        {loading ? "Matching..." : "Run Matching"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <div className="mt-4">
        <h3 className="font-semibold">Results:</h3>
        {results.length === 0 && <p>No matches yet.</p>}
        <ul className="list-disc ml-5">
          {results.map((match) => (
            <li key={match.seniorId}>
              <strong>{match.seniorName}</strong> - Score: {match.score}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MatchingTester;
