import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  addDoc,
  arrayUnion
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { 
  performSeniorMatching,
  getDetailedMatch
} from "./matchingAlgorithm";

// Collection references
const jobRequestsCollection = collection(db, "jobRequests");
const usersCollection = collection(db, "users");
const notificationsCollection = collection(db, "notifications");

/**
 * Create a new job request
 * @param {Object} jobRequestData - Job request data
 * @returns {Promise<string>} - ID of the created job request
 */
export const createJobRequest = async (jobRequestData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const jobRequestRef = doc(jobRequestsCollection);
    const jobRequestId = jobRequestRef.id;

    // Prepare job request data WITHOUT statusHistory
    const {
      title = "",
      location = "",
      volunteerField = "",
      professionalBackground = "",
      frequency = "",
      timing = "",
      days = [],
      description = ""
    } = jobRequestData;

    const newJobRequest = {
      id: jobRequestId,
      title,
      location,
      volunteerField,
      professionalBackground,
      frequency,
      timing,
      days,
      description,
      status: "Active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser.uid,
      assignedSeniors: [],
      matchResults: [],
      // statusHistory will be added after creation
    };

    // 1. Create the job request document WITHOUT statusHistory
    await setDoc(jobRequestRef, newJobRequest);

    // 2. Add statusHistory with serverTimestamp() using updateDoc
    await updateDoc(jobRequestRef, {
      statusHistory: arrayUnion({
        status: "Active",
        timestamp: new Date().toISOString(), // Use client time as ISO string
        changedBy: currentUser.uid,
        notes: "Job request created"
      })
    });

    // Run matching algorithm after creating the job request
    await matchSeniorsToJobRequest(jobRequestId);

    return jobRequestId;
  } catch (error) {
    console.error("Error creating job request:", error);
    throw error;
  }
};

/**
 * Get a job request by ID
 * @param {string} jobRequestId - ID of the job request
 * @returns {Promise<Object|null>} - Job request data or null if not found
 */
export const getJobRequestById = async (jobRequestId) => {
  try {
    const jobRequestDoc = await getDoc(doc(jobRequestsCollection, jobRequestId));
    if (jobRequestDoc.exists()) {
      return jobRequestDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting job request:", error);
    throw error;
  }
};

/**
 * Get all job requests with optional filtering
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @param {string} filters.location - Filter by location
 * @param {string} filters.volunteerField - Filter by volunteer field
 * @returns {Promise<Array>} - Array of job request objects
 */
export const getJobRequests = async (filters = {}) => {
  try {
    let q = jobRequestsCollection;
    let hasFilters = false;
    
    // Apply filters if provided
    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
      hasFilters = true;
    }
    
    if (filters.location) {
      q = query(q, where("location", "==", filters.location));
      hasFilters = true;
    }
    
    if (filters.volunteerField) {
      q = query(q, where("volunteerField", "==", filters.volunteerField));
      hasFilters = true;
    }
    
    // Always order by creation date (newest first)
    q = query(q, orderBy("createdAt", "desc"));
    
    const querySnapshot = await getDocs(q);
    const jobRequests = [];
    
    querySnapshot.forEach((doc) => {
      jobRequests.push(doc.data());
    });
    
    return jobRequests;
  } catch (error) {
    console.error("Error getting job requests:", error);
    throw error;
  }
};

/**
 * Update a job request
 * @param {string} jobRequestId - ID of the job request to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateJobRequest = async (jobRequestId, updateData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    
    const jobRequestRef = doc(jobRequestsCollection, jobRequestId);
    const jobRequestDoc = await getDoc(jobRequestRef);
    
    if (!jobRequestDoc.exists()) {
      throw new Error("Job request not found");
    }
    
    const currentData = jobRequestDoc.data();
    
    // If status is being updated, add to status history
    if (updateData.status && updateData.status !== currentData.status) {
      const statusHistoryEntry = {
        status: updateData.status,
        timestamp: serverTimestamp(),
        changedBy: currentUser.uid,
        notes: updateData.statusNotes || `Status changed from ${currentData.status} to ${updateData.status}`
      };
      
      // Remove statusNotes from updateData as it's not a field in the job request
      if (updateData.statusNotes) {
        delete updateData.statusNotes;
      }

      // Use arrayUnion to append the new entry
      await updateDoc(jobRequestRef, {
        statusHistory: arrayUnion(statusHistoryEntry)
      });
    }
    
    // Update the updatedAt timestamp
    updateData.updatedAt = serverTimestamp();
    
    await updateDoc(jobRequestRef, updateData);
    
    // If significant fields changed, re-run matching algorithm
    if (updateData.location || updateData.volunteerField || updateData.professionalBackground || updateData.timing) {
      await matchSeniorsToJobRequest(jobRequestId);
    }
  } catch (error) {
    console.error("Error updating job request:", error);
    throw error;
  }
};

/**
 * Delete a job request
 * @param {string} jobRequestId - ID of the job request to delete
 * @returns {Promise<void>}
 */
