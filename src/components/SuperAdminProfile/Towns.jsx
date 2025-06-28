import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaTrash } from "react-icons/fa";
import EmptyState from "../EmptyState"; // Import EmptyState component
import { useLanguage } from "../../context/LanguageContext"; // Import useLanguage
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Mock data for towns
const mockTowns = [
  { id: 1, name: "Springfield", municipality: "Clarke County" },
  { id: 2, name: "Riverside", municipality: "Adams County" },
  { id: 3, name: "Lincoln", municipality: "Jefferson County" },
];

const Towns = () => {
  const { t } = useLanguage(); // Add translation hook
  const [towns, setTowns] = useState(mockTowns);
  const [newTown, setNewTown] = useState({ name: "", municipality: "" });
  const [showForm, setShowForm] = useState(false); // State to toggle form visibility
  const [loading, setLoading] = useState(true);

  // Handle adding a new town
  const handleAddTown = (e) => {
    e.preventDefault();
    if (newTown.name && newTown.municipality) {
      setTowns([...towns, { id: towns.length + 1, ...newTown }]);
      setNewTown({ name: "", municipality: "" });
      setShowForm(false); // Hide the form after adding a town
    }
  };

  // Handle deleting a town
  const handleDeleteTown = (id) => {
    setTowns(towns.filter((town) => town.id !== id));
  };

  // Loading skeleton for towns
  const TownsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-6"></div>
              <div className="h-6 bg-gray-200 rounded w-6"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-8"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-10"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Loading skeleton for table rows
  const TableSkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-16 mx-4"></div>
          <div className="h-6 bg-gray-200 rounded w-20 mx-4"></div>
          <div className="h-6 bg-gray-200 rounded w-12 mx-4"></div>
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-200 rounded w-6"></div>
            <div className="h-6 bg-gray-200 rounded w-6"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Towns</h1>
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded"
          onClick={() => setShowForm(!showForm)} // Toggle form visibility
        >
          {showForm ? "Cancel" : "Add Town"}
        </button>
      </div>

      {/* Add Town Form */}
      {showForm && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h3 className="text-xl font-bold mb-4">Add New Town</h3>
          <form onSubmit={handleAddTown}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Town Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full p-2 border rounded"
                  placeholder="Enter town name"
                  value={newTown.name}
                  onChange={(e) => setNewTown({ ...newTown, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Municipality</label>
                <input
                  type="text"
                  className="mt-1 block w-full p-2 border rounded"
                  placeholder="Enter municipality"
                  value={newTown.municipality}
                  onChange={(e) => setNewTown({ ...newTown, municipality: e.target.value })}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded"
            >
              Add Town
            </button>
          </form>
        </div>
      )}

      {/* Towns Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        {loading ? (
          <TownsSkeleton />
        ) : towns.length === 0 ? (
          <EmptyState
            icon={<FaMapMarkerAlt className="text-6xl text-gray-300" />}
            title={t('emptyStates.noTowns')}
            message={t('emptyStates.noTownsMessage')}
            actionLabel={t('emptyStates.addTown')}
            onAction={() => setShowForm(true)}
            className="p-8"
          />
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Town
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Municipality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {towns.map((town) => (
                  <tr key={town.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{town.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{town.municipality}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        onClick={() => handleDeleteTown(town.id)}
                        title="Delete town"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default Towns;
