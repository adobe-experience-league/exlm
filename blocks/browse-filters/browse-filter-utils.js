import { fetchLanguagePlaceholders, isFeatureEnabled } from '../../scripts/scripts.js';
import { COMMUNITY_SEARCH_FACET } from '../../scripts/browse-card/browse-cards-constants.js';

const SUB_FACET_MAP = {
  Community: COMMUNITY_SEARCH_FACET,
};

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/**
 * Array containing roles with associated metadata.
 * Each role object includes a id, value, title and description.
 * The title and description are fetched from language placeholders or falls back to a default description.
 */
const roles = [
  {
    id: 'User',
    value: 'User',
    title: 'Business User',
    description:
      'Responsible for utilizing Adobe solutions to achieve daily job functions, complete tasks, and achieve business objectives.',
  },
  {
    id: 'Developer',
    value: 'Developer',
    title: 'Developer',
    description:
      "Responsible for engineering Adobe solutions' implementation, integration, data-modeling, data engineering, and other technical skills.",
  },
  {
    id: 'Admin',
    value: 'Admin',
    title: 'Administrator',
    description:
      'Responsible for the technical operations, configuration, permissions, management, and support needs of Adobe solutions.',
  },
  {
    id: 'Leader',
    value: 'Leader',
    title: 'Business Leader',
    description: 'Responsible for owning the digital strategy and accelerating value through Adobe solutions.',
  },
].map((role) => ({
  ...role,
  ...(placeholders[`filterRole${role.id}Title`] && { title: placeholders[`filterRole${role.id}Title`] }),
  ...(placeholders[`filterRole${role.id}Description`] && {
    description: placeholders[`filterRole${role.id}Description`],
  }),
}));

/**
 * Array containing contentType with associated metadata.
 * Each contentType object includes a id, value, title and description.
 * The title and description are fetched from language placeholders or falls back to a default description.
 */
const contentTypes = [
  {
    id: 'Certification',
    value: 'Certification',
    title: 'Certification',
    description: 'Credentials that recognize an individual’s skill and competency in an Adobe solution.',
  },
  {
    id: 'Community',
    value: 'Community',
    title: 'Community',
    description: 'Questions, answers, ideas, and expertise shared from Adobe customers and experts growing together.',
  },
  {
    id: 'Course',
    value: 'Course',
    title: 'Courses',
    description: 'Expertly curated collections designed to help you gain skills and advance your knowledge.',
  },
  {
    id: 'Documentation',
    value: 'Documentation',
    title: 'Documentation',
    description:
      'Developer guides, technical articles, and release notes created for implementation and management of Adobe solutions.',
  },
  {
    id: 'Event',
    value: 'Event',
    title: 'On-Demand Events',
    description: 'Recordings of learning and skill enablement events. Watch and learn from Adobe experts and peers.',
  },
  {
    id: 'Perspective',
    value: 'Perspective',
    title: 'Perspectives',
    description: 'Real-world inspiration from Experience Cloud customers and Adobe experts.',
    disabled: !isFeatureEnabled('perspectives'),
  },
  {
    id: 'Troubleshooting',
    value: 'Troubleshooting',
    title: 'Troubleshooting',
    description: 'Answers to common Adobe solution questions with detailed guidance.',
  },
  {
    id: 'Tutorial',
    value: 'Tutorial',
    title: 'Tutorial',
    description:
      'Brief instructional material with step-by-step instructions to learn a specific skill or accomplish a specific task.',
  },
]
  .filter((type) => !type.disabled)
  .map((contentType) => ({
    ...contentType,
    ...(placeholders[`filterContentType${contentType.id}Title`] && {
      title: placeholders[`filterContentType${contentType.id}Title`],
    }),
    ...(placeholders[`filterContentType${contentType.id}Description`] && {
      description: placeholders[`filterContentType${contentType.id}Description`],
    }),
  }));

/**
 * Array containing expLevel (Experience Level) with associated metadata.
 * Each contentType object includes a id, value, title and description.
 * The title and description are fetched from language placeholders or falls back to a default description.
 */
