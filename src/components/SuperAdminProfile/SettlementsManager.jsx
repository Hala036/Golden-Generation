import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getAvailableSettlements,
  removeSettlement,
  toggleSettlementAvailability,
  uploadSettlementsFromCSV
} from '../../data/addSettlements';
import { Trash2, Upload } from 'lucide-react';

const SettlementsManager = () => {
  const [allSettlements, setAllSettlements] = useState([]);
  const [availableSettlements, setAvailableSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Reusable fetch function
  const fetchSettlements = async () => {
    try {
      const response = await fetch('/api/settlements');
      const data = await response.json();
      const names = data.map(settlement => settlement.name);
      setAllSettlements(names);
      setAvailableSettlements(names);
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  // ✅ Toggle availability
  const handleToggle = async (settlement) => {
    try {
      await toggleSettlementAvailability(settlement);
      toast.success(`${settlement} availability toggled`);
      fetchSettlements();
    } catch (err) {
      toast.error('Failed to toggle settlement');
    }
  };

  // ✅ Delete permanently
  const handleDelete = async (settlement) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${settlement}"?`)) return;
    try {
      await removeSettlement(settlement);
      toast.success(`Removed: ${settlement}`);
      fetchSettlements();
    } catch (err) {
      toast.error('Failed to remove settlement');
    }
  };

  // ✅ Upload from CSV and refresh
  const handleCSVUpload = async () => {
    try {
      await uploadSettlementsFromCSV();
      toast.success('Settlements uploaded from CSV');
      fetchSettlements();
    } catch (err) {
      console.error(err);
      toast.error('CSV upload failed');
    }
  };

  const filteredSettlements = allSettlements.filter(s =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settlement Manager</h1>
        <button
          onClick={handleCSVUpload}
          className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
        >
          <Upload size={18} />
          Upload CSV
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search settlements..."
          className="w-full px-3 py-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading settlements...</p>
      ) : filteredSettlements.length === 0 ? (
        <p>No settlements found.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSettlements.map((settlement, index) => (
            <li
              key={index}
              className={`p-4 rounded shadow flex justify-between items-center ${
                availableSettlements.includes(settlement)
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }`}
            >
              <span className="font-medium">{settlement}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(settlement)}
                  className="text-sm text-blue-700 underline"
                >
                  Toggle
                </button>
                <button
                  onClick={() => handleDelete(settlement)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SettlementsManager;
// This component manages settlements, allowing toggling availability, deleting, and uploading from CSV.