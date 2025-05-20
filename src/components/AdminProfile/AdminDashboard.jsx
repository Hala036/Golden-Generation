import { useState, useEffect } from "react";

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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [seniors, setSeniors] = useState(mockSeniors);
  const [towns, setTowns] = useState(mockTowns);
  const [jobRequests, setJobRequests] = useState(mockJobRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    city: "",
    ageMin: "",
    ageMax: "",
    interest: "",
    workField: ""
  });
  
  // Filter seniors based on search term and filters
  const filteredSeniors = seniors.filter(senior => {
    const matchesSearch = senior.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = !filters.city || senior.city === filters.city;
    const matchesAge = (!filters.ageMin || senior.age >= parseInt(filters.ageMin)) && 
                      (!filters.ageMax || senior.age <= parseInt(filters.ageMax));
    const matchesInterest = !filters.interest || 
                          senior.interests.some(i => i.toLowerCase().includes(filters.interest.toLowerCase()));
    const matchesWorkField = !filters.workField || 
                           senior.workFields.some(w => w.toLowerCase().includes(filters.workField.toLowerCase()));
    
    return matchesSearch && matchesCity && matchesAge && matchesInterest && matchesWorkField;
  });
  
  // New job request form state
  const [newJobRequest, setNewJobRequest] = useState({
    type: "Volunteer",
    domain: "",
    description: "",
    location: ""
  });
  
  // Handle job request form submission
  const handleJobRequestSubmit = (e) => {
    e.preventDefault();
    setJobRequests([...jobRequests, { id: jobRequests.length + 1, ...newJobRequest }]);
    setNewJobRequest({
      type: "Volunteer",
      domain: "",
      description: "",
      location: ""
    });
  };
  
  // Delete job request
  const deleteJobRequest = (id) => {
    setJobRequests(jobRequests.filter(request => request.id !== id));
  };
  
  // Find matching seniors for a job request
  const findMatchingSeniors = (request) => {
    return seniors.filter(senior => 
      senior.city === request.location && 
      (senior.workFields.includes(request.domain) || senior.interests.includes(request.domain))
    );
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
            className={`flex items-center w-full p-3 mb-1 rounded ${activeTab === "dashboard" ? "bg-yellow-200" : "hover:bg-gray-100"}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="mr-3">👥</span>
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`flex items-center w-full p-3 mb-1 rounded ${activeTab === "seniors" ? "bg-yellow-200" : "hover:bg-gray-100"}`}
            onClick={() => setActiveTab("seniors")}
          >
            <span className="mr-3">👴</span>
            <span>Seniors</span>
          </button>
          
          <button 
            className={`flex items-center w-full p-3 mb-1 rounded ${activeTab === "towns" ? "bg-yellow-200" : "hover:bg-gray-100"}`}
            onClick={() => setActiveTab("towns")}
          >
            <span className="mr-3">🏙️</span>
            <span>Towns</span>
          </button>
          
          <button 
            className={`flex items-center w-full p-3 mb-1 rounded ${activeTab === "jobs" ? "bg-yellow-200" : "hover:bg-gray-100"}`}
            onClick={() => setActiveTab("jobs")}
          >
            <span className="mr-3">📋</span>
            <span>Job Requests</span>
          </button>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded shadow">
                <h3 className="text-xl mb-2">Total Seniors</h3>
                <p className="text-3xl font-bold">{seniors.length}</p>
              </div>
              <div className="bg-white p-6 rounded shadow">
                <h3 className="text-xl mb-2">Total Towns</h3>
                <p className="text-3xl font-bold">{towns.length}</p>
              </div>
              <div className="bg-white p-6 rounded shadow">
                <h3 className="text-xl mb-2">Active Job Requests</h3>
                <p className="text-3xl font-bold">{jobRequests.length}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-xl mb-4">Recent Job Requests</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobRequests.slice(0, 5).map(request => (
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
        )}
        
        {/* Seniors Tab */}
        {activeTab === "seniors" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Seniors</h1>
              <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded">
                Add Senior
              </button>
            </div>
            
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded shadow mb-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="w-full p-2 border rounded"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <select 
                    className="mt-1 block w-full p-2 border rounded"
                    value={filters.city}
                    onChange={(e) => setFilters({...filters, city: e.target.value})}
                  >
                    <option value="">All Cities</option>
                    {[...new Set(seniors.map(senior => senior.city))].map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="mt-1 block w-full p-2 border rounded"
                      value={filters.ageMin}
                      onChange={(e) => setFilters({...filters, ageMin: e.target.value})}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="mt-1 block w-full p-2 border rounded"
                      value={filters.ageMax}
                      onChange={(e) => setFilters({...filters, ageMax: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interest</label>
                  <input
                    type="text"
                    placeholder="Interest"
                    className="mt-1 block w-full p-2 border rounded"
                    value={filters.interest}
                    onChange={(e) => setFilters({...filters, interest: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Field</label>
                  <input
                    type="text"
                    placeholder="Work Field"
                    className="mt-1 block w-full p-2 border rounded"
                    value={filters.workField}
                    onChange={(e) => setFilters({...filters, workField: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            {/* Seniors Table */}
            <div className="bg-white rounded shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Fields</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSeniors.map(senior => (
                    <tr key={senior.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{senior.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{senior.age}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{senior.city}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{senior.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{senior.interests.join(", ")}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{senior.workFields.join(", ")}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Towns Tab */}
        {activeTab === "towns" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Towns</h1>
              <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded">
                Add Town
              </button>
            </div>
            
            {/* Towns Table */}
            <div className="bg-white rounded shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Town</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Municipality</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {towns.map(town => (
                    <tr key={town.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{town.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{town.municipality}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Job Requests Tab */}
        {activeTab === "jobs" && (
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
                      onChange={(e) => setNewJobRequest({...newJobRequest, type: e.target.value})}
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
                      onChange={(e) => setNewJobRequest({...newJobRequest, domain: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newJobRequest.location}
                      onChange={(e) => setNewJobRequest({...newJobRequest, location: e.target.value})}
                      required
                    >
                      <option value="">Select Town</option>
                      {towns.map(town => (
                        <option key={town.id} value={town.name}>{town.name}</option>
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
                      onChange={(e) => setNewJobRequest({...newJobRequest, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                </div>
                
                <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded">
                  Create Job Request
                </button>
              </form>
            </div>
            
            {/* Job Requests List */}
            <div className="bg-white rounded shadow overflow-hidden">
              <h3 className="text-xl font-bold p-4 border-b">Active Job Requests</h3>
              {jobRequests.map(request => (
                <div key={request.id} className="border-b p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold">{request.domain} ({request.type})</h4>
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
                    <h5 className="font-semibold mb-2">Matching Seniors ({findMatchingSeniors(request).length}):</h5>
                    {findMatchingSeniors(request).length > 0 ? (
                      <ul className="pl-5 list-disc">
                        {findMatchingSeniors(request).map(senior => (
                          <li key={senior.id}>{senior.name} - {senior.phone}</li>
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
        )}
      </div>
    </div>
  );
}