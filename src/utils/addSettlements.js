// addSettlements.js
import { addSettlement, getAvailableSettlements } from './firebase';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

// You can use this function to add multiple settlements
const addMultipleSettlements = async (settlementNames) => {
  console.log("Adding settlements...");
  for (const name of settlementNames) {
    await addSettlement(name);
  }
  console.log("All settlements added successfully!");
  
  // Let's verify they were added
  const currentSettlements = await getAvailableSettlements();
  console.log("Current available settlements:", currentSettlements.map(s => s.name));
};

// List of settlements to add
const SETTLEMENTS_TO_ADD = [
  "Jerusalem",
  "Tel Aviv",
  "Haifa",
  "Binyamin" // Add your settlement here
];

// Run the function
addMultipleSettlements(SETTLEMENTS_TO_ADD)
  .then(() => console.log("Script completed"))
  .catch(error => console.error("Error running script:", error));

// If you want to run this script directly:
// 1. Save this file as addSettlements.js
// 2. Run with: node addSettlements.js (if using Node.js)
// Or import and call the function from your application code

useEffect(() => {
  const fetchSettlements = async () => {
    try {
      const response = await fetch('/api/settlements/available');
      const data = await response.json();
      setSettlements(data);
    } catch (error) {
      console.error('Error fetching settlements:', error);
      toast.error('Failed to load available settlements');
    } finally {
      setLoading(prev => ({ ...prev, settlements: false }));
    }
  };

  fetchSettlements();
}, []);

