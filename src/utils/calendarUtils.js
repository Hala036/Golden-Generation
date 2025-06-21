// Calendar utility functions

/**
 * Returns an array of day numbers for a given month and year.
 * @param {Date} date - A date object for the desired month.
 * @returns {Array<number|null>} An array representing the days of the month.
 */
export const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = [];

  // Add blank days for the first week
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  // Add the days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
};

export const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Formats a date object or string into DD-MM-YYYY format.
 * Handles both 'YYYY-MM-DD' and 'DD-MM-YYYY' input strings.
 * @param {Date|string} date The date to format.
 * @returns {string} The formatted date string.
 */
export const formatDateToDDMMYYYY = (date) => {
  if (!date) return '';

  if (typeof date === 'string' && date.includes('-')) {
    const parts = date.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) { // YYYY-MM-DD
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return date; // Already DD-MM-YYYY
    }
  }
  
  if (date instanceof Date) {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  }
  
  return date; // Fallback for unexpected formats
};

/**
 * Checks if an event is in the future.
 * @param {string} eventDateStr The event date in 'DD-MM-YYYY' format.
 * @returns {boolean} True if the event is today or in the future.
 */
export const isUpcoming = (eventDateStr) => {
  if (!eventDateStr) return false;
  
  const [day, month, year] = eventDateStr.split('-').map(Number);
  const eventDate = new Date(year, month - 1, day);
  eventDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return eventDate >= today;
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
 * Returns an array of dates representing the days in the week of the given date (Sunday to Saturday).
 * @param {Date} date - Any date within the desired week.
 * @returns {Date[]} Array of 7 Date objects for the week.
 */
export const getWeekDays = (date) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
};

/**
 * Returns an array of hour labels for a day view (e.g., '00:00', '01:00', ... '23:00').
 * @returns {string[]} Array of hour strings.
 */
export const getDayHours = () => {
  return Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
};

/**
 * Returns an array of date strings (DD-MM-YYYY) that the event spans from startDate to endDate inclusive.
 * @param {Object} event - The event object with startDate, endDate.
 * @returns {string[]} Array of date strings in DD-MM-YYYY format.
 */
export const getEventDateRange = (event) => {
  const { startDate, endDate } = event;
  if (!startDate) return [];
  const start = parseDDMMYYYY(startDate);
  const end = endDate ? parseDDMMYYYY(endDate) : start;
  const dates = [];
  let current = new Date(start);
  while (current <= end) {
    const d = current.getDate().toString().padStart(2, '0');
    const m = (current.getMonth() + 1).toString().padStart(2, '0');
    const y = current.getFullYear();
    dates.push(`${d}-${m}-${y}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}; 