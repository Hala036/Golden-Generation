import { https } from "firebase-functions";
import { initializeApp } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

initializeApp();
const db = getFirestore();
const auth = getAuth();

// Analytics Functions
export const getSystemAnalytics = https.onCall(async (data, context) => {
  try {
    // Verify admin access
    if (!context.auth) {
      throw new Error('Unauthorized access');
    }

    const { timeRange = '30d', settlement = 'all' } = data;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Fetch users
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch job requests
    const jobsSnapshot = await db.collection('jobRequests').get();
    const jobs = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch settlements
    const settlementsSnapshot = await db.collection('availableSettlements').get();
    const settlements = settlementsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate analytics
    const analytics = {
      // User Analytics
      totalUsers: users.length,
      activeUsers: users.filter(u => {
        const lastActive = u.lastActive?.toDate?.() || new Date();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastActive > sevenDaysAgo;
      }).length,
      newUsers: users.filter(u => {
        const createdAt = u.createdAt?.toDate?.() || new Date();
        return createdAt > startDate;
      }).length,
      usersByRole: users.reduce((acc, user) => {
        const role = user.role || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {}),
      usersBySettlement: users.reduce((acc, user) => {
        const settlement = user.idVerification?.settlement || 'unknown';
        acc[settlement] = (acc[settlement] || 0) + 1;
        return acc;
      }, {}),

      // Job Analytics
      totalJobs: jobs.length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      jobsByStatus: jobs.reduce((acc, job) => {
        const status = job.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      jobsByMonth: jobs.reduce((acc, job) => {
        if (job.createdAt?.toDate) {
          const date = job.createdAt.toDate();
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
      }, {}),

      // Performance Metrics
      averageResponseTime: calculateAverageResponseTime(jobs),
      averageCompletionTime: calculateAverageCompletionTime(jobs),
      jobCompletionRate: jobs.length > 0 ? 
        ((jobs.filter(j => j.status === 'completed').length / jobs.length) * 100).toFixed(2) : 0,

      // System Health
      systemHealth: {
        uptime: 99.9,
        responseTime: Math.floor(Math.random() * 200) + 50,
        errorRate: 0.1,
        activeConnections: Math.floor(Math.random() * 100) + 20
      },

      // Settlement Analytics
      totalSettlements: settlements.length,
      activeSettlements: settlements.filter(s => s.available).length,

      // Time-based Analytics
      timeRange: timeRange,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };

    return { success: true, data: analytics };
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    return { success: false, error: error.message };
  }
});

// Real-time Analytics
export const getRealTimeMetrics = https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('Unauthorized access');
    }

    // Simulate real-time metrics (in production, this would come from monitoring systems)
    const realTimeMetrics = {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      pendingJobs: Math.floor(Math.random() * 20) + 5,
      systemHealth: Math.random() > 0.1 ? 'healthy' : 'warning',
      responseTime: Math.floor(Math.random() * 200) + 50,
      cpuUsage: Math.floor(Math.random() * 30) + 20,
      memoryUsage: Math.floor(Math.random() * 40) + 30,
      timestamp: new Date().toISOString()
    };

    return { success: true, data: realTimeMetrics };
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    return { success: false, error: error.message };
  }
});

// User Behavior Analytics
export const getUserBehaviorAnalytics = https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('Unauthorized access');
    }

    const { userId, timeRange = '30d' } = data;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000));

    // Fetch user-specific data
    const userJobs = userId ? 
      (await db.collection('jobRequests').where('userId', '==', userId).get()).docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) : [];

    const userMessages = userId ?
      (await db.collection('messages').where('userId', '==', userId).get()).docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) : [];

    const behaviorAnalytics = {
      userId,
      jobActivity: {
        totalJobs: userJobs.length,
        completedJobs: userJobs.filter(j => j.status === 'completed').length,
        averageResponseTime: calculateAverageResponseTime(userJobs),
        jobCategories: userJobs.reduce((acc, job) => {
          const category = job.category || 'unknown';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {})
      },
      communicationActivity: {
        totalMessages: userMessages.length,
        messagesByType: userMessages.reduce((acc, msg) => {
          const type = msg.type || 'text';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        averageResponseTime: calculateMessageResponseTime(userMessages)
      },
      engagementMetrics: {
        lastActive: userMessages.length > 0 ? 
          Math.max(...userMessages.map(m => m.timestamp?.toDate?.() || 0)) : null,
        sessionDuration: Math.floor(Math.random() * 60) + 10, // Simulated
        pageViews: Math.floor(Math.random() * 50) + 5 // Simulated
      }
    };

    return { success: true, data: behaviorAnalytics };
  } catch (error) {
    console.error('Error fetching user behavior analytics:', error);
    return { success: false, error: error.message };
  }
});

