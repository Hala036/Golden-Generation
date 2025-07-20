import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

// Collection references
const jobRequestsCollection = collection(db, "jobRequests");
const usersCollection = collection(db, "users");
const configCollection = collection(db, "config");

// Default score weights
const DEFAULT_WEIGHTS = {
  locationScore: 20,
  interestsScore: 15,
  backgroundScore: 15,
  daysScore: 10,
  hoursScore: 10,
  frequencyScore: 10,
  areasScore: 10,
  degreesScore: 10
};

/**
 * Get global score weights from Firebase config
 * @returns {Promise<Object>} - Global score weights
 */
export const getGlobalScoreWeights = async () => {
  try {
    const configRef = doc(configCollection, "scoreWeights");
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      const data = configDoc.data();
      return data.weights || DEFAULT_WEIGHTS;
    }
    
    // If no config exists, return default weights
    return DEFAULT_WEIGHTS;
  } catch (error) {
    console.error("Error fetching global score weights:", error);
    return DEFAULT_WEIGHTS;
  }
};

/**
 * Save global score weights to Firebase config
 * @param {Object} weights - Score weights to save
 * @returns {Promise<void>}
 */
export const saveGlobalScoreWeights = async (weights) => {
  try {
    const configRef = doc(configCollection, "scoreWeights");
    await setDoc(configRef, {
      weights,
      updatedAt: serverTimestamp(),
      updatedBy: "admin" // You can modify this to include actual admin user info
    }, { merge: true });
    
    console.log("Global score weights saved successfully");
  } catch (error) {
    console.error("Error saving global score weights:", error);
    throw error;
  }
};

/**
 * Match seniors to a job request based on criteria
 * @param {string} jobRequestId - ID of the job request
 * @returns {Promise<Array>} - Array of matched seniors with scores
 */
export const performSeniorMatching = async (jobRequestId) => {
  try {
    console.log(`Starting matching algorithm for job request: ${jobRequestId}`);
    const jobRequestRef = doc(jobRequestsCollection, jobRequestId);
    const jobRequestDoc = await getDoc(jobRequestRef);

    if (!jobRequestDoc.exists()) {
      throw new Error("Voluntary request not found");
    }

    const jobRequest = jobRequestDoc.data();
    console.log(`Job request found: ${jobRequest.title}`);

    // Get all seniors (users with role 'retiree')
    const seniorsQuery = query(usersCollection, where("role", "==", "retiree"));
    const seniorsSnapshot = await getDocs(seniorsQuery);

    console.log(`Found ${seniorsSnapshot.size} seniors to match against`);

    const matchResults = [];
    const timestampNow = Timestamp.now();

    seniorsSnapshot.forEach((seniorDoc) => {
      const senior = seniorDoc.data();
      const seniorId = seniorDoc.id;

      // Calculate match score based on static max values
      const scoreDetails = calculateMatchScore(jobRequest, senior);
      const totalScore = scoreDetails.totalScore;

      console.log(`Senior ${seniorId} match score: ${totalScore}`);
      console.log(`Score details for ${seniorId}:`, scoreDetails);
      console.log("Job request data:", jobRequest);

      // Add to match results if score is above threshold (e.g., 10)
      if (totalScore >= 10) {
        matchResults.push({
          seniorId: seniorId,
          seniorName: senior.credentials?.username || "Unknown",
          seniorLocation: senior.personalDetails?.settlement || "Unknown",
          seniorBackground: senior.workBackground?.selectedJob || senior.workBackground?.category || "",
          seniorInterests: senior.lifestyle?.interests || [],
          seniorDays: senior.volunteerDays && senior.volunteerDays.length > 0
            ? senior.volunteerDays
            : (senior.additionalVolunteerDays || []),
          score: totalScore,
          scoreDetails: scoreDetails,
          matchedAt: timestampNow
        });
      }
    });

    // Sort by score (highest first)
    matchResults.sort((a, b) => b.score - a.score);

    console.log(`Found ${matchResults.length} matching seniors above threshold`);

    // Update job request with match results in Firestore
    await updateDoc(jobRequestRef, {
      matchResults,
      updatedAt: serverTimestamp()
    });

    // Optionally, return the results for further use in the app
    return matchResults;
  } catch (error) {
    console.error("Error matching seniors to job request:", error);
    throw error;
  }
};

/**
 * Calculate match score between a job request and a senior
 * @param {Object} jobRequest - Job request data
 * @param {Object} senior - Senior data
 * @returns {Object} - Score details and total score
 */
