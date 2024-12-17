import { COVEO_DATE_OPTIONS } from '../browse-card/browse-cards-constants.js';

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

/**
 * Constructs date criteria based on a list of date options.
 * @returns {Array} Array of date criteria.
 */
export const createDateCriteria = (dateList) => {
  const dateCriteria = [];
  const dateOptions = {
    [COVEO_DATE_OPTIONS.WITHIN_ONE_MONTH]: { monthsAgo: 1 },
    [COVEO_DATE_OPTIONS.WITHIN_SIX_MONTHS]: { monthsAgo: 6 },
    [COVEO_DATE_OPTIONS.WITHIN_ONE_YEAR]: { yearsAgo: 1 },
    [COVEO_DATE_OPTIONS.MORE_THAN_ONE_YEAR_AGO]: { yearsAgo: 50 }, // Assuming 50 years ago as the "more than one year ago" option
  };
  dateList.forEach((date) => {
    if (dateOptions[date]) {
      const { monthsAgo, yearsAgo } = dateOptions[date];
      const currentDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (monthsAgo || 0));
      startDate.setFullYear(startDate.getFullYear() - (yearsAgo || 0));
      if (date === COVEO_DATE_OPTIONS.MORE_THAN_ONE_YEAR_AGO) {
        // For "MORE_THAN_ONE_YEAR_AGO", adjust startDate by adding one more year
        currentDate.setFullYear(currentDate.getFullYear() - 1);
      }
      dateCriteria.push(getDateRange(startDate, currentDate));
    }
  });
  return dateCriteria;
};
