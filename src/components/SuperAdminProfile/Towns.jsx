import React, { useState } from "react";

// Mock data for towns
const mockTowns = [
  { id: 1, name: "Springfield", municipality: "Clarke County" },
  { id: 2, name: "Riverside", municipality: "Adams County" },
  { id: 3, name: "Lincoln", municipality: "Jefferson County" },
];

const Towns = () => {
  const [towns, setTowns] = useState(mockTowns);
  const [newTown, setNewTown] = useState({ name: "", municipality: "" });
  const [showForm, setShowForm] = useState(false); // State to toggle form visibility

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
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteTown(town.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Towns;
