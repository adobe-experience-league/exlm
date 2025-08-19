/**
 * Utility functions for hashing quiz answers
 */

/**
 * Creates a canonical version of text (trimmed, lowercase)
 * @param {string} text The text to canonicalize
 * @returns {string} The canonical version of the text
 */
export function canonicalizeText(text) {
  return (text || '').trim().toLowerCase();
}

/**
 * Generates a SHA-256 hash and returns it as a base64 string
 * @param {string} input The input string to hash
 * @returns {Promise<string>} The base64-encoded SHA-256 hash
 */
async function sha256Base64(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
  return hashBase64;
}

/**
 * Generates a hash for a quiz answer
 * @param {string} pagePath The page path
 * @param {string} questionIndex The question index
 * @param {string} answerIndex The index of the answer
 * @param {string} answerText The answer text
 * @returns {Promise<string>} The hashed answer
 */
export async function hashAnswer(pagePath, questionIndex, answerIndex, answerText) {
  // Fixed salt value - must match the one used on the server side
  const pageSalt = 'EXL_QUIZ_SALT';

  const canonicalText = canonicalizeText(answerText);
  const hashedAnswer = `${pagePath}|${questionIndex}|${answerIndex}|${canonicalText}|${pageSalt}`;
  return sha256Base64(hashedAnswer);
}