const expLevel = [
  {
    id: 'Beginner',
    value: 'Beginner',
    title: 'Beginner',
    description: 'Minimal experience and foundational understanding of a subject.',
  },
  {
    id: 'Intermediate',
    value: 'Intermediate',
    title: 'Intermediate',
    description: 'Moderate level of expertise, with some understanding of core concepts and skills.',
  },
  {
    id: 'Experienced',
    value: 'Experienced',
    title: 'Experienced',
    description:
      'High degree of proficiency with an advanced understanding of concepts and skill. Regularly manages complex tasks and objectives.',
  },
].map((role) => ({
  ...role,
  ...(placeholders[`filterExpLevel${role.id}Title`] && { title: placeholders[`filterExpLevel${role.id}Title`] }),
  ...(placeholders[`filterExpLevel${role.id}Description`] && {
    description: placeholders[`filterExpLevel${role.id}Description`],
  }),
}));

const authorTypes = [
  {
    id: 'internal',
    value: 'Adobe',
    title: 'Adobe',
    description: 'Content created by Adobe employees',
  },
  {
    id: 'external',
    value: 'External',
    title: 'External',
    description: 'Content created by expert Experience Cloud customers',
  },
].map((authorType) => ({
  ...authorType,
  ...(placeholders[`filterAuthorType${authorType.id}Title`] && {
    title: placeholders[`filterAuthorType${authorType.id}Title`],
  }),
  ...(placeholders[`filterAuthorType${authorType.id}Description`] && {
    description: placeholders[`filterAuthorType${authorType.id}Description`],
  }),
}));

export const roleOptions = {
  id: 'el_role',
  name: placeholders.filterRoleLabel || 'Role',
  items: roles,
  selected: 0,
};

export const contentTypeOptions = {
  id: 'el_contenttype',
  name: placeholders.filterContentTypeLabel || 'Content Type',
  items: contentTypes,
  selected: 0,
};

export const expTypeOptions = {
  id: 'el_level',
  name: placeholders.filterExperienceLevelLabel || 'Experience Level',
  items: expLevel,
  selected: 0,
};

export const productTypeOptions = {
  id: 'el_product',
  name: placeholders.filterProductLabel || 'Product',
  items: expLevel,
  selected: 0,
};

export const authorOptions = {
  id: 'author_type',
  name: placeholders.filterAuthorLabel || 'Author Type',
  items: authorTypes,
  selected: 0,
};

const FILTER_RESULTS_COUNT = {
  MOBILE: 4,
  IPAD: 8,
  DESKTOP: 16,
};

// Function to get an object by name
export function getObjectByName(obj, name) {
  return obj.find((option) => option.name === name);
}

export function getObjectById(obj, ID) {
  return obj.find((option) => option.id === ID);
}

export const getFiltersPaginationText = (pgCount) => `of ${pgCount} page${pgCount > 1 ? 's' : ''}`;

export const getBrowseFiltersResultCount = () => {
  let resultCount = FILTER_RESULTS_COUNT.MOBILE;
  if (window.matchMedia('(min-width:900px)').matches) {
    resultCount = FILTER_RESULTS_COUNT.DESKTOP;
  } else if (window.matchMedia('(min-width:600px)').matches) {
    resultCount = FILTER_RESULTS_COUNT.IPAD;
  }
  return resultCount;
};

