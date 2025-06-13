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
    const jobRequestDoc = await getDoc(doc(jobRequestsCollection, jobRequestId));

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
    const timestampNow = Timestamp.now(); // ✅ استخدم Timestamp.now() لمشكلة matchedAt

    seniorsSnapshot.forEach((seniorDoc) => {
      const senior = seniorDoc.data();
      const seniorId = seniorDoc.id;

      // Calculate match score based on criteria
      const scoreDetails = calculateMatchScore(jobRequest, senior);
      const totalScore = scoreDetails.totalScore;

      console.log(`Senior ${seniorId} match score: ${totalScore}`);
      console.log(`Score details for ${seniorId}:`, scoreDetails);
      console.log("Job request data:", jobRequest);

      // Add to match results if score is above threshold (e.g., 30)
      if (totalScore >= 10) {
        matchResults.push({
          seniorId: seniorId,
          seniorName: senior.credentials?.username || "Unknown",
          seniorLocation: senior.location || "Unknown",
          seniorBackground: senior.professionalBackground || [],
          seniorInterests: senior.interests || [],
          score: totalScore,
          scoreDetails: scoreDetails,
          matchedAt: timestampNow // ✅ آمنة الآن لأنها قيمة فعلية
        });
      }
    });

    // Sort by score (highest first)
    matchResults.sort((a, b) => b.score - a.score);

    console.log(`Found ${matchResults.length} matching seniors above threshold`);

    // Update job request with match results
    await updateDoc(doc(jobRequestsCollection, jobRequestId), {
      matchResults,
      updatedAt: serverTimestamp() // ✅ هذا يسمح به Firestore لأنه حقل وليس داخل array
    });

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
    totalScore: 0
  };
  
  // Location match (highest weight - 40%)
  if (senior.location === jobRequest.location) {
    scoreDetails.locationScore = 40;
  } else if (senior.location && jobRequest.location) {
    // Partial match for nearby locations could be implemented here
    // This would require a database of location proximities
    scoreDetails.locationScore = 0;
  }
  
  // Interests match (25%)
  if (senior.interests && Array.isArray(senior.interests)) {
    if (senior.interests.includes(jobRequest.volunteerField)) {
      scoreDetails.interestsScore = 25;
    } else {
      // Check for partial matches in interests
      const interestKeywords = jobRequest.volunteerField.toLowerCase().split(/\s+/);
      let partialMatches = 0;
      
      senior.interests.forEach(interest => {
        const interestLower = interest.toLowerCase();
        interestKeywords.forEach(keyword => {
          if (interestLower.includes(keyword) && keyword.length > 3) {
            partialMatches++;
          }
        });
      });
      
      if (partialMatches > 0) {
        scoreDetails.interestsScore = Math.min(15, partialMatches * 5); // Up to 15 points for partial matches
      }
    }
  }
  
  // Professional background match (25%)
  if (senior.professionalBackground && jobRequest.professionalBackground) {
    if (Array.isArray(senior.professionalBackground)) {
      if (senior.professionalBackground.includes(jobRequest.professionalBackground)) {
        scoreDetails.backgroundScore = 25;
      } else {
        // Check for partial matches in professional background
        const backgroundKeywords = jobRequest.professionalBackground.toLowerCase().split(/\s+/);
        let partialMatches = 0;
        
        senior.professionalBackground.forEach(background => {
          const backgroundLower = background.toLowerCase();
          backgroundKeywords.forEach(keyword => {
            if (backgroundLower.includes(keyword) && keyword.length > 3) {
              partialMatches++;
            }
          });
        });
        
        if (partialMatches > 0) {
          scoreDetails.backgroundScore = Math.min(15, partialMatches * 5); // Up to 15 points for partial matches
        }
      }
    } else if (typeof senior.professionalBackground === 'string') {
      if (senior.professionalBackground === jobRequest.professionalBackground) {
        scoreDetails.backgroundScore = 25;
      } else if (senior.professionalBackground.toLowerCase().includes(jobRequest.professionalBackground.toLowerCase()) ||
                jobRequest.professionalBackground.toLowerCase().includes(senior.professionalBackground.toLowerCase())) {
        scoreDetails.backgroundScore = 15; // Partial match
      }
    }
  }
  
  // Availability match (10%)
  if (senior.availability && jobRequest.timing) {
    const timingLower = jobRequest.timing.toLowerCase();
    
    // Check for specific timing matches
    if (
      (timingLower.includes("weekday") && senior.availability.weekdays) ||
      (timingLower.includes("weekend") && senior.availability.weekends) ||
      (timingLower.includes("morning") && senior.availability.mornings) ||
      (timingLower.includes("afternoon") && senior.availability.afternoons) ||
      (timingLower.includes("evening") && senior.availability.evenings) ||
      (timingLower === "flexible" && (
        senior.availability.weekdays || 
        senior.availability.weekends || 
        senior.availability.mornings || 
        senior.availability.afternoons || 
        senior.availability.evenings
      ))
    ) {
      scoreDetails.availabilityScore = 10;
    } else {
      // Partial availability match
      let availabilityMatches = 0;
      
      if (timingLower.includes("weekday") || timingLower.includes("weekend")) {
        if (senior.availability.weekdays || senior.availability.weekends) {
          availabilityMatches++;
        }
      }
      
      if (timingLower.includes("morning") || timingLower.includes("afternoon") || timingLower.includes("evening")) {
        if (senior.availability.mornings || senior.availability.afternoons || senior.availability.evenings) {
          availabilityMatches++;
        }
      }
      
      if (availabilityMatches > 0) {
        scoreDetails.availabilityScore = 5; // Partial availability match
      }
    }
  }
  
  // Calculate total score
  scoreDetails.totalScore = 
    scoreDetails.locationScore + 
    scoreDetails.interestsScore + 
    scoreDetails.backgroundScore + 
    scoreDetails.availabilityScore;
  
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

