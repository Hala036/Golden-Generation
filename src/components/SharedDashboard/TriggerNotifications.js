import { addDoc, collection, serverTimestamp, getDocs, query, where, updateDoc, doc, arrayUnion, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";

// Enhanced notification types
export const NOTIFICATION_TYPES = {
  EVENT_CREATED: 'event_created',
  EVENT_UPDATED: 'event_updated',
  EVENT_CANCELLED: 'event_cancelled',
  EVENT_REMINDER: 'event_reminder',
  EVENT_APPROVED: 'event_approved',
  EVENT_REJECTED: 'event_rejected',
  JOB_REQUEST_CREATED: 'job_request_created',
  JOB_REQUEST_ASSIGNED: 'job_request_assigned',
  JOB_REQUEST_COMPLETED: 'job_request_completed',
  SERVICE_REQUEST_CREATED: 'service_request_created',
  SERVICE_REQUEST_ASSIGNED: 'service_request_assigned',
  SERVICE_REQUEST_COMPLETED: 'service_request_completed',
  MESSAGE_RECEIVED: 'message_received',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_REQUEST_ACCEPTED: 'friend_request_accepted',
  SETTLEMENT_JOINED: 'settlement_joined',
  ADMIN_ASSIGNED: 'admin_assigned',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  WELCOME: 'welcome',
  BIRTHDAY: 'birthday',
  ACHIEVEMENT: 'achievement'
};

// Notification priority levels
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Notification categories
export const NOTIFICATION_CATEGORIES = {
  EVENTS: 'events',
  JOBS: 'jobs',
  SERVICES: 'services',
  SOCIAL: 'social',
  SYSTEM: 'system',
  ACHIEVEMENTS: 'achievements'
};

// Enhanced notification templates
const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.EVENT_CREATED]: {
    title: 'New Event Created',
    message: 'A new event "{eventTitle}" has been created in your settlement.',
    icon: '🎉',
    category: NOTIFICATION_CATEGORIES.EVENTS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/events',
    actionText: 'View Event'
  },
  [NOTIFICATION_TYPES.EVENT_UPDATED]: {
    title: 'Event Updated',
    message: 'The event "{eventTitle}" has been updated.',
    icon: '📝',
    category: NOTIFICATION_CATEGORIES.EVENTS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/events',
    actionText: 'View Changes'
  },
  [NOTIFICATION_TYPES.EVENT_CANCELLED]: {
    title: 'Event Cancelled',
    message: 'The event "{eventTitle}" has been cancelled.',
    icon: '❌',
    category: NOTIFICATION_CATEGORIES.EVENTS,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionUrl: '/events',
    actionText: 'View Details'
  },
  [NOTIFICATION_TYPES.EVENT_REMINDER]: {
    title: 'Event Reminder',
    message: 'Reminder: "{eventTitle}" starts in {timeUntilEvent}.',
    icon: '⏰',
    category: NOTIFICATION_CATEGORIES.EVENTS,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionUrl: '/events',
    actionText: 'View Event'
  },
  [NOTIFICATION_TYPES.EVENT_APPROVED]: {
    title: 'Event Approved',
    message: 'Your event "{eventTitle}" has been approved!',
    icon: '✅',
    category: NOTIFICATION_CATEGORIES.EVENTS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/events',
    actionText: 'View Event'
  },
  [NOTIFICATION_TYPES.EVENT_REJECTED]: {
    title: 'Event Rejected',
    message: 'Your event "{eventTitle}" was not approved. Please review the feedback.',
    icon: '⚠️',
    category: NOTIFICATION_CATEGORIES.EVENTS,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionUrl: '/events',
    actionText: 'View Feedback'
  },
  [NOTIFICATION_TYPES.JOB_REQUEST_CREATED]: {
    title: 'New Job Request',
    message: 'A new job request "{jobTitle}" has been created.',
    icon: '💼',
    category: NOTIFICATION_CATEGORIES.JOBS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/jobs',
    actionText: 'View Request'
  },
  [NOTIFICATION_TYPES.JOB_REQUEST_ASSIGNED]: {
    title: 'Job Request Assigned',
    message: 'You have been assigned to "{jobTitle}".',
    icon: '👤',
    category: NOTIFICATION_CATEGORIES.JOBS,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionUrl: '/jobs',
    actionText: 'View Details'
  },
  [NOTIFICATION_TYPES.JOB_REQUEST_COMPLETED]: {
    title: 'Job Request Completed',
    message: 'The job request "{jobTitle}" has been completed successfully.',
    icon: '🎯',
    category: NOTIFICATION_CATEGORIES.JOBS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/jobs',
    actionText: 'View Summary'
  },
  [NOTIFICATION_TYPES.SERVICE_REQUEST_CREATED]: {
    title: 'New Service Request',
    message: 'A new service request "{serviceTitle}" has been submitted.',
    icon: '🔧',
    category: NOTIFICATION_CATEGORIES.SERVICES,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/services',
    actionText: 'View Request'
  },
  [NOTIFICATION_TYPES.SERVICE_REQUEST_ASSIGNED]: {
    title: 'Service Request Assigned',
    message: 'You have been assigned to "{serviceTitle}".',
    icon: '🔧',
    category: NOTIFICATION_CATEGORIES.SERVICES,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionUrl: '/services',
    actionText: 'View Details'
  },
  [NOTIFICATION_TYPES.SERVICE_REQUEST_COMPLETED]: {
    title: 'Service Request Completed',
    message: 'The service request "{serviceTitle}" has been completed.',
    icon: '✅',
    category: NOTIFICATION_CATEGORIES.SERVICES,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/services',
    actionText: 'View Summary'
  },
  [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: {
    title: 'New Message',
    message: 'You received a new message from {senderName}.',
    icon: '💬',
    category: NOTIFICATION_CATEGORIES.SOCIAL,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/messages',
    actionText: 'View Message'
  },
  [NOTIFICATION_TYPES.FRIEND_REQUEST]: {
    title: 'Friend Request',
    message: '{senderName} sent you a friend request.',
    icon: '👋',
    category: NOTIFICATION_CATEGORIES.SOCIAL,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/friends',
    actionText: 'Respond'
  },
  [NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED]: {
    title: 'Friend Request Accepted',
    message: '{senderName} accepted your friend request!',
    icon: '🤝',
    category: NOTIFICATION_CATEGORIES.SOCIAL,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/friends',
    actionText: 'View Profile'
  },
  [NOTIFICATION_TYPES.SETTLEMENT_JOINED]: {
    title: 'Welcome to Settlement',
    message: 'Welcome to {settlementName}! We\'re glad to have you here.',
    icon: '🏘️',
    category: NOTIFICATION_CATEGORIES.SOCIAL,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/settlement',
    actionText: 'Explore'
  },
  [NOTIFICATION_TYPES.ADMIN_ASSIGNED]: {
    title: 'Admin Role Assigned',
    message: 'You have been assigned as an admin for {settlementName}.',
    icon: '👑',
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionUrl: '/admin',
    actionText: 'View Dashboard'
  },
  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: {
    title: 'System Announcement',
    message: '{announcementText}',
    icon: '📢',
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/announcements',
    actionText: 'Read More'
  },
  [NOTIFICATION_TYPES.WELCOME]: {
    title: 'Welcome to Golden Generation',
    message: 'Welcome to the Golden Generation community! We\'re excited to have you here.',
    icon: '🌟',
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/welcome',
    actionText: 'Get Started'
  },
  [NOTIFICATION_TYPES.BIRTHDAY]: {
    title: 'Happy Birthday!',
    message: 'Happy Birthday, {userName}! We hope you have a wonderful day.',
    icon: '🎂',
    category: NOTIFICATION_CATEGORIES.ACHIEVEMENTS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/profile',
    actionText: 'View Profile'
  },
  [NOTIFICATION_TYPES.ACHIEVEMENT]: {
    title: 'Achievement Unlocked!',
    message: 'Congratulations! You\'ve earned the "{achievementName}" achievement.',
    icon: '🏆',
    category: NOTIFICATION_CATEGORIES.ACHIEVEMENTS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionUrl: '/achievements',
    actionText: 'View Achievement'
  }
};

