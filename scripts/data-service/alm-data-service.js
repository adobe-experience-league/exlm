import { getConfig, getPathDetails } from '../scripts.js';

/**
 * @typedef {Object} ALMQueryParams
 * @property {number} noOfResults - Number of results to fetch
 * @property {string|Array<string>} [contentType] - Content type filter (alm-cohort or alm-course)
 * @property {string} [sort] - Sort order
 * @property {string} [tagName] - Tag filter
 * @property {string} [q] - Search query string (triggers search endpoint)
 * @property {string|Array<string>} [products] - Product filter (e.g., 'Acrobat' or ['Acrobat', 'AEM'])
 * @property {string|Array<string>} [solutions] - Product filter alias (same as products, used by BrowseCardsDelegate)
 * @property {string|Array<string>} [roles] - Role filter (e.g., 'Administrator' or ['Administrator', 'Business User'])
 * @property {string|Array<string>} [durationRange] - Duration range filter (e.g., '0-1800' or ['0-1800', '1800-3600'])
 * @property {string|Array<string>} [learnerState] - Learner state filter (e.g., 'enrolled' or ['enrolled', 'completed', 'started', 'notenrolled'])
 */

/**
 * ALMDataService class for fetching data from ALM (Adobe Learning Manager) API.
 * Handles API communication with Adobe Learning Manager to retrieve learning objects.
 * 
 * @class ALMDataService
 * @example
 * const service = new ALMDataService({
 *   noOfResults: 10,
 *   contentType: 'alm-cohort'
 * });
 * const data = await service.fetchDataFromSource();
 */
export default class ALMDataService {
  /**
   * Learning object types supported by ALM API
   * @private
   */
  static LO_TYPES = {
    LEARNING_PROGRAM: 'learningProgram',
    COURSE: 'course',
  };

  /**
   * Default sort order for ALM API queries
   * @private
   */
  static DEFAULT_SORT = 'name';

  /**
   * Query endpoint path
   * @private
   */
  static DEFAULT_SEARCH_RESULTS_COUNT = 4;

  /**
   * Search endpoint path
   * @private
   */
  static SEARCH_ENDPOINT = '/search/query';

  /**
   * Query endpoint path
   * @private
   */
  static QUERY_ENDPOINT = '/learningObjects/query';

  /**
   * Snippet types for search endpoint
   * @private
   */
  static SNIPPET_TYPES = [
    'loMetadata',
    'recRoleName',
    'recProductName',
    'skillName',
    'skillDescription',
    'note',
    'badgeName',
    'courseTag',
    'moduleTag',
    'jobAidTag',
    'lpTag',
    'certificationTag',
    'embedLpTag',
    'discussion',
  ];

  /**
   * Creates an instance of ALMDataService.
   * @param {ALMQueryParams} queryParams - Query parameters for ALM API request
   */
  constructor(queryParams) {
    this.queryParams = queryParams;
    this.config = getConfig().alm;
  }

  /**
   * Builds URL search parameters for ALM API request
   * @private
   * @returns {URLSearchParams} Constructed URL search parameters
   */
  buildUrlParams() {
    const { noOfResults, sort } = this.queryParams;
    const params = new URLSearchParams();

    // Set result limit
    params.append('page[limit]', noOfResults || 10);

    // Add sort parameter
    params.append('sort', sort || ALMDataService.DEFAULT_SORT);

    // Add enforced fields and includes for comprehensive data
    params.append('enforcedFields[learningObject]', 'extensionOverrides');
    params.append('include', 'instances.enrollment.loResourceGrades,instances.loResources.resources,instances.badge,supplementaryResources,enrollment.loResourceGrades,skills.skillLevel.skill');

    return params;
  }

  /**
   * Builds request body with filters for ALM API POST request
   * @private
   * @returns {Object} Request body object
   */
  buildRequestBody() {
    const { contentType, tagName } = this.queryParams;
    const { catalogIds } = this.config;

    // Determine learning object types - support both course and cohort
    const loTypes = ALMDataService.determineLearningObjectTypes(contentType);


    const body = {
      'filter.loTypes': loTypes,
      'filter.learnerState': ['notenrolled', 'enrolled', 'started', 'completed'],
      'filter.ignoreEnhancedLP': false,
      'filter.recommendationProducts': [{ name: 'Acrobat', levels: [] }],
    };

    // Add catalog IDs if configured
    if (catalogIds) {
      body['filter.catalogIds'] = Array.isArray(catalogIds) ? catalogIds : [catalogIds];
    }

    // Add tag filter if provided
    if (tagName) {
      body['filter.tagName'] = tagName;
    }


    return body;
  }

