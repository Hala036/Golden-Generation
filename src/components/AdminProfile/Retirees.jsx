import React, { useState } from "react";

// Mock data for seniors
const mockSeniors = [
  { id: 1, name: "David Cohen", age: 68, phone: "054-1234567", city: "Springfield", interests: ["Reading", "Gardening"], workFields: ["Education", "Consulting"] },
  { id: 2, name: "Sarah Klein", age: 72, phone: "050-7654321", city: "Riverside", interests: ["Cooking", "Art"], workFields: ["Healthcare"] },
  { id: 3, name: "Jacob Miller", age: 65, phone: "052-9876543", city: "Lincoln", interests: ["Technology", "Music"], workFields: ["IT", "Engineering"] },
  { id: 4, name: "Ruth Gordon", age: 70, phone: "053-3456789", city: "Springfield", interests: ["Walking", "History"], workFields: ["Finance"] },
];

const Retirees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    city: "",
    ageMin: "",
    ageMax: "",
    interest: "",
    workField: "",
  });

  // Filter seniors based on search term and filters
  const filteredSeniors = mockSeniors.filter((senior) => {
    const matchesSearch = senior.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = !filters.city || senior.city === filters.city;
    const matchesAge =
      (!filters.ageMin || senior.age >= parseInt(filters.ageMin)) &&
      (!filters.ageMax || senior.age <= parseInt(filters.ageMax));
    const matchesInterest =
      !filters.interest ||
      senior.interests.some((i) => i.toLowerCase().includes(filters.interest.toLowerCase()));
    const matchesWorkField =
      !filters.workField ||
      senior.workFields.some((w) => w.toLowerCase().includes(filters.workField.toLowerCase()));

    return matchesSearch && matchesCity && matchesAge && matchesInterest && matchesWorkField;
  });

  return (
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
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            >
              <option value="">All Cities</option>
              {[...new Set(mockSeniors.map((senior) => senior.city))].map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
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
                onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
              />
              <input
                type="number"
                placeholder="Max"
                className="mt-1 block w-full p-2 border rounded"
                value={filters.ageMax}
                onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
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
              onChange={(e) => setFilters({ ...filters, interest: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Work Field</label>
            <input
              type="text"
              placeholder="Work Field"
              className="mt-1 block w-full p-2 border rounded"
              value={filters.workField}
              onChange={(e) => setFilters({ ...filters, workField: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Seniors Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interests
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Work Fields
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSeniors.map((senior) => (
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
  );
};

export default Retirees;
