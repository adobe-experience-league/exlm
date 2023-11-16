/**
 * Converts a string to title case.
 *
 * @param {string} str - The input string to be converted to title case.
 * @returns {string} - The title case version of the input string.
 */
function toTitleCase(str) {
    return str.replace(/\b\w/g, (match) => match.toUpperCase());
}

export default toTitleCase;