  /**
   * Determines the ALM learning object types from content type(s)
   * Supports both single and multiple content types
   * @private
   * @param {string|Array<string>} contentType - Content type identifier(s)
   * @returns {Array<string>} Array of learning object types for ALM API
   */
  static determineLearningObjectTypes(contentType) {
    const types = Array.isArray(contentType) ? contentType : [contentType];
    const loTypes = [];

    types.forEach((type) => {
      const normalizedType = type?.toLowerCase().trim();
      if (normalizedType === 'alm-cohort' && !loTypes.includes('learningProgram')) {
        loTypes.push('learningProgram');
      } else if (normalizedType === 'alm-course' && !loTypes.includes('course')) {
        loTypes.push('course');
      }
    });

    // Default to course if no valid types found
    return loTypes.length > 0 ? loTypes : ['course'];
  }

  /**
   * Determines the ALM learning object type from content type (legacy method)
   * @deprecated Use determineLearningObjectTypes instead
   * @private
   * @param {string|Array<string>} contentType - Content type identifier
   * @returns {string} Learning object type for ALM API
   */
  static determineLearningObjectType(contentType) {
    const typeStr = Array.isArray(contentType) ? contentType.join(',') : contentType;
    return typeStr?.includes('alm-cohort')
      ? ALMDataService.LO_TYPES.LEARNING_PROGRAM
      : ALMDataService.LO_TYPES.COURSE;
  }

  /**
   * Builds request headers for ALM API
   * @private
   * @returns {Object} Request headers
   */
  buildRequestHeaders() {
    const { oauthToken } = this.config;
    return {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json;charset=UTF-8',
      'Authorization': oauthToken ? `oauth ${oauthToken}` : '',
    };
  }

  /**
   * Builds URL search parameters for ALM search endpoint
   * @private
   * @param {boolean} hasQuery - Whether query string (q) is present
   * @returns {URLSearchParams} Constructed URL search parameters for search endpoint
   */
  buildSearchUrlParams(hasQuery = false) {
    const { noOfResults, sort } = this.queryParams;
    const params = new URLSearchParams();

    params.append('page[limit]', noOfResults || ALMDataService.DEFAULT_SEARCH_RESULTS_COUNT);
    params.append('sort', sort);

    if (hasQuery) {
      params.append(
        'enforcedFields[learningObject]',
        'products,roles,extensionOverrides,effectivenessData,authorNames,authorDetails,bannerUrl,dateCreated,datePublished,dateUpdated,duration,effectiveModifiedDate,enableSocial,hasOptionalLoResources,hasPreview,instanceSwitchEnabled,isBookmarked,isEnhancedLP,isExternal,isMqaEnabled,isPrerequisiteEnforced,isSubLoOrderEnforced,loFormat,loResourceCompletionCount,loType,moduleResetEnabled,multienrollmentEnabled,rating,sections,showAggregatedResources,state,tags,unenrollmentAllowed,whoShouldTake,localizedMetadata,downloadable',
      );
      params.append(
        'include',
        'model.instances.enrollment.loResourceGrades,model.instances.loResources.resources,model.instances.badge,model.supplementaryResources,model.enrollment.loResourceGrades,model.skills.skillLevel.skill,model.authors,model.instances,model.recommendationProducts,model.recommendationRoles,model.subLOs,model.supplementaryLOs,model.prerequisiteLOs',
      );
    } else {
      params.append('enforcedFields[learningObject]', 'products,roles,extensionOverrides,effectivenessData');
      params.append(
        'include',
        'model.instances.loResources.resources,model.instances.badge,model.supplementaryResources,model.enrollment,model.enrollment.loResourceGrades,model.skills.skillLevel.skill',
      );
    }

    return params;
  }

