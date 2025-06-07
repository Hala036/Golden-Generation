import React, { useState } from "react";
import { useTranslation } from 'react-i18next';

// Mock data for seniors (added gender field)
const mockSeniors = [
  { id: 1, name: "David Cohen", age: 68, gender: "Male", phone: "054-1234567", city: "Springfield", interests: ["Reading", "Gardening"], workFields: ["Education", "Consulting"] },
  { id: 2, name: "Sarah Klein", age: 72, gender: "Female", phone: "050-7654321", city: "Riverside", interests: ["Cooking", "Art"], workFields: ["Healthcare"] },
  { id: 3, name: "Jacob Miller", age: 65, gender: "Male", phone: "052-9876543", city: "Lincoln", interests: ["Technology", "Music"], workFields: ["IT", "Engineering"] },
  { id: 4, name: "Ruth Gordon", age: 70, gender: "Female", phone: "053-3456789", city: "Springfield", interests: ["Walking", "History"], workFields: ["Finance"] },
];

const Retirees = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [dynamicFilters, setDynamicFilters] = useState([]);

  // Add a new filter
  const addFilter = () => {
    setDynamicFilters([...dynamicFilters, { key: "", value: "" }]);
  };

  // Update a filter
  const updateFilter = (index, key, value) => {
    const updatedFilters = [...dynamicFilters];
    updatedFilters[index] = { ...updatedFilters[index], [key]: value };
    setDynamicFilters(updatedFilters);
  };

  // Remove a filter
  const removeFilter = (index) => {
    const updatedFilters = dynamicFilters.filter((_, i) => i !== index);
    setDynamicFilters(updatedFilters);
  };

  // Filter seniors based on search term and dynamic filters
  const filteredSeniors = mockSeniors.filter((senior) => {
    const matchesSearch =
      searchTerm === "" ||
      Object.values(senior).some((value) =>
        Array.isArray(value)
          ? value.some((v) => v.toString().toLowerCase().includes(searchTerm.toLowerCase()))
          : value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesDynamicFilters = dynamicFilters.every((filter) => {
      if (!filter.key || !filter.value) return true;
      const seniorValue = senior[filter.key];
      return Array.isArray(seniorValue)
        ? seniorValue.some((v) => v.toString().toLowerCase().includes(filter.value.toLowerCase()))
        : seniorValue.toString().toLowerCase().includes(filter.value.toLowerCase());
    });

    return matchesSearch && matchesDynamicFilters;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Seniors</h1>
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded">
          {t('admin.retirees.addRetiree')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder={t('admin.retirees.filters.search')}
            className="w-full p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dynamic Filters */}
        <div className="space-y-4">
          {dynamicFilters.map((filter, index) => (
            <div key={index} className="flex space-x-4 items-center">
              <select
                className="p-2 border rounded"
                value={filter.key}
                onChange={(e) => updateFilter(index, "key", e.target.value)}
              >
                <option value="">Select Feature</option>
                {Object.keys(mockSeniors[0]).map((key) => (
                  <option key={key} value={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Enter value"
                className="p-2 border rounded"
                value={filter.value}
                onChange={(e) => updateFilter(index, "value", e.target.value)}
              />
              <button
                className="bg-[#FF4137] hover:bg-[#FF291E] text-white px-4 py-2 rounded"
                onClick={() => removeFilter(index)}
              >
                {t('admin.retirees.filters.remove')}
              </button>
            </div>
          ))}
          <button
            className="bg-[#7FDF7F] hover:bg-[#58D558] text-white px-4 py-2 rounded"
            onClick={addFilter}
          >
            {t('admin.retirees.filters.addFilter')}
          </button>
        </div>
      </div>

      {/* Seniors Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.retirees.table.name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.retirees.table.age')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.retirees.table.gender')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.retirees.table.work')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSeniors.map((senior) => (
              <tr key={senior.id}>
                <td className="px-6 py-4 whitespace-nowrap">{senior.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{senior.age}</td>
                <td className="px-6 py-4 whitespace-nowrap">{senior.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap">{senior.workFields.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Retirees;
