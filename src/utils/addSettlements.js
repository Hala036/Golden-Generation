import Papa from 'papaparse';
import { addSettlement } from '../firebase'; // Adjust the path as needed

export const uploadSettlementsFromCSV = async () => {
  try {
    const response = await fetch('/settlements.csv');
    const csvText = await response.text();

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        const settlements = results.data
          .map(row => row.name?.trim())
          .filter(Boolean);

        for (const name of settlements) {
          await addSettlement(name);
        }

        alert('✅ CSV settlements uploaded successfully!');
      },
      error: function (error) {
        alert('❌ Error parsing CSV: ' + error.message);
      }
    });
  } catch (err) {
    console.error('❌ Failed to fetch CSV:', err);
    alert('❌ Failed to load the CSV file.');
  }
};