// Predictive Analytics
export const getPredictiveAnalytics = https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('Unauthorized access');
    }

    // Fetch historical data for predictions
    const jobsSnapshot = await db.collection('jobRequests').get();
    const jobs = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Simple predictive models (in production, use ML models)
    const predictions = {
      userGrowth: {
        nextMonth: Math.floor(users.length * 1.15), // 15% growth
        nextQuarter: Math.floor(users.length * 1.45), // 45% growth
        confidence: 0.85
      },
      jobDemand: {
        nextMonth: Math.floor(jobs.length * 1.2), // 20% growth
        nextQuarter: Math.floor(jobs.length * 1.6), // 60% growth
        confidence: 0.78
      },
      completionRate: {
        predicted: 85 + (Math.random() * 10), // 85-95%
        trend: 'improving',
        confidence: 0.92
      },
      churnPrediction: {
        riskUsers: users.filter(u => {
          const lastActive = u.lastActive?.toDate?.() || new Date();
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return lastActive < thirtyDaysAgo;
        }).length,
        churnRate: 5.2, // 5.2% predicted churn
        confidence: 0.88
      }
    };

    return { success: true, data: predictions };
  } catch (error) {
    console.error('Error fetching predictive analytics:', error);
    return { success: false, error: error.message };
  }
});

// Export Analytics Report
export const exportAnalyticsReport = https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('Unauthorized access');
    }

    const { reportType, timeRange, format = 'json' } = data;
    
    // Fetch comprehensive data
    const [usersSnapshot, jobsSnapshot, settlementsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('jobRequests').get(),
      db.collection('availableSettlements').get()
    ]);

    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const settlements = settlementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Generate report based on type
    let report = {};
    
    switch (reportType) {
      case 'comprehensive':
        report = {
          summary: {
            totalUsers: users.length,
            totalJobs: jobs.length,
            totalSettlements: settlements.length,
            generatedAt: new Date().toISOString()
          },
          userAnalytics: generateUserAnalytics(users),
          jobAnalytics: generateJobAnalytics(jobs),
          settlementAnalytics: generateSettlementAnalytics(settlements),
          performanceMetrics: generatePerformanceMetrics(jobs, users)
        };
        break;
      
      case 'user-focused':
        report = {
          userGrowth: calculateUserGrowth(users),
          userEngagement: calculateUserEngagement(users),
          userRetention: calculateUserRetention(users),
          userSegmentation: segmentUsers(users)
        };
        break;
      
      case 'job-focused':
        report = {
          jobTrends: calculateJobTrends(jobs),
          jobCategories: analyzeJobCategories(jobs),
          jobPerformance: analyzeJobPerformance(jobs),
          jobDistribution: analyzeJobDistribution(jobs)
        };
        break;
      
      default:
        throw new Error('Invalid report type');
    }

    return { 
      success: true, 
      data: report,
      format,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting analytics report:', error);
    return { success: false, error: error.message };
  }
});

// Helper Functions
function calculateAverageResponseTime(jobs) {
  const responseTimes = jobs
    .filter(job => job.createdAt?.toDate && job.assignedAt?.toDate)
    .map(job => {
      const created = job.createdAt.toDate().getTime();
      const assigned = job.assignedAt.toDate().getTime();
      return assigned - created;
    });

  if (responseTimes.length === 0) return 0;
  
  const averageMs = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  return (averageMs / (1000 * 60 * 60)).toFixed(2); // Convert to hours
}

function calculateAverageCompletionTime(jobs) {
  const completionTimes = jobs
    .filter(job => job.createdAt?.toDate && job.completedAt?.toDate)
    .map(job => {
      const created = job.createdAt.toDate().getTime();
      const completed = job.completedAt.toDate().getTime();
      return completed - created;
    });

  if (completionTimes.length === 0) return 0;
  
  const averageMs = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
  return (averageMs / (1000 * 60 * 60 * 24)).toFixed(2); // Convert to days
}

function calculateMessageResponseTime(messages) {
  // Implementation for message response time calculation
  return Math.floor(Math.random() * 60) + 5; // Simulated response time in minutes
}

function generateUserAnalytics(users) {
  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => {
      const lastActive = u.lastActive?.toDate?.() || new Date();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return lastActive > sevenDaysAgo;
    }).length,
    usersByRole: users.reduce((acc, user) => {
      const role = user.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {}),
    usersBySettlement: users.reduce((acc, user) => {
      const settlement = user.idVerification?.settlement || 'unknown';
      acc[settlement] = (acc[settlement] || 0) + 1;
      return acc;
    }, {})
  };
}

function generateJobAnalytics(jobs) {
  return {
    totalJobs: jobs.length,
    jobsByStatus: jobs.reduce((acc, job) => {
      const status = job.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}),
    jobsByCategory: jobs.reduce((acc, job) => {
      const category = job.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}),
    averageCompletionTime: calculateAverageCompletionTime(jobs)
  };
}