export const calculateMatchScore = (jobRequest, senior) => {
  // Static max values
  const MAX_LOCATION = 40;
  const MAX_INTERESTS = 15;
  const MAX_BACKGROUND = 25;
  const MAX_AVAILABILITY = 10;

  const scoreDetails = {
    locationScore: 0,
    interestsScore: 0,
    backgroundScore: 0,
    daysScore: 0,
    hoursScore: 0,
    frequencyScore: 0,
    totalScore: 0
  };

  // Location match
  const seniorLocation = senior.personalDetails?.settlement || "";
  if (seniorLocation && seniorLocation === jobRequest.location) {
    scoreDetails.locationScore = MAX_LOCATION;
  }

  // Interests match (3 points per overlap, max 15)
  const seniorInterests = senior.lifestyle?.interests || [];
  const jobInterests = Array.isArray(jobRequest.interests) ? jobRequest.interests : [];
  if (seniorInterests.length > 0 && jobInterests.length > 0) {
    const overlap = seniorInterests.filter(interest => jobInterests.includes(interest));
    scoreDetails.interestsScore = Math.min(MAX_INTERESTS, overlap.length * 3);
  }

  // Professional background match (full for exact, half for partial, max 25)
  const retireeCustomJobInfo = senior.workBackground?.customJobInfo || {};
  const retireeOriginal = retireeCustomJobInfo.originalSelection || {};
  const retireeJobFields = [
    retireeOriginal.category,
    retireeOriginal.jobTitle,
    retireeOriginal.subspecialty,
    retireeCustomJobInfo.customJobTitle,
    senior.workBackground?.jobTitle,
    senior.workBackground?.subspecialty,
    senior.workBackground?.otherJob
  ].filter(Boolean);
  const requestJobFields = [
    jobRequest.jobCategory,
    jobRequest.jobTitle,
    jobRequest.jobSubspecialty,
    jobRequest.customJob
  ].filter(Boolean);
  let bestJobScore = 0;
  for (const retireeField of retireeJobFields) {
    for (const requestField of requestJobFields) {
      if (retireeField && requestField) {
        if (retireeField === requestField) {
          bestJobScore = Math.max(bestJobScore, MAX_BACKGROUND);
        } else if (
          typeof retireeField === "string" &&
          typeof requestField === "string" &&
          (retireeField.toLowerCase().includes(requestField.toLowerCase()) ||
            requestField.toLowerCase().includes(retireeField.toLowerCase()))
        ) {
          bestJobScore = Math.max(bestJobScore, Math.floor(MAX_BACKGROUND * 0.5));
        }
      }
    }
  }
  scoreDetails.backgroundScore = bestJobScore;

  // Availability (sum of days, hours, frequency, max 10)
  const seniorDays = Array.isArray(senior.volunteerDays) ? senior.volunteerDays : [];
  const jobDays = Array.isArray(jobRequest.volunteerDays) ? jobRequest.volunteerDays : [];
  if (seniorDays.length && jobDays.length) {
    const overlap = jobDays.filter(day => seniorDays.includes(day));
    scoreDetails.daysScore = Math.min(3, overlap.length * 1); // up to 3
  }
  const seniorHours = Array.isArray(senior.volunteerHours) ? senior.volunteerHours : [];
  const jobHours = Array.isArray(jobRequest.volunteerHours) ? jobRequest.volunteerHours : [];
  if (seniorHours.length && jobHours.length) {
    const overlap = jobHours.filter(hour => seniorHours.includes(hour));
    scoreDetails.hoursScore = Math.min(4, overlap.length * 2); // up to 4
  }
  const seniorFrequency = Array.isArray(senior.volunteerFrequency) ? senior.volunteerFrequency : (senior.volunteerFrequency ? [senior.volunteerFrequency] : []);
  const jobFrequency = Array.isArray(jobRequest.volunteerFrequency) ? jobRequest.volunteerFrequency : [];
  if (seniorFrequency.length && jobFrequency.length) {
    const overlap = jobFrequency.filter(f => seniorFrequency.includes(f));
    scoreDetails.frequencyScore = Math.min(3, overlap.length * 1); // up to 3
  }

  // Total score (sum of all fields, no scaling)
  const rawTotal =
    scoreDetails.locationScore +
    scoreDetails.interestsScore +
    scoreDetails.backgroundScore +
    scoreDetails.daysScore +
    scoreDetails.hoursScore +
    scoreDetails.frequencyScore;
  scoreDetails.totalScore = rawTotal;

  // Scaled total score out of 100
  const totalMax = 40 + 15 + 25 + 10; // 90
  scoreDetails.scaledTotalScore = Math.round((rawTotal / totalMax) * 100);

  return scoreDetails;
};

/**
 * Get detailed match information for a specific senior and job request
 * @param {string} jobRequestId - ID of the job request
 * @param {string} seniorId - ID of the senior
 * @returns {Promise<Object>} - Detailed match information
 */
export const getDetailedMatch = async (jobRequestId, seniorId) => {
  try {
    const jobRequestDoc = await getDoc(doc(jobRequestsCollection, jobRequestId));
    const seniorDoc = await getDoc(doc(usersCollection, seniorId));

    if (!jobRequestDoc.exists() || !seniorDoc.exists()) {
      throw new Error("Job request or senior not found");
    }

    const jobRequest = jobRequestDoc.data();
    const senior = seniorDoc.data();

    // Get global weights and calculate match score
    const globalWeights = await getGlobalScoreWeights();
    const scoreDetails = await calculateMatchScore(jobRequest, senior);

    return {
      jobRequest,
      senior,
      scoreDetails,
      globalWeights // Include weights for reference
    };
  } catch (error) {
    console.error("Error getting detailed match:", error);
    throw error;
  }
};

/**
 * Save manual field weights for a specific match (jobRequestId + seniorId)
 * @param {string} jobRequestId
 * @param {string} seniorId
 * @param {object} weights - { locationScore, interestsScore, backgroundScore, availabilityScore }
 * @returns {Promise<void>}
 */
export const saveManualWeights = async (jobRequestId, seniorId, weights) => {
  const jobRequestRef = doc(jobRequestsCollection, jobRequestId);
  // Store under a nested field: manualWeights.seniorId = weights
  await updateDoc(jobRequestRef, {
    [`manualWeights.${seniorId}`]: weights,
    updatedAt: serverTimestamp()
  });
};

/**
 * Get manual field weights for a specific match (jobRequestId + seniorId)
 * @param {string} jobRequestId
 * @param {string} seniorId
 * @returns {Promise<object|null>} - weights or null if not set
 */
export const getManualWeights = async (jobRequestId, seniorId) => {
  const jobRequestRef = doc(jobRequestsCollection, jobRequestId);
  const jobRequestDoc = await getDoc(jobRequestRef);
  if (!jobRequestDoc.exists()) return null;
  const data = jobRequestDoc.data();
  return data.manualWeights && data.manualWeights[seniorId] ? data.manualWeights[seniorId] : null;
};