export const getSelectedTopics = (filterInfo) => {
  if (!filterInfo) {
    return [];
  }
  const solutionsCheck = filterInfo.match(/@el_solution=("[^"]*")/g) ?? [];
  const featuresCheck = filterInfo.match(/@el_features=("[^"]*")/g) ?? [];
  const selectedTopics = featuresCheck.concat(solutionsCheck).reduce((acc, curr) => {
    const [, featureName] = curr.split('=');
    if (featureName) {
      acc.push(featureName.trim().replace(/"/g, ''));
    }
    return acc;
  }, []);
  return selectedTopics;
};

export const getParsedSolutionsQuery = (solutionTags) => {
  const solutionInfo = solutionTags.map((tag) => {
    const [, product, version] = tag.split('/');
    return { product, version };
  });

  const isSubSolution = (parent, child) => child.product.includes(parent.product) && parent.product !== child.product;

  const filteredSolutions = solutionInfo.filter((solution) => {
    const hasChild = solutionInfo.some((sol) => isSubSolution(solution, sol));
    return !hasChild;
  });

  const parsedSolutionsInfo = filteredSolutions.map((solution) => {
    if (!solution.version) {
      const parentSolution = solutionInfo.find((sol) => isSubSolution(sol, solution));
      solution.version = parentSolution?.version;
    }
    return solution;
  });

  const query = parsedSolutionsInfo
    .map(({ product, version }) => `(@el_product="${product}"${version ? ` AND @el_version="${version}"` : ''})`)
    .join(' OR ');
  const [parsedSolutionInfo = {}] = parsedSolutionsInfo;
  const { product: productKey = '' } = parsedSolutionInfo;

  return {
    query: parsedSolutionsInfo.length > 1 ? `(${query})` : query,
    products: solutionInfo.map(({ product }) => product.toLowerCase()),
    productKey,
  };
};

export const getCoveoFacets = (type, value) => {
  const subFacets = SUB_FACET_MAP[type];
  if (!subFacets) {
    return [
      {
        state: value ? 'selected' : 'idle',
        value: type,
      },
    ];
  }
  return subFacets.reduce((acc, curr) => {
    const { value: facetValue, state } = curr;
    acc.push({
      state: value ? state : 'idle',
      value: `${type}|${facetValue}`,
    });
    return acc;
  }, []);
};

export function hideSearchSuggestions(e) {
  const browseFilterSearchSection = document.querySelector('.browse-filters-search');
  const searchInputEl = browseFilterSearchSection.querySelector('input.search-input');
  const searchSuggestionsPopoverEl = browseFilterSearchSection.querySelector('.search-suggestions-popover');
  let hideSuggestions = false;
  if (e.key === 'Escape') {
    hideSuggestions = true;
    e.stopPropagation();
  } else if (!e.key) {
    hideSuggestions = e.target && !searchInputEl.contains(e.target) && !searchSuggestionsPopoverEl.contains(e.target);
  }
  if (hideSuggestions) {
    searchInputEl.classList.remove('suggestion-interactive');
    // eslint-disable-next-line no-use-before-define
    toggleSearchSuggestionsVisibility(false);
  }
}

export function toggleSearchSuggestionsVisibility(show) {
  const searchSuggestionsPopoverEl = document.querySelector('.browse-filters-search .search-suggestions-popover');
  if (!searchSuggestionsPopoverEl) {
    return;
  }
  if (show) {
    searchSuggestionsPopoverEl.classList.add('search-suggestions-popover-visible');
    document.addEventListener('keydown', hideSearchSuggestions);
    document.addEventListener('click', hideSearchSuggestions);
  } else {
    searchSuggestionsPopoverEl.classList.remove('search-suggestions-popover-visible');
    document.removeEventListener('keydown', hideSearchSuggestions);
    document.removeEventListener('click', hideSearchSuggestions);
  }
}

export function showSearchSuggestionsOnInputClick() {
  const searchBlock = document.querySelector('.browse-filters-search');
  const searchSuggestionsPopoverEl = searchBlock?.querySelector('.search-suggestions-popover');
  if (
    !searchSuggestionsPopoverEl ||
    searchSuggestionsPopoverEl.classList.contains('search-suggestions-popover-visible')
  ) {
    return;
  }
  const searchInputEl = searchBlock?.querySelector('.search-input');
  if (searchInputEl) {
    searchInputEl.classList.add('suggestion-interactive');
  }
  toggleSearchSuggestionsVisibility(true);
}

export const handleCoverSearchSubmit = (targetSearchText) => {
  const [currentSearchString] = window.location.hash.match(/\bq=([^&#]*)/) || [];
  if (currentSearchString) {
    window.location.hash = window.location.hash.replace(currentSearchString, `q=${targetSearchText || ''}`);
  } else {
    window.location.hash = `#q=${targetSearchText || ''}&${window.location.hash.slice(1)}`;
  }
};

/**
 * Gets perspectiveIndex object.
 * @param {string} [prefix] Location of perspectiveIndex
 * @returns {object} Window perspectiveIndex object
 */
export async function fetchPerspectiveIndex(prefix = 'en') {
  window.perspectiveIndex = window.perspectiveIndex || {};
  const loaded = window.perspectiveIndex[`${prefix}-loaded`];
  if (!loaded) {
    window.perspectiveIndex[`${prefix}-loaded`] = new Promise((resolve, reject) => {
      const url = `/${prefix}/perspective-index.json`;
      fetch(url)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          window.perspectiveIndex[prefix] = [];
          return {};
        })
        .then((json) => {
          window.perspectiveIndex[prefix] = json?.data ?? [];
          resolve(json?.data ?? []);
        })
        .catch((error) => {
          window.perspectiveIndex[prefix] = [];
          reject(error);
        });
    });
  }
  await window.perspectiveIndex[`${prefix}-loaded`];
  return window.perspectiveIndex[prefix];
}
