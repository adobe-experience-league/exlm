import { URL_SPECIAL_CASE_LOCALES, fetchLanguagePlaceholders, getConfig, rewriteDocsPath } from '../../scripts.js';
import CoveoDataService from './coveo-data-service.js';
import { CONTENT_TYPES, COMMUNITY_SEARCH_FACET } from './coveo-exl-pipeline-constants.js';

const { coveoSearchResultsUrl } = getConfig();

// Most of these are copied from an existing call. I do not believe we need all of them, so this list could probably be pruned.
const fieldsToInclude = [
  '@foldingchild',
  '@foldingcollection',
  '@foldingparent',
  'author',
  'author_bio_page',
  'author_name',
  'author_type',
  'authorname',
  'authortype',
  'collection',
  'connectortype',
  'contenttype',
  'date',
  'documenttype',
  'el_author_type',
  'el_contenttype',
  'el_id',
  'el_interactionstyle',
  'el_kudo_status',
  'el_lirank',
  'el_product',
  'el_rank_icon',
  'el_reply_status',
  'el_solution',
  'el_solutions_authored',
  'el_type',
  'el_usergenerictext',
  'el_version',
  'el_view_status',
  'exl_description',
  'exl_thumbnail',
  'filetype',
  'id',
  'language',
  'liMessageLabels',
  'liboardinteractionstyle',
  'licommunityurl',
  'lithreadhassolution',
  'objecttype',
  'outlookformacuri',
  'outlookuri',
  'permanentid',
  'role',
  'source',
  'sourcetype',
  'sysdocumenttype',
  'type',
  'urihash',
  'video_url',
];

/**
 * Constructs advanced query for Coveo data service based on date array.
 * @param {Array} dateCriteria - Array of date values.
 * @returns {string} Advanced query string for date.
 */
function contructDateAdvancedQuery(dateCriteria) {
  return `@date==(${dateCriteria.join(',')})`;
}

/**
 * Constructs Coveo facet structure based on provided facets.
 * @param {Array} facets - An array of facet objects.
 * @returns {Array} Array of Coveo facet objects.
 * @private
 */
function constructCoveoFacet(facets) {
  const facetsArray = facets.map((facet) => ({
    facetId: `@${facet.id}`,
    field: facet.id,
    type: facet.type,
    numberOfValues: facet.currentValues?.length || 2,
    currentValues: facet.currentValues.map((value) => ({
      value,
      state: value === CONTENT_TYPES.COMMUNITY.MAPPING_KEY ? 'idle' : 'selected',
      ...(value === CONTENT_TYPES.COMMUNITY.MAPPING_KEY ? { children: COMMUNITY_SEARCH_FACET } : []),
    })),
  }));
  return facetsArray;
}

/**
 * Constructs advanced query for Coveo data service based on query parameters.
 * @returns {Object} Object containing the advanced query.
 * @private
 */
function constructCoveoAdvancedQuery(param) {
  const featureQuery = param.feature ? `(${param.feature.map((type) => `@el_features=="${type}"`).join(' OR ')})` : '';
  const contentTypeQuery = param.contentType
    ? `AND (${param.contentType.map((type) => `@el_contenttype=="${type}"`).join(' OR ')})`
    : '';
  const productQuery = param.product
    ? `AND (${param.product.map((type) => `@el_product=="${type}"`).join(' OR ')})`
    : '';
  const versionQuery = param.version
    ? `AND (${param.version.map((type) => `@el_version=="${type}"`).join(' OR ')})`
    : '';
  const roleQuery = param.role ? `AND (${param.role.map((type) => `@el_role=="${type}"`).join(' OR ')})` : '';
  const levelQuery = param.level ? `AND (${param.level.map((type) => `@el_level=="${type}"`).join(' OR ')})` : '';
  const authorTypeQuery = param.authorType
    ? `AND (${param.authorType.map((type) => `@author_type=="${type}"`).join(' OR ')})`
    : '';
  const query = `${featureQuery} ${contentTypeQuery} ${productQuery} ${versionQuery} ${roleQuery} ${levelQuery} ${authorTypeQuery}`;
  return query;
}

/**
 * Get facet array based off a param object
 * @param {*} param
 * @returns
 */
export function getFacets(param) {
  const facets = [
    ...(param.contentType
      ? [
          {
            id: 'el_contenttype',
            type: param.contentType[0] === CONTENT_TYPES.COMMUNITY.MAPPING_KEY ? 'hierarchical' : 'specific',
            currentValues: param.contentType,
          },
        ]
      : []),
    ...(param.product ? [{ id: 'el_product', type: 'specific', currentValues: param.product }] : []),
    ...(param.version ? [{ id: 'el_version', type: 'specific', currentValues: param.version }] : []),
    ...(param.role ? [{ id: 'el_role', type: 'specific', currentValues: param.role }] : []),
    ...(param.authorType ? [{ id: 'author_type', type: 'specific', currentValues: param.authorType }] : []),
    ...(param.level ? [{ id: 'el_level', type: 'specific', currentValues: param.level }] : []),
  ];

  return constructCoveoFacet(facets);
}

