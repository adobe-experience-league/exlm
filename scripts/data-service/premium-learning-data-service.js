import { getPLAccessToken } from '../utils/premium-learning-utils.js';

/**
 * @typedef {Object} PLQueryParams
 * @property {number} noOfResults - Number of results to fetch
 * @property {string|Array<string>} [contentType] - Content type filter (premium-learning-cohort or premium-learning-course)
 * @property {string} [sort] - Sort order
 * @property {string} [tagName] - Tag filter
 * @property {string} [q] - Search query string (triggers search endpoint)
 * @property {boolean} [browseMode] - Browse mode flag (triggers query endpoint with product filtering)
 * @property {Array<string>} [product] - Product filter array (e.g., ['Acrobat', 'AEM'])
 * @property {string|Array<string>} [products] - Product filter (e.g., 'Acrobat' or ['Acrobat', 'AEM'])
 * @property {string|Array<string>} [solutions] - Product filter alias (same as products, used by BrowseCardsDelegate)
 * @property {string|Array<string>} [roles] - Role filter (e.g., 'Administrator' or ['Administrator', 'Business User'])
 * @property {string|Array<string>} [durationRange] - Duration range filter (e.g., '0-1800' or ['0-1800', '1800-3600'])
 * @property {string|Array<string>} [learnerState] - Learner state filter (e.g., 'enrolled' or ['enrolled', 'completed', 'started', 'notenrolled'])
 * @property {boolean} [suggestedContent] - Whether to use the suggested-content endpoint
 */

/**
 * PLDataService class for fetching data from premium-learning API.
 * Handles API communication with Adobe Learning Manager to retrieve learning objects.
 */
export default class PLDataService {
  /**
   * Learning object types supported by premium-learning API
   * @private
   */
  static LO_TYPES = {
    LEARNING_PROGRAM: 'learningProgram',
    COURSE: 'course',
  };

  /**
   * Default sort order for premium-learning API queries
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
   * Suggested cohort endpoint path
   * @private
   */
  static SUGGESTED_CONTENT_ENDPOINT = '/learningObjects';

  /**
   * Enrollments endpoint path
   * @private
   */
  static ENROLLMENTS_ENDPOINT = '/enrollments';

  /**
   * Recommendation preferences endpoint path
   * @private
   */
  static RECOMMENDATION_PREFERENCES_ENDPOINT = '/users';

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
   * Creates an instance of PLDataService.
   * @param {PLQueryParams} queryParams - Query parameters for premium-learning API request
   * @param {Object} config - Config object (from getConfig())
   * @param {Object} pathDetails - Path details object (from getPathDetails())
   */
  constructor(queryParams, config, pathDetails) {
    this.queryParams = queryParams;
    this.config = config;
    this.pathDetails = pathDetails;
  }

  /**
   * Builds URL search parameters for premium-learning API request
   * @private
   * @returns {URLSearchParams} Constructed URL search parameters
   */
  buildUrlParams() {
    const { noOfResults, sort } = this.queryParams;
    const params = new URLSearchParams();

    // Set result limit
    params.append('page[limit]', noOfResults || 10);

    // Add sort parameter
    params.append('sort', sort || PLDataService.DEFAULT_SORT);

    // Add enforced fields and includes for comprehensive data
    params.append('enforcedFields[learningObject]', 'products,extensionOverrides');
    params.append(
      'include',
      'instances.enrollment.loResourceGrades,instances.loResources.resources,instances.badge,supplementaryResources,enrollment.loResourceGrades,skills.skillLevel.skill',
    );

    return params;
  }