  /**
   * Builds request body for ALM search endpoint
   * @private
   * @param {boolean} hasQuery - Whether query string (q) is present
   * @returns {Object} Request body object for search endpoint
   */
  buildSearchRequestBody(hasQuery = false) {
    const { contentType, q, products, solutions, roles, durationRange, learnerState } = this.queryParams;
    const { recommendationProducts } = this.config;
    const loTypes = ALMDataService.determineLearningObjectTypes(contentType);

    const body = {
      'filter.loTypes': loTypes,
      'filter.ignoreEnhancedLP': false,
    };
    if (hasQuery) {
      const { lang } = getPathDetails();
      const languageCode = lang || 'en-US';

      Object.assign(body, {
        autoCorrectMode: true,
        query: q || '',
        mode: 'advanceSearch',
        matchType: 'phrase_and_match',
        stemmed: true,
        'filter.ignoreHigherOrderLOEnrollments': false,
        'filter.snippetTypes': ALMDataService.SNIPPET_TYPES,
        language: [languageCode],
      });
    }

    const productParam = products || solutions;
    if (productParam) {
      const productArray = Array.isArray(productParam) ? productParam : [productParam];
      body['filter.recommendationProducts'] = productArray.map((product) => ({
        name: product,
        levels: [],
      }));
    } else if (recommendationProducts) {
      body['filter.recommendationProducts'] = Array.isArray(recommendationProducts)
        ? recommendationProducts
        : [{ name: recommendationProducts, levels: [] }];
    }

    if (roles) {
      const roleArray = Array.isArray(roles) ? roles : [roles];
      body['filter.recommendationRoles'] = roleArray.map((role) => ({
        name: role,
        levels: [],
      }));
    }

    if (durationRange) {
      const durationArray = Array.isArray(durationRange) ? durationRange : [durationRange];
      body['filter.duration.range'] = durationArray;
    }

    if (learnerState) {
      const stateArray = Array.isArray(learnerState) ? learnerState : [learnerState];
      body['filter.learnerState'] = stateArray;
    }
    return body;
  }

  /**
   * Fetches learning objects from Adobe Learning Manager API
   * Routes to search endpoint if during search mode, otherwise uses query endpoint
   *
   * @returns {Promise<Array|null>} Array of learning objects or null on error
   * @throws {Error} If API request fails
   */
  async fetchDataFromSource() {
    try {
      const { apiBaseUrl } = this.config;
      const { q, searchMode } = this.queryParams;
      const isSearchMode = searchMode || !!q;

      let url;
      const headers = this.buildRequestHeaders();
      let body;

      if (isSearchMode) {
        // Use search endpoint
        const hasQuery = !!q;
        url = new URL(`${apiBaseUrl}${ALMDataService.SEARCH_ENDPOINT}`);
        url.search = this.buildSearchUrlParams(hasQuery).toString();
        body = this.buildSearchRequestBody(hasQuery);

        console.log('ALM Data Service - Using search endpoint:', url.toString());
      } else {
        // Use query endpoint
        url = new URL(`${apiBaseUrl}${ALMDataService.QUERY_ENDPOINT}`);
        url.search = this.buildUrlParams().toString();
        body = this.buildRequestBody();
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`ALM API request failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const isSearchResponse = responseData.data?.some((item) => item.type === 'searchResult');

      if (isSearchResponse && responseData.data && responseData.included) {
        const transformedData = {
          ...responseData,
          data: responseData.data.map((searchResult) => {
            const modelId = searchResult.relationships?.model?.data?.id;
            const learningObject = responseData.included.find(
              (item) => item.id === modelId && item.type === 'learningObject',
            );

            if (learningObject) {
              return learningObject;
            }

            return {
              ...searchResult,
              type: 'learningObject',
              attributes: {
                ...searchResult.attributes,
                loType: searchResult.attributes.modelSubType || searchResult.attributes.modelType || 'course',
                imageUrl: searchResult.attributes.imageUrl,
                name: searchResult.attributes.name,
                description: searchResult.attributes.description,
                rating: { averageRating: 0, ratingsCount: 0 },
                duration: 0,
              },
              relationships: {
                instances: { data: [] },
                authors: { data: [] },
                skills: { data: [] },
              },
            };
          }),
        };
        return transformedData;
      }

      return responseData;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching ALM data:', error);
      return null;
    }
  }
}