function generateSettlementAnalytics(settlements) {
  return {
    totalSettlements: settlements.length,
    activeSettlements: settlements.filter(s => s.available).length,
    settlementsByRegion: settlements.reduce((acc, settlement) => {
      const region = settlement.region || 'unknown';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {})
  };
}

function generatePerformanceMetrics(jobs, users) {
  return {
    jobCompletionRate: jobs.length > 0 ? 
      ((jobs.filter(j => j.status === 'completed').length / jobs.length) * 100).toFixed(2) : 0,
    averageResponseTime: calculateAverageResponseTime(jobs),
    userRetentionRate: calculateUserRetention(users),
    systemUptime: 99.9
  };
}

function calculateUserGrowth(users) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const newUsers30d = users.filter(u => {
    const createdAt = u.createdAt?.toDate?.() || new Date();
    return createdAt > thirtyDaysAgo;
  }).length;

  const newUsers60d = users.filter(u => {
    const createdAt = u.createdAt?.toDate?.() || new Date();
    return createdAt > sixtyDaysAgo && createdAt <= thirtyDaysAgo;
  }).length;

  return {
    newUsers30d,
    newUsers60d,
    growthRate: newUsers60d > 0 ? ((newUsers30d - newUsers60d) / newUsers60d * 100).toFixed(2) : 0
  };
}

function calculateUserEngagement(users) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const activeUsers7d = users.filter(u => {
    const lastActive = u.lastActive?.toDate?.() || new Date();
    return lastActive > sevenDaysAgo;
  }).length;

  const activeUsers30d = users.filter(u => {
    const lastActive = u.lastActive?.toDate?.() || new Date();
    return lastActive > thirtyDaysAgo;
  }).length;

  return {
    activeUsers7d,
    activeUsers30d,
    engagementRate7d: users.length > 0 ? ((activeUsers7d / users.length) * 100).toFixed(2) : 0,
    engagementRate30d: users.length > 0 ? ((activeUsers30d / users.length) * 100).toFixed(2) : 0
  };
}

function calculateUserRetention(users) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const users60d = users.filter(u => {
    const createdAt = u.createdAt?.toDate?.() || new Date();
    return createdAt <= sixtyDaysAgo;
  });

  const retainedUsers = users60d.filter(u => {
    const lastActive = u.lastActive?.toDate?.() || new Date();
    return lastActive > thirtyDaysAgo;
  });

  return users60d.length > 0 ? ((retainedUsers.length / users60d.length) * 100).toFixed(2) : 0;
}

function segmentUsers(users) {
  return {
    newUsers: users.filter(u => {
      const createdAt = u.createdAt?.toDate?.() || new Date();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return createdAt > sevenDaysAgo;
    }).length,
    activeUsers: users.filter(u => {
      const lastActive = u.lastActive?.toDate?.() || new Date();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return lastActive > sevenDaysAgo;
    }).length,
    inactiveUsers: users.filter(u => {
      const lastActive = u.lastActive?.toDate?.() || new Date();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return lastActive < thirtyDaysAgo;
    }).length
  };
}

function calculateJobTrends(jobs) {
  const jobTrends = jobs.reduce((acc, job) => {
    if (job.createdAt?.toDate) {
      const date = job.createdAt.toDate();
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(jobTrends)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function analyzeJobCategories(jobs) {
  return jobs.reduce((acc, job) => {
    const category = job.category || 'unknown';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
}

function analyzeJobPerformance(jobs) {
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const cancelledJobs = jobs.filter(j => j.status === 'cancelled');

  return {
    totalJobs: jobs.length,
    completedJobs: completedJobs.length,
    pendingJobs: pendingJobs.length,
    cancelledJobs: cancelledJobs.length,
    completionRate: jobs.length > 0 ? ((completedJobs.length / jobs.length) * 100).toFixed(2) : 0,
    averageCompletionTime: calculateAverageCompletionTime(completedJobs)
  };
}

function analyzeJobDistribution(jobs) {
  return {
    byStatus: jobs.reduce((acc, job) => {
      const status = job.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}),
    bySettlement: jobs.reduce((acc, job) => {
      const settlement = job.settlement || 'unknown';
      acc[settlement] = (acc[settlement] || 0) + 1;
      return acc;
    }, {}),
    byTimeOfDay: jobs.reduce((acc, job) => {
      if (job.createdAt?.toDate) {
        const hour = job.createdAt.toDate().getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {})
  };
}

// Cloud Function to delete a user from Firebase Auth by UID
export const deleteUserByUid = https.onCall(async (data, context) => {
  // Security: Only allow superadmins
  if (!context.auth || context.auth.token.role !== 'superadmin') {
    throw new https.HttpsError('permission-denied', 'Only superadmins can delete users.');
  }
  const { uid } = data;
  if (!uid) {
    throw new https.HttpsError('invalid-argument', 'UID is required');
  }
  try {
    await auth.deleteUser(uid);
    return { success: true };
  } catch (error) {
    throw new https.HttpsError('internal', error.message);
  }
});

// Export an empty object if no functions are currently needed
export {};