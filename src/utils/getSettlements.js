// src/utils/getSettlements.js
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';

export const getAllSettlements = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'settlements'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return [];
  }
};