// Function to add notification to user profiles
const addNotificationToUsers = async (notificationId, target) => {
  try {
    let userIds = [];

    if (target === "everyone" || target === "admins" || target === "retirees") {
      // Fetch users based on the target group
      const q = query(
        collection(db, "users"),
        where("role", "==", target === "everyone" ? "user" : target) // Adjust query for group
      );
      const snapshot = await getDocs(q);
      userIds = snapshot.docs.map((doc) => doc.id); // Extract user IDs
    } else {
      // If target is an array of specific user IDs
      userIds = target;
    }

    // Add notification ID to each user's profile
    const userUpdates = userIds.map((uid) =>
      updateDoc(doc(db, "users", uid), {
        notifs: arrayUnion({ id: notificationId, read: false })
      })
    );
    await Promise.all(userUpdates);
  } catch (err) {
    console.error("Failed to add notification to users", err);
  }
};

/**
 * Enhanced notification trigger function
 * @param {string} type - Notification type from NOTIFICATION_TYPES
 * @param {string} recipientId - User ID to receive the notification
 * @param {Object} data - Additional data for the notification
 * @param {Object} options - Additional options
 */
export const triggerNotification = async (type, recipientId, data = {}, options = {}) => {
  try {
    const template = NOTIFICATION_TEMPLATES[type];
    if (!template) {
      console.error(`Unknown notification type: ${type}`);
      return;
    }

    // Process message template with data
    let processedMessage = template.message;
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), data[key] || '');
    });

    // Create notification object
    const notification = {
      type,
      recipientId,
      title: template.title,
      message: processedMessage,
      icon: template.icon,
      category: template.category,
      priority: options.priority || template.priority,
      actionUrl: options.actionUrl || template.actionUrl,
      actionText: options.actionText || template.actionText,
      data: {
        ...data,
        originalType: type
      },
      read: false,
      createdAt: serverTimestamp(),
      expiresAt: options.expiresAt || null,
      groupId: options.groupId || null, // For grouping related notifications
      metadata: {
        source: options.source || 'system',
        version: '2.0',
        ...options.metadata
      }
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'notifications'), notification);
    
    console.log(`Notification triggered: ${type} for user ${recipientId}`, notification);
    
    return docRef;
  } catch (error) {
    console.error('Error triggering notification:', error);
    throw error;
  }
};

