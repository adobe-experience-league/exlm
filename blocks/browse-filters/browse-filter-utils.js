export const roles = [
  {
    title: 'Business User',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Developer',
    description: 'Responsible for nothing until there"s an issue.',
  },
  {
    title: 'Administrator',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Business Leader',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
];

export const contentType = [
  {
    title: 'Certification',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Community',
    description: 'Responsible for nothing until there"s an issue.',
  },
  {
    title: 'Courses',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Documentation',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'On-Demand Events',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Troubleshooting',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Tutorial',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
];

export const expLevel = [
  {
    title: 'Beginner',
    description: 'I am a beginner',
  },
  {
    title: 'Intermediate',
    description: 'I am an intermediate',
  },
  {
    title: 'Experienced',
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

// Function to get an object by name
export function getObjectByName(obj, name) {
  return obj.find((option) => option.name === name);
}
