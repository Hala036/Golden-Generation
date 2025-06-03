import React, { useState} from "react";

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

const Main = () => {
    const [seniors, setSeniors] = useState(mockSeniors);
    const [towns, setTowns] = useState(mockTowns);
    const [jobRequests, setJobRequests] = useState(mockJobRequests);
    
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Main Page</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Seniors */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl mb-2">Total Seniors</h3>
          <p className="text-3xl font-bold">{seniors.length}</p>
        </div>

        {/* Total Towns */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl mb-2">Total Towns</h3>
          <p className="text-3xl font-bold">{towns.length}</p>
        </div>

        {/* Active Job Requests */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl mb-2">Active Job Requests</h3>
          <p className="text-3xl font-bold">{jobRequests.length}</p>
        </div>
      </div>

      {/* Recent Job Requests */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-xl mb-4">Recent Job Requests</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobRequests.slice(0, 5).map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{request.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.domain}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Main;