export const deleteJobRequest = async (jobRequestId) => {
  try {
    await deleteDoc(doc(jobRequestsCollection, jobRequestId));
  } catch (error) {
    console.error("Error deleting job request:", error);
    throw error;
  }
};

/**
 * Match seniors to a job request based on criteria
 * @param {string} jobRequestId - ID of the job request
 * @returns {Promise<Array>} - Array of matched seniors with scores
 */
export const matchSeniorsToJobRequest = async (jobRequestId) => {
  try {
    return await performSeniorMatching(jobRequestId);
  } catch (error) {
    console.error("Error matching seniors to job request:", error);
    throw error;
  }
};

/**
 * Invite a senior to a job request
 * @param {string} jobRequestId - ID of the job request
 * @param {string} seniorId - ID of the senior to invite
 * @returns {Promise<void>}
 */
export const inviteSeniorToJobRequest = async (jobRequestId, seniorId) => {
  try {
    // Fetch the job request to get the title
    const jobRequestDoc = await getDoc(doc(jobRequestsCollection, jobRequestId));
    const jobRequest = jobRequestDoc.exists() ? jobRequestDoc.data() : {};
    const jobTitle = jobRequest.title || "a voluntary request";

    await addDoc(notificationsCollection, {
      recipientId: seniorId,
      type: "job_invitation",
      title: "New Voluntary Request",
      message: `You have been invited to a new job request: ${jobTitle}`,
      jobRequestId,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error inviting senior to job request:", error);
    throw error;
  }
};

/**
 * Update senior response to a job request invitation
 * @param {string} jobRequestId - ID of the job request
 * @param {string} seniorId - ID of the senior
 * @param {string} response - Response ("Accepted" or "Declined")
 * @returns {Promise<void>}
 */
export const updateSeniorResponse = async (jobRequestId, seniorId, response) => {
  try {
    const jobRequestRef = doc(jobRequestsCollection, jobRequestId);
    const jobRequestDoc = await getDoc(jobRequestRef);
    
    if (!jobRequestDoc.exists()) {
      throw new Error("Job request not found");
    }
    
    const jobRequest = jobRequestDoc.data();
    
    // Find the senior's assignment
    const assignmentIndex = jobRequest.assignedSeniors.findIndex(
      assignment => assignment.seniorId === seniorId
    );
    
    if (assignmentIndex === -1) {
      throw new Error("Senior is not assigned to this job request");
    }
    
    // Update the assignment
    const updatedAssignedSeniors = [...jobRequest.assignedSeniors];
    updatedAssignedSeniors[assignmentIndex] = {
      ...updatedAssignedSeniors[assignmentIndex],
      status: response,
      responseAt: serverTimestamp()
    };
    
    await updateDoc(jobRequestRef, {
      assignedSeniors: updatedAssignedSeniors,
      updatedAt: serverTimestamp()
    });
    
    // Create notification for the admin
    await addDoc(notificationsCollection, {
      recipientId: jobRequest.createdBy,
      type: "senior_response",
      jobRequestId,
      message: `A senior has ${response.toLowerCase()} your job request: ${jobRequest.title}`,
      read: false,
      createdAt: serverTimestamp()
    });
    
    // If all invited seniors have responded and at least one accepted,
    // update job request status to "In Progress"
    const allResponded = updatedAssignedSeniors.every(
      assignment => assignment.status !== "Invited"
    );
    
    const anyAccepted = updatedAssignedSeniors.some(
      assignment => assignment.status === "Accepted"
    );
    
    if (allResponded && anyAccepted && jobRequest.status === "Active") {
      await updateJobRequest(jobRequestId, {
        status: "In Progress",
        statusNotes: "Automatically updated as seniors have accepted the invitation"
      });
    }
  } catch (error) {
    console.error("Error updating senior response:", error);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param {string} userId - ID of the user
 * @param {boolean} unreadOnly - Whether to get only unread notifications
 * @returns {Promise<Array>} - Array of notification objects
 */
export const getNotifications = async (userId, unreadOnly = false) => {
  try {
    let q = query(
      notificationsCollection,
      where("recipientId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    if (unreadOnly) {
      q = query(q, where("read", "==", false));
    }
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return notifications;
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - ID of the notification
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(notificationsCollection, notificationId), {
      read: true
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