export function getExlPipelineDataSourceParams(param) {
  return {
    url: coveoSearchResultsUrl,
    param: {
      locale:
        URL_SPECIAL_CASE_LOCALES.get(document.querySelector('html').lang) ||
        document.querySelector('html').lang ||
        'en',
      searchHub: `Experience League Learning Hub`,
      numberOfResults: param.noOfResults,
      excerptLength: 200,
      sortCriteria: param.sortCriteria,
      context: { entitlements: {}, role: {}, interests: {}, industryInterests: {} },
      filterField: '@foldingcollection',
      parentField: '@foldingchild',
      childField: '@foldingparent',
      ...(param.q && !param.feature ? { q: param.q } : ''),
      ...(param.dateCriteria && !param.feature ? { aq: contructDateAdvancedQuery(param.dateCriteria) } : ''),
      ...(!param.feature ? { facets: getFacets(param) } : ''),
      ...(param.feature ? { aq: constructCoveoAdvancedQuery(param) } : ''),
      fieldsToInclude,
    },
  };
}

export async function exlPipelineCoveoDataAdaptor(params) {
  let placeholders = {};

  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const dataSourceParams = getExlPipelineDataSourceParams(params);
  const coveoService = new CoveoDataService(dataSourceParams);
  const data = await coveoService.fetchDataFromSource();

  /**
   * Converts a string to title case.
   * @param {string} str - The input string.
   * @returns {string} The string in title case.
   */
  const convertToTitleCase = (str) => (str ? str.replace(/\b\w/g, (match) => match.toUpperCase()) : '');

  /**
   * Creates tags based on the result and content type.
   * @param {Object} result - The result object.
   * @param {string} contentType - The content type.
   * @returns {Array} An array of tags.
   */
  const createTags = (result, contentType) => {
    const tags = [];
    const role = result?.raw?.role ? result.raw.role.replace(/,/g, ', ') : '';
    if (contentType === CONTENT_TYPES.COURSE.MAPPING_KEY) {
      tags.push({ icon: 'user', text: role || '' });
      /* TODO: Will enable once we have the API changes ready from ExL */
      // tags.push({ icon: 'book', text: `0 ${placeholders.lesson}` });
    } else {
      tags.push({
        icon: result?.parentResult?.raw?.el_view_status || result?.raw?.el_view_status ? 'view' : '',
        text: result?.parentResult?.raw?.el_view_status || result?.raw?.el_view_status || '',
      });
      tags.push({
        icon: result?.parentResult?.raw?.el_reply_status || result?.raw?.el_reply_status ? 'reply' : '',
        text: result?.parentResult?.raw?.el_reply_status || result?.raw?.el_reply_status || '',
      });
    }
    return tags;
  };

  /**
   * Removes duplicate items from an array of products/solutions (with sub-solutions)
   * @param {Array} products - Array of products to remove duplicates from.
   * @returns {Array} - Array of unique products.
   */
  const removeProductDuplicates = (products) => {
    const filteredProducts = [];
    for (let outerIndex = 0; outerIndex < products.length; outerIndex += 1) {
      const currentItem = products[outerIndex];
      let isDuplicate = false;
      for (let innerIndex = 0; innerIndex < products.length; innerIndex += 1) {
        if (outerIndex !== innerIndex && products[innerIndex].startsWith(currentItem)) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        const product = products[outerIndex].replace(/\|/g, ' ');
        filteredProducts.push(product);
      }
    }
    return filteredProducts;
  };

  /**
   * Maps a result to the data model.
   * @param {Object} result - The result object.
   * @param {Number} index - The index of the result object in the source array.
   * @param {string} searchUid - If the data comes from coveo, provide the searchUid
   * @returns {Object} The BrowseCards data model.
   */
  const mapResultsDataModel = (result, index, searchUid) => {
    const { raw, parentResult, title, excerpt, clickUri, uri } = result || {};
    /* eslint-disable camelcase */

    const { el_id, el_contenttype, el_product, el_solution, el_type } = parentResult?.raw || raw || {};
    let contentType;
    if (el_type) {
      contentType = el_type.trim();
    } else {
      contentType = Array.isArray(el_contenttype) ? el_contenttype[0]?.trim() : el_contenttype?.trim();
    }
    let products;
    if (el_solution) {
      products = Array.isArray(el_solution) ? el_solution : el_solution.split(/,\s*/);
    } else if (el_product) {
      products = Array.isArray(el_product) ? el_product : el_product.split(/,\s*/);
    }
    const tags = createTags(result, contentType?.toLowerCase());
    let url = parentResult?.clickUri || parentResult?.uri || clickUri || uri || '';
    url = rewriteDocsPath(url);
    const contentTypeTitleCase = convertToTitleCase(contentType?.toLowerCase());

    return {
      ...raw,
      id: parentResult?.el_id || el_id || '',
      contentType,
      badgeTitle: contentType ? CONTENT_TYPES[contentType.toUpperCase()]?.LABEL : '',
      thumbnail:
        raw?.exl_thumbnail ||
        (raw?.video_url &&
          (raw.video_url.includes('?')
            ? raw.video_url.replace(/\?.*/, '?format=jpeg')
            : `${raw.video_url}?format=jpeg`)) ||
        '',
      product: products && removeProductDuplicates(products),
      title: parentResult?.title || title || '',
      description:
        contentType?.toLowerCase() === CONTENT_TYPES.PERSPECTIVE.MAPPING_KEY
          ? raw?.exl_description || parentResult?.excerpt || ''
          : parentResult?.excerpt || excerpt || raw?.description || raw?.exl_description || '',
      tags,
      copyLink: url,
      viewLink: url,
      viewLinkText: placeholders[`browseCard${contentTypeTitleCase}ViewLabel`] || 'View',
      searchUid,
      index,
      authorInfo: {
        name: raw?.author_name || '',
        type: raw?.author_type || '',
      },
    };
  };

  return data.map((result, index) => mapResultsDataModel(result, index, data.searchUid)) || [];
}