/**
 * Trigger notification for multiple recipients
 * @param {string} type - Notification type
 * @param {Array} recipientIds - Array of user IDs
 * @param {Object} data - Additional data
 * @param {Object} options - Additional options
 */
export const triggerBulkNotification = async (type, recipientIds, data = {}, options = {}) => {
  try {
    const promises = recipientIds.map(recipientId => 
      triggerNotification(type, recipientId, data, options)
    );
    
    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    
    console.log(`Bulk notification completed: ${successful} successful, ${failed} failed`);
    
    return { successful, failed, results };
  } catch (error) {
    console.error('Error triggering bulk notification:', error);
    throw error;
  }
};

/**
 * Trigger notification for all users in a settlement
 * @param {string} type - Notification type
 * @param {string} settlementId - Settlement ID
 * @param {Object} data - Additional data
 * @param {Object} options - Additional options
 */
export const triggerSettlementNotification = async (type, settlementId, data = {}, options = {}) => {
  try {
    // Get all users in the settlement
    const usersQuery = query(
      collection(db, 'users'),
      where('idVerification.settlement', '==', settlementId)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    if (userIds.length === 0) {
      console.log(`No users found in settlement ${settlementId}`);
      return { successful: 0, failed: 0, results: [] };
    }
    
    return await triggerBulkNotification(type, userIds, data, {
      ...options,
      source: 'settlement',
      metadata: { settlementId }
    });
  } catch (error) {
    console.error('Error triggering settlement notification:', error);
    throw error;
  }
};

/**
 * Create a scheduled notification
 * @param {string} type - Notification type
 * @param {string} recipientId - User ID
 * @param {Date} scheduledFor - When to send the notification
 * @param {Object} data - Additional data
 * @param {Object} options - Additional options
 */
export const scheduleNotification = async (type, recipientId, scheduledFor, data = {}, options = {}) => {
  try {
    const template = NOTIFICATION_TEMPLATES[type];
    if (!template) {
      console.error(`Unknown notification type: ${type}`);
      return;
    }

    const scheduledNotification = {
      type,
      recipientId,
      scheduledFor: scheduledFor instanceof Date ? scheduledFor.toISOString() : scheduledFor,
      data,
      options,
      status: 'scheduled',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'scheduledNotifications'), scheduledNotification);
    
    console.log(`Scheduled notification: ${type} for user ${recipientId} at ${scheduledFor}`);
    
    return docRef;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification document ID
 * @param {string} userId - User ID
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
    
    console.log(`Notification ${notificationId} marked as read by user ${userId}`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    const updatePromises = notificationsSnapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp()
      })
    );
    
    await Promise.all(updatePromises);
    
    console.log(`All notifications marked as read for user ${userId}`);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 * @param {string} notificationId - Notification document ID
 */
export const deleteNotification = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
    
    console.log(`Notification ${notificationId} deleted`);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Get notification statistics for a user
 * @param {string} userId - User ID
 */
export const getNotificationStats = async (userId) => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId)
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    const notifications = notificationsSnapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byCategory: {},
      byPriority: {},
      byType: {}
    };
    
    notifications.forEach(notification => {
      // Count by category
      stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
      
      // Count by priority
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      
      // Count by type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw error;
  }
};

export default {
  triggerNotification,
  triggerBulkNotification,
  triggerSettlementNotification,
  scheduleNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationStats,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_CATEGORIES
};
