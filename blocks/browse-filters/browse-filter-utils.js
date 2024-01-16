export const roles = [
  {
    title: 'Business User',
    value: 'User',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Developer',
    value: 'Developer',
    description: 'Responsible for nothing until there"s an issue.',
  },
  {
    title: 'Administrator',
    value: 'Admin',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Business Leader',
    value: 'Leader',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
];

export const contentType = [
  {
    title: 'Certification',
    value: 'Certification',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Community',
    value: 'Community',
    description: 'Responsible for nothing until there"s an issue.',
  },
  {
    title: 'Courses',
    value: 'Courses',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Documentation',
    value: 'Documentation',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'On-Demand Events',
    value: 'On-Demand Events',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Troubleshooting',
    value: 'Troubleshooting',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Tutorial',
    value: 'Tutorial',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
];

export const expLevel = [
  {
    title: 'Beginner',
    value: 'Beginner',
    description: 'I am a beginner',
  },
  {
    title: 'Intermediate',
    value: 'Intermediate',
    description: 'I am an intermediate',
  },
  {
    title: 'Experienced',
    value: 'Experienced',
    description: 'I have some experience',
  },
];

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
