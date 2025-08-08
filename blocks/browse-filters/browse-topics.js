import { COVEO_SEARCH_CUSTOM_EVENTS } from '../../scripts/search/search-utils.js';
import { getCoveoFacets, roleOptions, contentTypeOptions, productTypeOptions } from './browse-filter-utils.js';

export const coveoFacetMap = {
  el_role: 'headlessRoleFacet',
  el_contenttype: 'headlessTypeFacet',
  el_level: 'headlessExperienceFacet',
  el_product: 'headlessProductFacet',
  author_type: 'headlessAuthorTypeFacet',
};

export const dropdownOptions = [roleOptions, contentTypeOptions];

/**
 * formattedTags returns the array of base64 encoded tags after extracting from the tags selected in dialog
 * @param {string} inputString - The topics tag. E.g. exl:topic/QXBwIEJ1aWxkZXI=
 * @returns the topic tag. E.g. QXBwIEJ1aWxkZXI=
 */
export function formattedTags(inputString) {
  const resultArray = [];
  const items = inputString.split(',');

  items.forEach((item) => {
    let base64EncodedTagsArray;
    let product;
    let version;

    const [type, productBase64, versionBase64] = item.split('/');
    if (productBase64) {
      product = atob(productBase64);
    }
    if (versionBase64) {
      version = atob(versionBase64);
    }

    // Check if product and version are not undefined before appending to base64EncodedTagsArray
    if (product || version) {
      base64EncodedTagsArray = `${type}${product ? `/${product}` : ''}${version ? `/${version}` : ''}`;
      resultArray.push(base64EncodedTagsArray);
    }
  });
  return resultArray;
}

export const generateQuery = (topic) => {
  const [type, product, version] = topic.split('/');
  if (!product) {
    return { query: `@el_features="${type}"`, product: type };
  }
  if (!version) {
    return { query: `@el_product="${product}"`, product };
  }
  const isSolutionType = type.toLowerCase().includes('solution');
  const query = `(@el_product="${product}" AND @el_${isSolutionType ? 'version' : 'features'}="${version}")`;
  return {
    query,
    product,
    forceQuery: true,
  };
};

export function dispatchCoveoAdvancedQuery({ query, fireSelection = true, resetPage = true, targetPageNumber }) {
  if (!window.headlessQueryActionCreators) {
    return;
  }
  const selectedPageNumber = typeof targetPageNumber === 'number' ? targetPageNumber : undefined;
  const advancedQueryAction = window.headlessQueryActionCreators.updateAdvancedSearchQueries({
    aq: query,
  });
  window.headlessSearchEngine.dispatch(advancedQueryAction);
  const isQueryDispatchable = !!query || window.headlessStatusControllers?.state?.firstSearchExecuted;
  if (window.headlessSearchActionCreators && fireSelection && isQueryDispatchable) {
    const searchAction = window.headlessSearchActionCreators.executeSearch(window.logSearchboxSubmit());
    if (window.headlessPager && (resetPage || selectedPageNumber !== undefined)) {
      const pgNum = selectedPageNumber !== undefined ? selectedPageNumber : 1;
      window.headlessPager.selectPage(pgNum);
    }
    window.headlessSearchEngine.dispatch(searchAction);
  }
}

const reInitTopicSelection = () => {
  let fireSelection = document.querySelectorAll('.browse-topics-item-active').length > 0;
  const selectedDropdownItems = Array.from(document.querySelectorAll('.browse-tags')).reduce((acc, curr) => {
    const { type } = curr.dataset;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(curr.value);
    return acc;
  }, {});

  Object.keys(selectedDropdownItems).forEach((key) => {
    const coveoFacetKey = coveoFacetMap[key];
    const coveoFacet = window[coveoFacetKey];
    const facetValues = selectedDropdownItems[key];
    fireSelection = true;
    facetValues.forEach((value) => {
      const facets = getCoveoFacets(value, true);
      facets.forEach(({ state, value: facetValue }) => {
        coveoFacet.toggleSelect({
          state,
          value: facetValue,
        });
      });
    });
  });
  if (fireSelection) {
    let targetPageNumber;
    if (window.headlessPager?.state?.currentPage) {
      targetPageNumber = window.headlessPager.state.currentPage;
    }
    // eslint-disable-next-line no-use-before-define
    handleTopicSelection(undefined, undefined, undefined, targetPageNumber);
  }
};

export function handleTopicSelection(block, fireSelection, resetPage, targetPageNumber) {
  const wrapper = block || document;
  const selectedTopics = Array.from(wrapper.querySelectorAll('.browse-topics-item-active')).reduce((acc, curr) => {
    const id = curr.dataset.topicname;
    acc.push(id);
    return acc;
  }, []);

  if (window.headlessQueryActionCreators) {
    let query = window.headlessBaseSolutionQuery || '';
    const currentProductFacetValues = window.headlessProductFacet?.state?.values || [];
    const productTypeDropdownExists = !!dropdownOptions.find((opt) => opt.id === productTypeOptions.id);
    if (currentProductFacetValues.length && !productTypeDropdownExists) {
      currentProductFacetValues.forEach(({ value, state }) => {
        if (state === 'selected') {
          window.headlessProductFacet.toggleSelect({
            value,
            state: 'idle',
          });
        }
      });
    }

    if (selectedTopics.length) {
      const decodedHash = window.location.hash ? decodeURIComponent(window.location.hash) : '';
      const elProductHash = decodedHash.split('&').find((hashInfo) => hashInfo.includes('f-el_product='));
      const [, productsList = ''] = elProductHash?.split('=') || [];
      const productsInUrl = productsList.split(',').filter(Boolean);
      const topicQueryItems = `${selectedTopics
        .map((topic) => {
          const { query: advancedQuery, forceQuery = false, product } = generateQuery(topic);
          if (!forceQuery && window.headlessProductFacet && !productsInUrl.includes(product)) {
            window.headlessProductFacet.toggleSelect({
              value: product,
              state: 'selected',
            });
            return null;
          }
          return advancedQuery;
        })
        .filter(Boolean)
        .join(' OR ')}`;
      const topicsQuery = selectedTopics.length > 1 && topicQueryItems ? `(${topicQueryItems})` : topicQueryItems;
      if (window.headlessBaseSolutionQuery) {
        query = topicsQuery
          ? `(${window.headlessBaseSolutionQuery} AND ${topicsQuery})`
          : window.headlessBaseSolutionQuery;
      } else {
        query = topicsQuery;
      }
    }
    dispatchCoveoAdvancedQuery({ query, fireSelection, resetPage, targetPageNumber });
  } else {
    document.removeEventListener(COVEO_SEARCH_CUSTOM_EVENTS.READY, reInitTopicSelection);
    document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.READY, reInitTopicSelection);
  }
}
