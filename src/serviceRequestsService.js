import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db, auth } from "./firebase";

// Collection reference
const serviceRequestsCollection = collection(db, "serviceRequests");

/**
 * Create a new service request
 * @param {Object} serviceRequestData - Service request data
 * @returns {Promise<string>} - ID of the created service request
 */
export const createServiceRequest = async (serviceRequestData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const serviceRequestRef = doc(serviceRequestsCollection);
    const serviceRequestId = serviceRequestRef.id;

    const newServiceRequest = {
      id: serviceRequestId,
      ...serviceRequestData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser.uid,
    };

    await setDoc(serviceRequestRef, newServiceRequest);
    return serviceRequestId;
  } catch (error) {
    console.error("Error creating service request:", error);
    throw error;
  }
};

/**
 * Get a service request by ID
 * @param {string} serviceRequestId - ID of the service request
 * @returns {Promise<Object|null>} - Service request data or null if not found
 */
export const getServiceRequestById = async (serviceRequestId) => {
  try {
    const serviceRequestDoc = await getDoc(doc(serviceRequestsCollection, serviceRequestId));
    if (serviceRequestDoc.exists()) {
      return serviceRequestDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting service request:", error);
    throw error;
  }
};

/**
 * Get all service requests
 * @returns {Promise<Array>} - Array of service request objects
 */
export const getServiceRequests = async () => {
  try {
    const q = query(serviceRequestsCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const serviceRequests = [];

    querySnapshot.forEach((doc) => {
      serviceRequests.push({ id: doc.id, ...doc.data() });
    });

    return serviceRequests;
  } catch (error) {
    console.error("Error getting service requests:", error);
    throw error;
  }
};

/**
 * Update a service request
 * @param {string} serviceRequestId - ID of the service request to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateServiceRequest = async (serviceRequestId, updateData) => {
  try {
    const serviceRequestRef = doc(serviceRequestsCollection, serviceRequestId);
    await updateDoc(serviceRequestRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating service request:", error);
    throw error;
  }
};

/**
 * Delete a service request
 * @param {string} serviceRequestId - ID of the service request to delete
 * @returns {Promise<void>}
 */
export const deleteServiceRequest = async (serviceRequestId) => {
  try {
    await deleteDoc(doc(serviceRequestsCollection, serviceRequestId));
  } catch (error) {
    console.error("Error deleting service request:", error);
    throw error;
  }
};