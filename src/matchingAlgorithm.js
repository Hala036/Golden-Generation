import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

// Collection references
const jobRequestsCollection = collection(db, "jobRequests");
const usersCollection = collection(db, "users");

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

      // Calculate match score based on correct nested fields
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
  const scoreDetails = {
    locationScore: 0,
    interestsScore: 0,
    backgroundScore: 0,
    availabilityScore: 0,
    frequencyScore: 0,
    timingScore: 0,
    totalScore: 0
  };

  // Location match (40%)
  const seniorLocation = senior.personalDetails?.settlement || "";
  console.log("Comparing location:", { seniorLocation, jobLocation: jobRequest.location });
  if (seniorLocation && seniorLocation === jobRequest.location) {
    scoreDetails.locationScore = 40;
  }

  // Interests match (25%)
  const seniorInterests = senior.lifestyle?.interests || [];
  const jobRequestInterests = Array.isArray(jobRequest.volunteerField) ? jobRequest.volunteerField : [jobRequest.volunteerField];
  console.log("Comparing interests:", { seniorInterests, jobRequestInterests });
  if (seniorInterests.length > 0 && jobRequestInterests.length > 0) {
    const overlap = seniorInterests.filter(interest => jobRequestInterests.includes(interest));
    if (overlap.length > 0) {
      scoreDetails.interestsScore = Math.min(25, overlap.length * 10); // Max 25, 10 points per overlapping interest
    }
  }

  // Professional background match (25%)
  const seniorBackground = senior.workBackground?.selectedJob || senior.workBackground?.category || "";
  const jobBackground = jobRequest.professionalBackground || "";
  console.log("Comparing background:", { seniorBackground, jobBackground });
  if (seniorBackground && jobBackground) {
    if (seniorBackground === jobBackground) {
      scoreDetails.backgroundScore = 25;
    } else if (
      typeof seniorBackground === "string" &&
      typeof jobBackground === "string" &&
      (seniorBackground.toLowerCase().includes(jobBackground.toLowerCase()) ||
        jobBackground.toLowerCase().includes(seniorBackground.toLowerCase()))
    ) {
      scoreDetails.backgroundScore = 15;
    }
  }

  // Availability match (days) (10%)
  const jobDays = Array.isArray(jobRequest.days) ? jobRequest.days : [];
  const seniorDays = Array.isArray(senior.volunteerDays) && senior.volunteerDays.length > 0
    ? senior.volunteerDays
    : (Array.isArray(senior.additionalVolunteerDays) ? senior.additionalVolunteerDays : []);
  console.log("Comparing days:", { seniorDays, jobDays });
  if (jobDays.length && seniorDays.length) {
    const overlap = jobDays.filter(day => seniorDays.includes(day));
    if (overlap.length === jobDays.length) {
      scoreDetails.availabilityScore = 10;
    } else if (overlap.length > 0) {
      scoreDetails.availabilityScore = 5;
    }
  }

  // Frequency match (10%)
  const seniorFrequency = senior.volunteerFrequency || senior.additionalVolunteerFrequency || "";
  const jobFrequency = jobRequest.frequency || "";
  console.log("Comparing frequency:", { seniorFrequency, jobFrequency });
  if (seniorFrequency && jobFrequency && seniorFrequency === jobFrequency) {
    scoreDetails.frequencyScore = 10;
  } else if (
    seniorFrequency &&
    jobFrequency &&
    typeof seniorFrequency === "string" &&
    typeof jobFrequency === "string" &&
    seniorFrequency.toLowerCase().includes(jobFrequency.toLowerCase())
  ) {
    scoreDetails.frequencyScore = 5;
  }

  // Timing match (10%)
  const seniorTiming = senior.volunteerHours || senior.additionalVolunteerHours || "";
  const jobTiming = jobRequest.timing || "";
  console.log("Comparing timing:", { seniorTiming, jobTiming });
  if (seniorTiming && jobTiming && seniorTiming === jobTiming) {
    scoreDetails.timingScore = 10;
  } else if (
    seniorTiming &&
    jobTiming &&
    typeof seniorTiming === "string" &&
    typeof jobTiming === "string" &&
    seniorTiming.toLowerCase().includes(jobTiming.toLowerCase())
  ) {
    scoreDetails.timingScore = 5;
  }

  // Calculate total score
  scoreDetails.totalScore =
    scoreDetails.locationScore +
    scoreDetails.interestsScore +
    scoreDetails.backgroundScore +
    scoreDetails.availabilityScore +
    scoreDetails.frequencyScore +
    scoreDetails.timingScore;

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

    // Calculate match score
    const scoreDetails = calculateMatchScore(jobRequest, senior);

    return {
      jobRequest,
      senior,
      scoreDetails
    };
  } catch (error) {
    console.error("Error getting detailed match:", error);
    throw error;
  }
};

