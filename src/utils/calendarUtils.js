// Calendar utility functions

/**
 * Format date to DD-MM-YYYY
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateToDDMMYYYY = (date) => {
  if (!date) return '';
  if (typeof date === 'string' && date.match(/^\d{2}-\d{2}-\d{4}$/)) return date;
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

/**
 * Get days in month for calendar display
 * @param {Date} date - Date to get days for
 * @returns {Array<number|null>} Array of days with null for empty cells
 */
export const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  return days;
};

/**
 * Get event color based on event status and user role
 * @param {Object} event - Event object
 * @param {string} userRole - User's role
 * @returns {string} Tailwind CSS class for event color
 */
export const getEventColor = (event, userRole) => {
  if (event.color) {
    switch (event.color) {
      case 'blue': return 'bg-blue-500';
      case 'yellow': return 'bg-yellow-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  }

  if (event.status === 'pending') return 'bg-orange-500';
  if (event.participants?.includes(userRole)) return 'bg-green-500';
  if (event.status === 'open') return 'bg-yellow-500';
  return 'bg-gray-400';
};

/**
 * Check if user is admin of a settlement
 * @param {Object} user - User object
 * @param {Object} event - Event object
 * @returns {boolean} Whether user is admin of event's settlement
 */
export const isAdminOfSettlement = (user, event) => {
  if (!user || user.role !== 'admin') return false;
  if (!event.settlement || !user.settlement) return true; // fallback: show all
  return event.settlement === user.settlement;
};

/**
 * Get month names
 * @returns {Array<string>} Array of month names
 */
export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Get day names
 * @returns {Array<string>} Array of day names
 */
export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Parse date string in DD-MM-YYYY format
 * @param {string} dateStr - Date string in DD-MM-YYYY format
 * @returns {Date} Parsed date
 */
export const parseDDMMYYYY = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Check if an event is upcoming
 * @param {Object} event - Event object with date/startDate property
 * @returns {boolean} Whether the event is upcoming
 */
export const isUpcoming = (event) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Try different date fields
  const eventDate = event.date || event.startDate;
  if (!eventDate) return false;
  
  // Parse the date
  const parsedDate = parseDDMMYYYY(eventDate);
  if (!parsedDate) {
    // Try parsing as YYYY-MM-DD if DD-MM-YYYY fails
    const [year, month, day] = eventDate.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day) >= today;
    }
    return false;
  }
  
  return parsedDate >= today;
}; 