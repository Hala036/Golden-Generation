import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const AdminSettlements = () => {
  const [allSettlements, setAllSettlements] = useState([]);
  const [availableSettlements, setAvailableSettlements] = useState([]);
  const [newSettlement, setNewSettlement] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch settlements from API
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/settlements'); // Replace with your API endpoint
        const data = await response.json();
        setAllSettlements(data); // Update settlements state
      } catch (error) {
        console.error('Failed to fetch settlements:', error);
        toast.error('Failed to load settlements');
      } finally {
        setLoading(false);
      }
    };
    fetchSettlements();
  }, []);

  // Toggle settlement availability
  const toggleSettlement = async (settlement) => {
    try {
      if (availableSettlements.includes(settlement)) {
        // Remove from available
        await deleteDoc(doc(db, 'availableSettlements', settlement));
        setAvailableSettlements(prev => prev.filter(s => s !== settlement));
        toast.success(`${settlement} removed from available settlements`);
      } else {
        // Add to available
        await setDoc(doc(db, 'availableSettlements', settlement), { 
          name: settlement,
          available: true,
          createdAt: new Date().toISOString() 
        });
        setAvailableSettlements(prev => [...prev, settlement]);
        toast.success(`${settlement} added to available settlements`);
      }
    } catch (error) {
      console.error('Error toggling settlement:', error);
      toast.error('Failed to update settlement');
    }
  };

  // Add a completely new settlement
  const addNewSettlement = async () => {
    if (!newSettlement.trim()) return; // Ensure the input is not empty

    const settlementName = newSettlement.trim(); // Trim whitespace

    try {
      // Add to all settlements list if not already there
      if (!allSettlements.includes(settlementName)) {
        setAllSettlements(prev => [...prev, settlementName]);
      }

      // Add to available settlements in Firestore
      await setDoc(doc(db, 'availableSettlements', settlementName), { 
        name: settlementName,
        available: true,
        createdAt: new Date().toISOString()
      });

      // Update the available settlements state
      setAvailableSettlements(prev => [...prev, settlementName]);

      // Clear the input field
      setNewSettlement('');

      // Show success message
      toast.success(`${settlementName} added successfully`);
    } catch (error) {
      console.error('Error adding settlement:', error);
      toast.error('Failed to add new settlement');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading settlements...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Available Settlements</h1>
      
      {/* Add New Settlement Form */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Add New Settlement</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSettlement}
            onChange={(e) => setNewSettlement(e.target.value)}
            placeholder="Enter settlement name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FFD966] focus:border-[#FFD966]"
          />
          <button
            onClick={addNewSettlement}
            className="bg-[#FFD966] hover:bg-[#FFB800] text-gray-900 px-4 py-2 rounded-md font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </div>
      
      {/* Settlements List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allSettlements.map(settlement => (
          <div 
            key={settlement} 
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              availableSettlements.includes(settlement) 
                ? 'bg-green-50 border-green-400 shadow-sm' 
                : 'bg-gray-50 border-gray-200'
            }`}
            onClick={() => toggleSettlement(settlement)}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{settlement}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                availableSettlements.includes(settlement)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {availableSettlements.includes(settlement) ? 'Available' : 'Disabled'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSettlements;