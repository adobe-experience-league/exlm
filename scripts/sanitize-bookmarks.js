import { defaultProfileClient } from './auth/profile.js';
import { rewriteDocsPath } from './utils/path-utils.js';
import { getConfig } from './scripts.js';

/**
 * Sanitizes the user's bookmarks by ensuring all bookmark IDs are valid paths.
 * If a bookmark ID does not start with `/lang`, it fetches the correct path from the article API.
 * Invalid bookmarks (e.g., 404 errors) are removed from the user's profile.
 *
 * @async
 * @function sanitizeBookmarks
 * @returns {Promise<void>} Resolves when the bookmarks have been sanitized and updated in the user's profile.
 * @throws {Error} Logs any errors encountered during the sanitization process.
 *
 */
export default async function sanitizeBookmarks() {
  try {
    const profileData = await defaultProfileClient.getMergedProfile();
    const { bookmarks = [] } = profileData;
    let updateProfile = false;

    const sanitizedBookmarks = (
      await Promise.all(
        bookmarks.map(async (bookmarkIdInfo) => {
          const [bookmarkId, timestamp] = bookmarkIdInfo.split(':');

          // If the bookmark ID already starts with /{lang}, no need to fetch the path
          if (bookmarkId.startsWith(`/`)) {
            return `${bookmarkId}:${timestamp}`;
          }
          updateProfile = true;
          try {
            // Fetch the path from the article API
            const response = await fetch(`${getConfig().articleUrl}/${bookmarkId}`);
            if (response.ok) {
              const { data } = await response.json();
              const articlePath = data?.URL;

              // Ensure the path starts with /{lang}
              const sanitizedPath = rewriteDocsPath(articlePath);
              return `${sanitizedPath}:${timestamp}`;
            }

            if (response.status === 404) {
              // Remove the bookmark if it's a 404 (Not Found)
              // eslint-disable-next-line no-console
              console.warn(`Bookmark ID not found in database: ${bookmarkId}, Deleting Bookmark from profile...`);
              return null;
            }

            // eslint-disable-next-line no-console
            console.warn(`Failed to fetch path for bookmark ID: ${bookmarkId},`);
            return `${bookmarkId}:${timestamp}`;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Error fetching path for bookmark ID: ${bookmarkId}, This bookmark will be deleted`, error);
            return `${bookmarkId}:${timestamp}`;
          }
        }),
      )
    ).filter((bookmark) => bookmark !== null);

    // Update the profile with sanitized bookmarks
    if (updateProfile) await defaultProfileClient.updateProfile('bookmarks', sanitizedBookmarks, true);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sanitizing bookmarks:', error);
  }
}
