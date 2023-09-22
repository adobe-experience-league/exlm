
/** 
 * @typedef {object} ExlArticle
 * @property {string} ID
 * @property {string} URL
 * @property {string[]} Solution
 * @property {string[]} Level
 * @property {string} Title
 * @property {string[]} Type
 * @property {string} Description
 * @property {string} Thumbnail
 * @property {string[]} Role
 * @property {number} Order
 * @property {boolean} Publish
 * @property {boolean} Markdown
 * @property {string} FullBody
 * @property {string} File
 * @property {string} FullMeta
 * @property {string} OriginalURL
 * @property {string[]} Tags
 * @property {string} AddedUTC
 * @property {string} UpdatedUTC
 * @property {boolean} Archived
 * @property {boolean} Ignore
 * @property {number} timestamp
 * @property {boolean} Hide
 * @property {string} id
 */

/**
* @typedef {Object} ExlArticleResponse
* @property {ExlArticle} data 
* @property {string|null} error
* @property {Array} links
* @property {Number} status
*/



export default class ExlClient {
    constructor({
        domain = "https://experienceleague.adobe.com"
    } = {}) {

        this.domain = domain;
    }

    /**
     * Get Article By ID
     * @param {string} id 
     * @param {string} lang 
     * @returns {ExlArticleResponse}
     */
    async getArticle(id, lang = 'en') {
        const path = `api/articles/${id}?lang=${lang}`;
        const response = await this._fetch(path);

        if (response.error) {
            throw new Error(response.error);
        } else {
            return this.removeSpacesFromKeysRecursively(response)
        }
    }
    async _fetch(path) {
        const url = new URL(path, this.domain);
        const response = await fetch(url);
        return await response.json();
    }

    removeSpacesFromKeysRecursively(obj) {
        for (const key in obj) {
            if (key.includes(' ')) {
                const newKey = key.replace(/ /g, '');
                obj[newKey] = obj[key];
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                this.removeSpacesFromKeysRecursively(obj[key]);
            }
          }
          return obj;
    }
}
