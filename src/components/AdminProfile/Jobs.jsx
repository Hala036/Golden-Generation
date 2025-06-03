import React, { useState } from "react";

// Mock data for job requests
const mockJobRequests = [
  { id: 1, type: "Volunteer", domain: "Medical Escort", description: "Accompany senior to doctor appointment", location: "Springfield" },
  { id: 2, type: "Direct Help", domain: "Home Repair", description: "Fix kitchen sink", location: "Riverside" },
];

// Mock data for towns (used for location dropdown)
const mockTowns = [
  { id: 1, name: "Springfield", municipality: "Clarke County" },
  { id: 2, name: "Riverside", municipality: "Adams County" },
  { id: 3, name: "Lincoln", municipality: "Jefferson County" },
];

// Mock data for seniors (used for matching seniors)
const mockSeniors = [
  { id: 1, name: "David Cohen", age: 68, phone: "054-1234567", city: "Springfield", interests: ["Reading", "Gardening"], workFields: ["Education", "Consulting"] },
  { id: 2, name: "Sarah Klein", age: 72, phone: "050-7654321", city: "Riverside", interests: ["Cooking", "Art"], workFields: ["Healthcare"] },
  { id: 3, name: "Jacob Miller", age: 65, phone: "052-9876543", city: "Lincoln", interests: ["Technology", "Music"], workFields: ["IT", "Engineering"] },
];

const Jobs = () => {
  const [jobRequests, setJobRequests] = useState(mockJobRequests);
  const [newJobRequest, setNewJobRequest] = useState({
    type: "Volunteer",
    domain: "",
    description: "",
    location: "",
  });

  // Handle job request form submission
  const handleJobRequestSubmit = (e) => {
    e.preventDefault();
    setJobRequests([...jobRequests, { id: jobRequests.length + 1, ...newJobRequest }]);
    setNewJobRequest({
      type: "Volunteer",
      domain: "",
      description: "",
      location: "",
    });
  };

  // Delete job request
  const deleteJobRequest = (id) => {
    setJobRequests(jobRequests.filter((request) => request.id !== id));
  };

  // Find matching seniors for a job request
  const findMatchingSeniors = (request) => {
    return mockSeniors.filter(
      (senior) =>
        senior.city === request.location &&
        (senior.workFields.includes(request.domain) || senior.interests.includes(request.domain))
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Requests</h1>
      </div>

      {/* Create Job Request Form */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">Create New Job Request</h3>
        <form onSubmit={handleJobRequestSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full p-2 border rounded"
                value={newJobRequest.type}
                onChange={(e) => setNewJobRequest({ ...newJobRequest, type: e.target.value })}
                required
              >
                <option value="Volunteer">Volunteer Request</option>
                <option value="Direct Help">Direct Help for Senior</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="e.g. Medical Escort, Home Repair"
                value={newJobRequest.domain}
                onChange={(e) => setNewJobRequest({ ...newJobRequest, domain: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                className="w-full p-2 border rounded"
                value={newJobRequest.location}
                onChange={(e) => setNewJobRequest({ ...newJobRequest, location: e.target.value })}
                required
              >
                <option value="">Select Town</option>
                {mockTowns.map((town) => (
                  <option key={town.id} value={town.name}>
                    {town.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full p-2 border rounded"
                rows="2"
                placeholder="Describe the job request"
                value={newJobRequest.description}
                onChange={(e) => setNewJobRequest({ ...newJobRequest, description: e.target.value })}
                required
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded"
          >
            Create Job Request
          </button>
        </form>
      </div>

      {/* Job Requests List */}
      <div className="bg-white rounded shadow overflow-hidden">
        <h3 className="text-xl font-bold p-4 border-b">Active Job Requests</h3>
        {jobRequests.map((request) => (
          <div key={request.id} className="border-b p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold">
                  {request.domain} ({request.type})
                </h4>
                <p className="text-gray-600">{request.location}</p>
              </div>
              <div>
                <button
                  className="text-red-600 hover:text-red-900"
                  onClick={() => deleteJobRequest(request.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="mb-4">{request.description}</p>

            <div>
              <h5 className="font-semibold mb-2">
                Matching Seniors ({findMatchingSeniors(request).length}):
              </h5>
              {findMatchingSeniors(request).length > 0 ? (
                <ul className="pl-5 list-disc">
                  {findMatchingSeniors(request).map((senior) => (
                    <li key={senior.id}>
                      {senior.name} - {senior.phone}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No matching seniors found.</p>
              )}
            </div>
          </div>
        ))}

        {jobRequests.length === 0 && (
          <p className="p-4 text-gray-500 italic">No job requests yet.</p>
        )}
      </div>
    </div>
  );
};

export default Jobs;
