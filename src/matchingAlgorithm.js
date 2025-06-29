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
 * Map volunteer field from service request to veterans community volunteer areas
 * @param {string} volunteerField - Volunteer field from service request
 * @returns {Array} - Array of corresponding volunteer area IDs
 */
const mapVolunteerFieldToAreas = (volunteerField) => {
  const field = volunteerField.toLowerCase();
  
  // Mapping from service request volunteer fields to veterans community volunteer areas
  const fieldMapping = {
    'healthcare': ['health'],
    'health': ['health'],
    'education': ['teaching'],
    'teaching': ['teaching'],
    'technology': ['high-tech'],
    'high tech': ['high-tech'],
    'high-tech': ['high-tech'],
    'arts': ['culture'],
    'culture': ['culture'],
    'social services': ['publicity', 'health'],
    'administration': ['publicity'],
    'consulting': ['publicity'],
    'mentoring': ['teaching'],
    'home assistance': ['eater', 'craftsmanship'],
    'transportation': ['aaliyah'],
    'publicity': ['publicity'],
    'tourism': ['tourism'],
    'safety': ['safety'],
    'funds': ['funds'],
    'fundraising': ['funds'],
    'craftsmanship': ['craftsmanship'],
    'aaliyah': ['aaliyah'],
    'special events': ['special-treat'],
    'special treats': ['special-treat'],
    'catering': ['eater'],
    'food service': ['eater'],
    'eater': ['eater']
  };
  
  return fieldMapping[field] || [];
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
          seniorBackground: senior.workBackground?.category || "",
          seniorInterests: senior.lifestyle?.interests || [],
          seniorDays: getSeniorVolunteerDays(senior),
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
 * Get senior's volunteer days from the correct data structure
 * @param {Object} senior - Senior data
 * @returns {Array} - Array of volunteer days
 */
const getSeniorVolunteerDays = (senior) => {
  const veteransCommunity = senior.veteransCommunity || {};
  
  // Check current volunteer days first
  if (veteransCommunity.volunteerDays && veteransCommunity.volunteerDays.length > 0) {
    return veteransCommunity.volunteerDays;
  }
  
  // Check additional volunteer days as fallback
  if (veteransCommunity.additionalVolunteerDays && veteransCommunity.additionalVolunteerDays.length > 0) {
    return veteransCommunity.additionalVolunteerDays;
  }
  
  return [];
};

/**
 * Get senior's volunteer frequency from the correct data structure
 * @param {Object} senior - Senior data
 * @returns {string} - Volunteer frequency
 */
const getSeniorVolunteerFrequency = (senior) => {
  const veteransCommunity = senior.veteransCommunity || {};
  
  // Check current volunteer frequency first
  if (veteransCommunity.volunteerFrequency) {
    return veteransCommunity.volunteerFrequency;
  }
  
  // Check additional volunteer frequency as fallback
  if (veteransCommunity.additionalVolunteerFrequency) {
    return veteransCommunity.additionalVolunteerFrequency;
  }
  
  return "";
};

/**
 * Get senior's volunteer hours from the correct data structure
 * @param {Object} senior - Senior data
 * @returns {string} - Volunteer hours
 */
const getSeniorVolunteerHours = (senior) => {
  const veteransCommunity = senior.veteransCommunity || {};
  
  // Check current volunteer hours first
  if (veteransCommunity.volunteerHours) {
    return veteransCommunity.volunteerHours;
  }
  
  // Check additional volunteer hours as fallback
  if (veteransCommunity.additionalVolunteerHours) {
    return veteransCommunity.additionalVolunteerHours;
  }
  
  return "";
};

/**
 * Get senior's volunteer areas from the correct data structure
 * @param {Object} senior - Senior data
 * @returns {Array} - Array of volunteer areas
 */
const getSeniorVolunteerAreas = (senior) => {
  const veteransCommunity = senior.veteransCommunity || {};
  
  // Check current volunteer areas first
  if (veteransCommunity.volunteerAreas && veteransCommunity.volunteerAreas.length > 0) {
    return veteransCommunity.volunteerAreas;
  }
  
  // Check additional volunteer fields as fallback
  if (veteransCommunity.additionalVolunteerFields && veteransCommunity.additionalVolunteerFields.length > 0) {
    return veteransCommunity.additionalVolunteerFields;
  }
  
  return [];
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
    volunteerAreasScore: 0,
    totalScore: 0
  };

  // Debug logging
  console.log("=== MATCHING DEBUG ===");
  console.log("Job Request:", {
    title: jobRequest.title,
    location: jobRequest.location,
    volunteerField: jobRequest.volunteerField,
    professionalBackground: jobRequest.professionalBackground,
    frequency: jobRequest.frequency,
    timing: jobRequest.timing,
    days: jobRequest.days
  });

  console.log("Senior Data:", {
    id: senior.id,
    location: senior.personalDetails?.settlement,
    background: senior.workBackground?.category,
    veteransCommunity: senior.veteransCommunity
  });

  // Location match (30%)
  const seniorLocation = senior.personalDetails?.settlement || "";
  if (seniorLocation && seniorLocation === jobRequest.location) {
    scoreDetails.locationScore = 30;
    console.log("✅ Location match:", seniorLocation);
  } else {
    console.log("❌ Location mismatch:", { senior: seniorLocation, job: jobRequest.location });
  }

  // Volunteer areas match (25%)
  const seniorVolunteerAreas = getSeniorVolunteerAreas(senior);
  const jobVolunteerField = jobRequest.volunteerField || "";
  
  console.log("Volunteer Areas Comparison:", {
    seniorAreas: seniorVolunteerAreas,
    jobField: jobVolunteerField
  });
  
  if (seniorVolunteerAreas.length > 0 && jobVolunteerField) {
    // Map the job volunteer field to corresponding volunteer areas
    const mappedAreas = mapVolunteerFieldToAreas(jobVolunteerField);
    console.log("Mapped areas for job field:", mappedAreas);
    
    // Check for exact matches with mapped areas
    const exactMatches = seniorVolunteerAreas.filter(area => 
      mappedAreas.includes(area)
    );
    
    console.log("Exact matches found:", exactMatches);
    
    if (exactMatches.length > 0) {
      scoreDetails.volunteerAreasScore = 25;
      console.log("✅ Volunteer areas exact match:", exactMatches);
    } else {
      // Check for partial matches
      const jobFieldLower = jobVolunteerField.toLowerCase();
      const partialMatches = seniorVolunteerAreas.filter(area => 
        area.toLowerCase().includes(jobFieldLower) || 
        jobFieldLower.includes(area.toLowerCase())
      );
      
      console.log("Partial matches found:", partialMatches);
      
      if (partialMatches.length > 0) {
        scoreDetails.volunteerAreasScore = Math.min(15, partialMatches.length * 5);
        console.log("✅ Volunteer areas partial match:", partialMatches);
      } else {
        console.log("❌ No volunteer areas match");
      }
    }
  } else {
    console.log("❌ Missing volunteer data:", { 
      seniorAreas: seniorVolunteerAreas.length, 
      jobField: !!jobVolunteerField 
    });
  }

  // Professional background match (20%)
  const seniorBackground = senior.workBackground?.category || "";
  const jobBackground = jobRequest.professionalBackground || "";
  if (seniorBackground && jobBackground && seniorBackground === jobBackground) {
    scoreDetails.backgroundScore = 20;
    console.log("✅ Background exact match:", seniorBackground);
  } else if (
    seniorBackground &&
    jobBackground &&
    typeof seniorBackground === "string" &&
    typeof jobBackground === "string" &&
    (seniorBackground.toLowerCase().includes(jobBackground.toLowerCase()) ||
      jobBackground.toLowerCase().includes(seniorBackground.toLowerCase()))
  ) {
    scoreDetails.backgroundScore = 10;
    console.log("✅ Background partial match:", { senior: seniorBackground, job: jobBackground });
  } else {
    console.log("❌ Background mismatch:", { senior: seniorBackground, job: jobBackground });
  }

  // Availability match (days) (10%)
  const jobDays = Array.isArray(jobRequest.days) ? jobRequest.days : [];
  const seniorDays = getSeniorVolunteerDays(senior);
  
  console.log("Days Comparison:", {
    jobDays: jobDays,
    seniorDays: seniorDays
  });
  
  if (jobDays.length && seniorDays.length) {
    const overlap = jobDays.filter(day => seniorDays.includes(day));
    console.log("Days overlap:", overlap);
    
    if (overlap.length === jobDays.length) {
      scoreDetails.availabilityScore = 10;
      console.log("✅ Days perfect match");
    } else if (overlap.length > 0) {
      scoreDetails.availabilityScore = 5;
      console.log("✅ Days partial match:", overlap);
    } else {
      console.log("❌ No days overlap");
    }
  } else {
    console.log("❌ Missing days data:", { jobDays: jobDays.length, seniorDays: seniorDays.length });
  }

  // Frequency match (10%)
  const seniorFrequency = getSeniorVolunteerFrequency(senior);
  const jobFrequency = jobRequest.frequency || "";
  
  console.log("Frequency Comparison:", {
    senior: seniorFrequency,
    job: jobFrequency
  });
  
  if (seniorFrequency && jobFrequency && seniorFrequency === jobFrequency) {
    scoreDetails.frequencyScore = 10;
    console.log("✅ Frequency exact match:", seniorFrequency);
  } else if (
    seniorFrequency &&
    jobFrequency &&
    typeof seniorFrequency === "string" &&
    typeof jobFrequency === "string" &&
    seniorFrequency.toLowerCase().includes(jobFrequency.toLowerCase())
  ) {
    scoreDetails.frequencyScore = 5;
    console.log("✅ Frequency partial match");
  } else {
    console.log("❌ Frequency mismatch");
  }

  // Timing match (5%)
  const seniorTiming = getSeniorVolunteerHours(senior);
  const jobTiming = jobRequest.timing || "";
  
  console.log("Timing Comparison:", {
    senior: seniorTiming,
    job: jobTiming
  });
  
  if (seniorTiming && jobTiming && seniorTiming === jobTiming) {
    scoreDetails.timingScore = 5;
    console.log("✅ Timing exact match:", seniorTiming);
  } else if (
    seniorTiming &&
    jobTiming &&
    typeof seniorTiming === "string" &&
    typeof jobTiming === "string" &&
    seniorTiming.toLowerCase().includes(jobTiming.toLowerCase())
  ) {
    scoreDetails.timingScore = 2;
    console.log("✅ Timing partial match");
  } else {
    console.log("❌ Timing mismatch");
  }

  // Calculate total score
  scoreDetails.totalScore =
    scoreDetails.locationScore +
    scoreDetails.volunteerAreasScore +
    scoreDetails.backgroundScore +
    scoreDetails.availabilityScore +
    scoreDetails.frequencyScore +
    scoreDetails.timingScore;

  console.log("Final Score Breakdown:", scoreDetails);
  console.log("=== END MATCHING DEBUG ===");

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

