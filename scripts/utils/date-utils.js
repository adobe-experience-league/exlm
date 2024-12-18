/**
 * Formats a date object into a string with the format "YYYY/MM/DD@HH:MM:SS".
 * @param {Date} dateObj - The date object to be formatted.
 * @returns {string} The formatted date string.
 */
export const getFormattedDate = (dateObj) => {
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  const hours = String(dateObj.getUTCHours()).padStart(2, '0');
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');

  return `${year}/${month}/${day}@${hours}:${minutes}:${seconds}`;
};

/**
 * Calculates the date range between two dates and returns it in Coveo-compatible format.
 * @param {Date} startDate - The start date of the range.
 * @param {Date} endDate - The end date of the range.
 * @returns {string} The date range string in Coveo-compatible format.
 */
export const getDateRange = (startDate, endDate) => `${getFormattedDate(startDate)}..${getFormattedDate(endDate)}`;