  /**
   * Builds request body with filters for premium-learning API POST request
   * @private
   * @returns {Object} Request body object
   */
  buildRequestBody() {
    const { contentType, tagName } = this.queryParams;
    const catalogIds = this.config?.plPublicCatalogIds;

    // Determine learning object types - support both course and cohort
    const loTypes = PLDataService.determineLearningObjectTypes(contentType);

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

  buildBrowseRequestBody() {
    const { contentType, tagName, products } = this.queryParams;
    const catalogIds = this.config?.plPublicCatalogIds;

    // Determine learning object types - support both course and cohort
    const loTypes = PLDataService.determineLearningObjectTypes(contentType);

    const body = {
      'filter.loTypes': loTypes,
      'filter.learnerState': ['notenrolled', 'enrolled', 'started', 'completed'],
      'filter.ignoreEnhancedLP': false,
    };

    if (products && Array.isArray(products) && products.length > 0) {
      body['filter.recommendationProducts'] = products.map((productName) => ({
        name: productName,
        levels: [],
      }));
    }

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
   * Determines the premium-learning object types from content type(s)
   * Supports both single and multiple content types
   * @private
   * @param {string|Array<string>} contentType - Content type identifier(s)
   * @returns {Array<string>} Array of learning object types for premium-learning API
   */
  static determineLearningObjectTypes(contentType) {
    const types = Array.isArray(contentType) ? contentType : [contentType];
    const loTypes = [];

    types.forEach((type) => {
      const normalizedType = type?.toLowerCase().trim();
      if (normalizedType === 'premium-learning-cohort' && !loTypes.includes('learningProgram')) {
        loTypes.push('learningProgram');
      } else if (normalizedType === 'premium-learning-course' && !loTypes.includes('course')) {
        loTypes.push('course');
      }
    });

    // Default to course if no valid types found
    return loTypes.length > 0 ? loTypes : ['course'];
  }

  /**
   * Determines the PL learning object type from content type (legacy method)
   * @deprecated Use determineLearningObjectTypes instead
   * @private
   * @param {string|Array<string>} contentType - Content type identifier
   * @returns {string} Learning object type for premium-learning API
   */
  static determineLearningObjectType(contentType) {
    const typeStr = Array.isArray(contentType) ? contentType.join(',') : contentType;
    return typeStr?.includes('premium-learning-cohort')
      ? PLDataService.LO_TYPES.LEARNING_PROGRAM
      : PLDataService.LO_TYPES.COURSE;
  }

  /**
   * Builds request headers for premium-learning API
   * @private
   * @returns {Object} Request headers
   */
  static buildRequestHeaders() {
    const token = getPLAccessToken();
    return {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json;charset=UTF-8',
      Authorization: token ? `oauth ${token}` : '',
    };
  }

  /**
   * Builds request headers for GET-based suggested content API
   * @private
   * @returns {Object} Request headers
   */
  static buildSuggestedContentHeaders() {
    const token = getPLAccessToken();
    return {
      Accept: 'application/vnd.api+json',
      Authorization: token ? `oauth ${token}` : '',
    };
  }

  /**
   * Builds URL search parameters for the Suggested Content GET endpoint.
   * This is intentionally separate from the existing POST query/search flow.
   * @returns {URLSearchParams} Constructed URL search parameters
   */
  buildSuggestedContentUrlParams() {
    const { noOfResults, contentType } = this.queryParams;
    const { plPublicCatalogIds } = this.config ?? {};
    const { lang } = this.pathDetails;
    const params = new URLSearchParams();

    // Resolve loTypes from contentType; fall back to learningProgram (cohort)
    const loTypes = contentType
      ? PLDataService.determineLearningObjectTypes(contentType)
      : [PLDataService.LO_TYPES.LEARNING_PROGRAM];

    params.set('include', 'instances,enrollment.loResourceGrades,skills.skillLevel.skill');
    params.set('page[limit]', noOfResults || 10);
    params.set('filter.loTypes', loTypes.join(','));
    params.set('sort', PLDataService.DEFAULT_SORT);
    params.set('language', lang || 'en');
    params.set('enforcedFields[learningObject]', 'products');
    params.set('filter.ignoreEnhancedLP', 'false');
    params.set('filter.learnerState', 'notenrolled');
    params.set('filter.catalogIds', plPublicCatalogIds.join(','));
    return params;
  }

  /**
   * Builds URL search parameters for premium-learning search endpoint
   * @private
   * @param {boolean} hasQuery - Whether query string (q) is present
   * @returns {URLSearchParams} Constructed URL search parameters for search endpoint
   */
  buildSearchUrlParams(hasQuery = false) {
    const { noOfResults, sort } = this.queryParams;
    const params = new URLSearchParams();

    params.append('page[limit]', noOfResults || PLDataService.DEFAULT_SEARCH_RESULTS_COUNT);
    if (sort) {
      params.append('sort', sort);
    }

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
   * Builds request body for premium-learning search endpoint
   * @private
   * @param {boolean} hasQuery - Whether query string (q) is present
   * @returns {Object} Request body object for search endpoint
   */
  buildSearchRequestBody(hasQuery = false) {
    const { contentType, q, products, solutions, roles, durationRange, learnerState } = this.queryParams;
    const { recommendationProducts } = this.config?.['premium-learning'] ?? {};
    const catalogIds = this.config?.plPublicCatalogIds;
    const loTypes = PLDataService.determineLearningObjectTypes(contentType);

    const body = {
      'filter.loTypes': loTypes,
      'filter.ignoreEnhancedLP': false,
    };

    // Add catalog IDs if configured
    if (catalogIds) {
      body['filter.catalogIds'] = Array.isArray(catalogIds) ? catalogIds : [catalogIds];
    }

    if (hasQuery) {
      const { lang } = this.pathDetails;
      const languageCode = lang || 'en-US';

      Object.assign(body, {
        autoCorrectMode: true,
        query: q || '',
        mode: 'advanceSearch',
        matchType: 'phrase_and_match',
        stemmed: true,
        'filter.ignoreHigherOrderLOEnrollments': false,
        'filter.snippetTypes': PLDataService.SNIPPET_TYPES,
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
   * Builds URL search parameters for the recommended content query endpoint.
   * @private
   * @returns {URLSearchParams} Constructed URL search parameters
   */
  static buildRecommendedContentUrlParams() {
    return new URLSearchParams({
      'page[limit]': '10',
      sort: '-recommendationScore',
      'enforcedFields[learningObject]': 'products,roles,extensionOverrides,effectivenessData',
      include: 'instances.loResources.resources',
    });
  }

  /**
   * Fetches the user's recommendation preferences from Adobe Learning Manager.
   * @param {string} userId - The learner's user ID
   * @param {string} token - OAuth access token
   * @returns {Promise<Object>} Parsed preferences response
   * @throws {Error} If the API request fails
   */
  static async fetchRecommendationPreferences(userId, token) {
    const apiBaseUrl = this.config?.plApiBaseUrl;
    const headers = {
      Authorization: `oauth ${token}`,
      Accept: 'application/vnd.api+json',
    };

    const prefsRes = await fetch(
      `${apiBaseUrl}${PLDataService.RECOMMENDATION_PREFERENCES_ENDPOINT}/${userId}/recommendationPreferences`,
      { headers },
    );
    if (!prefsRes.ok) throw new Error(`Preferences fetch failed: ${prefsRes.status}`);
    return prefsRes.json();
  }

  /**
   * Fetches recommended learning objects using a pre-built payload.
   * @param {string} token - OAuth access token
   * @param {Object} payload - Request body built by the caller
   * @returns {Promise<Object>} Parsed learning objects response
   * @throws {Error} If the API request fails
   */
  static async fetchRecommendedLearningObjects(token, payload) {
    const apiBaseUrl = this.config?.plApiBaseUrl;
    const headers = {
      Authorization: `oauth ${token}`,
      Accept: 'application/vnd.api+json',
    };
    const queryParams = PLDataService.buildRecommendedContentUrlParams();

    const loRes = await fetch(`${apiBaseUrl}${PLDataService.QUERY_ENDPOINT}?${queryParams}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/vnd.api+json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });
    if (!loRes.ok) throw new Error(`Learning objects fetch failed: ${loRes.status}`);
    return loRes.json();
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
      if (this.queryParams?.suggestedContent) {
        return this.fetchSuggestedContent();
      }

      const apiBaseUrl = this.config?.plApiBaseUrl;
      const { q, searchMode, browseMode, recommendationMode } = this.queryParams;

      if (recommendationMode) {
        const { products = [], roles = [], contentType, noOfResults } = this.queryParams;
        const catalogIds = this.config?.plPublicCatalogIds;
        const token = getPLAccessToken();
        const payload = {
          'filter.recommendationProducts': products.map((p) => ({ name: p.name })),
          'filter.recommendationRoles': roles.map((r) => ({ name: r.name, levels: r.levels ?? [] })),
          'filter.loTypes': PLDataService.determineLearningObjectTypes(contentType),
          'filter.ignoreEnhancedLP': false,
          'filter.learnerState': ['notenrolled'],
        };
        if (catalogIds) {
          payload['filter.catalogIds'] = Array.isArray(catalogIds) ? catalogIds : [catalogIds];
        }
        const queryParams = new URLSearchParams({
          'page[limit]': String(noOfResults || PLDataService.DEFAULT_SEARCH_RESULTS_COUNT),
          sort: '-recommendationScore',
          'enforcedFields[learningObject]': 'products,roles,extensionOverrides,effectivenessData',
          include: 'instances.loResources.resources',
        });
        const headers = {
          Authorization: `oauth ${token}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        };
        const loRes = await fetch(`${apiBaseUrl}${PLDataService.QUERY_ENDPOINT}?${queryParams}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        if (!loRes.ok) throw new Error(`Learning objects fetch failed: ${loRes.status}`);
        return loRes.json();
      }

      const isSearchMode = searchMode || !!q;

      let url;
      const headers = PLDataService.buildRequestHeaders();
      let body;

      if (isSearchMode) {
        // Use search endpoint
        const hasQuery = !!q;
        url = new URL(`${apiBaseUrl}${PLDataService.SEARCH_ENDPOINT}`);
        url.search = this.buildSearchUrlParams(hasQuery).toString();
        body = this.buildSearchRequestBody(hasQuery);
      } else if (browseMode) {
        // Use query endpoint (browse mode)
        url = new URL(`${apiBaseUrl}${PLDataService.QUERY_ENDPOINT}`);
        url.search = this.buildUrlParams().toString();
        body = this.buildBrowseRequestBody();
      } else {
        // Use query endpoint
        url = new URL(`${apiBaseUrl}${PLDataService.QUERY_ENDPOINT}`);
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
        throw new Error(`Premium learning API request failed: ${response.status} ${response.statusText}`);
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
      console.error('Error fetching premium learning data:', error);
      return null;
    }
  }

  /**
   * Fetches Suggested Content using the dedicated GET /learningObjects endpoint.
   * Leaves the existing browse-cards POST flows untouched.
   * @returns {Promise<Object|null>} Suggested content API response
   */
  async fetchSuggestedContent() {
    try {
      const apiBaseUrl = this.config?.plApiBaseUrl;
      const url = new URL(`${apiBaseUrl}${PLDataService.SUGGESTED_CONTENT_ENDPOINT}`);
      url.search = this.buildSuggestedContentUrlParams().toString();

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: PLDataService.buildSuggestedContentHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Suggested content API request failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching suggested content:', error);
      return null;
    }
  }
}

/**
 * Fetches next page of enrollments using cursor URL
 * @param {string} cursorUrl - Next page URL from links.next
 * @returns {Promise<Object|null>} Enrollment data or null on error
 */
export async function fetchNextEnrollmentPage(cursorUrl) {
  try {
    const headers = PLDataService.buildRequestHeaders();
    const response = await fetch(cursorUrl, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Enrollment page fetch failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching enrollment page:', error);
    return null;
  }
}

/**
 * Checks if user has any enrollments in Adobe Learning Manager
 * Standalone utility function that can be used without instantiating PLDataService
 * @param {Object} config - Config object (from getConfig())
 * @param {string} loType - Learning object type ('course' or 'learningProgram')
 * @param {number} noOfResults - Number of results to fetch (default: 10)
 * @param {string} include - Optional include parameter for related data (e.g., 'learningObject,learningObject.instances')
 * @param {string} instanceStates - Optional filter for instance states (e.g., 'Active')
 * @returns {Promise<Object|null>} Enrollment data or null on error
 * @example
 * import { fetchUserEnrollments } from './data-service/premium-learning-data-service.js';
 * const config = getConfig();
 * const enrollments = await fetchUserEnrollments(config, 'learningProgram', 10, 'learningObject', 'Active');
 * const hasEnrollments = enrollments?.data?.length > 0;
 */
export async function fetchUserEnrollments(
  config,
  loType = 'learningProgram',
  noOfResults = 10,
  include = null,
  instanceStates = null,
) {
  try {
    const apiBaseUrl = config?.plApiBaseUrl;
    const url = new URL(`${apiBaseUrl}/enrollments`);

    const params = new URLSearchParams({
      'page[limit]': noOfResults,
      'filter.loTypes': loType,
      includeHierarchicalEnrollments: 'false',
      sort: 'dateEnrolled',
    });

    if (include) {
      params.append('include', include);
    }

    if (instanceStates) {
      params.append('filter.loInstanceStates', instanceStates);
    }

    url.search = params.toString();
    const headers = PLDataService.buildRequestHeaders();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Enrollments API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error checking user enrollments:', error);
    return null;
  }
}

/**
 * Fetches cohort/learning object progress details with enrollment grades
 * @param {string} cohortId - Learning object ID
 * @param {Object} config - Config object (from getConfig())
 * @returns {Promise<Object|null>} Learning object details or null on error
 */
export async function fetchCohortProgress(cohortId, config) {
  try {
    const url = new URL(`${config?.plApiBaseUrl}/learningObjects/${cohortId}`);
    url.searchParams.set(
      'include',
      [
        'instances.enrollment.loResourceGrades',
        'enrollment.loResourceGrades',
        'subLOs.enrollment.loResourceGrades',
        'subLOs.subLOs.enrollment.loResourceGrades',
        'instances',
        'subLOs',
        'subLOs.instances',
        'instances.loResources.resources',
        'subLOs.instances.loResources.resources',
      ].join(','),
    );

    const response = await fetch(url.toString(), {
      headers: PLDataService.buildRequestHeaders(),
      credentials: 'include',
    });

    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

/**
 * Fetches board ID from Adobe I/O Runtime engagement endpoint
 * @param {string} learningObjectId - Learning object ID
 * @param {string} loInstanceId - Instance ID
 * @param {Object} config - Config object (from getConfig())
 * @returns {Promise<string|null>} Board ID or null if not found
 */
export async function getEngagementBoardId(learningObjectId, loInstanceId, config) {
  const endpoint = config?.premiumLearningAuthAPI?.replace(/\/authentication\/?$/, '/engagement');
  if (!endpoint) return null;

  try {
    const url = new URL(endpoint);
    url.searchParams.set('learningObjectId', learningObjectId);
    url.searchParams.set('loInstanceId', loInstanceId);

    const token = getPLAccessToken();
    if (!token) return null;
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `oauth ${token}`,
      },
      credentials: 'include',
    });
    if (!response.ok) return null;

    const data = await response.json();
    return data?.data?.[0]?.id || null;
  } catch {
    return null;
  }
}

/**
 * Fetches board posts from ALM API
 * @param {string} boardId - Board ID
 * @param {Object} config - Config object (from getConfig())
 * @returns {Promise<Object|null>} Posts data with comments or null on error
 */
export async function fetchBoardPosts(boardId, config) {
  if (!boardId) return null;

  try {
    const url = new URL(`${config?.plApiBaseUrl}/boards/${boardId}/posts`);
    url.searchParams.set('filter.state', 'ACTIVE');

    const response = await fetch(url.toString(), {
      headers: PLDataService.buildRequestHeaders(),
      credentials: 'include',
    });

    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}
