import browseCardDataModel from '../data-model/browse-cards-model.js';
import {RECOMMENDED_COURSES_CONSTANTS } from './browse-cards-constants.js';
import { fetchLanguagePlaceholders, getConfig } from '../scripts.js';
import { CONTENT_TYPES } from '../data-service/coveo/coveo-exl-pipeline-constants.js';

const { recommendedCoursesUrl, prodAssetsCdnOrigin } = getConfig();
/**
 * Module that provides functionality for adapting Paths results to BrowseCards data model
 * @module BrowseCardsPathsAdaptor
 */
const BrowseCardsPathsAdaptor = (() => {
  let placeholders = {};

  /**
   * Creates tags based on the result and content type.
   * @param {Object} result - The result object.
   * @param {string} contentType - The content type.
   * @returns {Array} An array of tags.
   */
  const createTags = (roleData) => {
    const tags = [];
    const role = roleData;
    tags.push({ icon: 'user', text: role || '' });
    return tags;
  };

  // Function to create view link text based on content type
  const createViewLinkText = (contentType) => {
    const linkText =
      contentType === RECOMMENDED_COURSES_CONSTANTS.IN_PROGRESS.MAPPING_KEY
        ? placeholders.browseCardCourseContinueLabel || 'Continue Course'
        : placeholders.browseCardCourseViewLabel || 'View Course';
    return linkText;
  };

  // Function to create link URL text based on content type
  const createLinkURL = (contentType, courseID, courseURL) => {
    let linkURL = courseURL;
    if (contentType === RECOMMENDED_COURSES_CONSTANTS.IN_PROGRESS.MAPPING_KEY) {
      const courseUrl = new URL(recommendedCoursesUrl);
      if (courseID) {
        const searchParam = new URLSearchParams(courseUrl.search);
        searchParam.set('recommended', courseID);
        courseUrl.search = searchParam.toString();
      }
      linkURL = courseUrl.href;
    }
    return linkURL;
  };

  /**
   * Maps a result to the BrowseCards data model.
   * @param {Object} result - The result object.
   * @returns {Object} The Path data model.
   */

  const mapResultToCardsDataModel = (result) => {
    const {
      Solution,
      Thumbnail,
      ID,
      'Path Title': PathTitle,
      'Path Duration': PathDuration,
      URL,
      inProgressValue,
      Role,
      contentType,
    } = result || {};

    return {
      ...browseCardDataModel,
      contentType,
      id: ID,
      badgeTitle: CONTENT_TYPES.COURSE.LABEL,
      thumbnail: (Thumbnail || '').replace('/www/img', prodAssetsCdnOrigin) || '',
      inProgressStatus: inProgressValue || '0',
      product: Solution || '',
      title: PathTitle || '',
      tags: createTags(Role) || '',
      inProgressText: PathDuration || '',
      copyLink: createLinkURL(contentType, ID, URL) || '',
      viewLink: createLinkURL(contentType, ID, URL) || '',
      viewLinkText: createViewLinkText(contentType),
    };
  };

  /**
   * Maps an array of results to an array of PathsCards data models.
   * @param {Array} data - The array of result objects.
   * @returns {Promise<Array>} A promise that resolves with an array of PathsCards data models.
   */
  const mapResultsToCardsData = async (data) => {
    try {
      placeholders = await fetchLanguagePlaceholders();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }
    return data.map((result) => mapResultToCardsDataModel(result));
  };
  return {
    mapResultsToCardsData,
  };
})();

export default BrowseCardsPathsAdaptor;
