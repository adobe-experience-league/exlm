import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
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
const contentType = [
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
].map((role) => ({
  ...role,
  ...(placeholders[`filterContentType${role.id}Title`] && { title: placeholders[`filterContentType${role.id}Title`] }),
  ...(placeholders[`filterContentType${role.id}Description`] && {
    description: placeholders[`filterContentType${role.id}Description`],
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

export const roleOptions = {
  name: 'Role',
  items: roles,
  selected: 0,
};

export const contentTypeOptions = {
  name: 'Content Type',
  items: contentType,
  selected: 0,
};

export const expTypeOptions = {
  name: 'Experience Level',
  items: expLevel,
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

  return {
    query: parsedSolutionsInfo.length > 1 ? `(${query})` : query,
    products: solutionInfo.map(({ product }) => product.toLowerCase()),
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
  return subFacets.reduce(
    (acc, curr) => {
      const { value: facetValue, state } = curr;
      acc.push({
        state: value ? state : 'idle',
        value: `${type}|${facetValue}`,
      });
      return acc;
    },
    [
      {
        state: 'idle',
        value: type,
      },
    ],
  );
};
