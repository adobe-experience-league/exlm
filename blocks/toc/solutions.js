const solutionMap = new Map([
  ['Acrobat', { class: 'acrobat-dc', name: 'Acrobat' }],
  ['Acrobat Services', { class: 'DocumentCloud', name: 'Acrobat Services' }],
  ['Acrobat Sign', { class: 'adobe-sign', name: 'Acrobat Sign' }],
  ['Admin', { class: 'AdminConsole', name: 'Admin' }],
  ['Advertising', { class: 'CircleAdvertisingCloud', name: 'Advertising' }],
  ['Analytics', { class: 'DataAnalytics', name: 'Analytics' }],
  ['Audience Manager', { class: 'UserHighlight', name: 'Audience Manager' }],
  ['Campaign', { class: 'EmailSend', name: 'Campaign' }],
  ['Campaign Classic', { class: 'EmailSend', name: 'Campaign Classic' }],
  ['Campaign Classic v7', { class: 'EmailSend', name: 'Campaign Classic v7' }],
  ['Campaign Standard', { class: 'EmailSend', name: 'Campaign Standard' }],
  ['Campaign v8', { class: 'EmailSend', name: 'Campaign v8' }],
  ['Commerce', { class: 'Commerce', name: 'Commerce' }],
  ['Commerce Intelligence', { class: 'Commerce', name: 'Commerce Intelligence' }],
  ['Commerce Marketplace', { class: 'Commerce', name: 'Commerce Marketplace' }],
  ['Connect', { class: 'CircleExperienceCloud', name: 'Connect' }],
  ['Creative Cloud', { class: 'CircleExperienceCloud', name: 'Creative Cloud' }],
  ['Customer Experience Management', { class: 'ExperienceManager', name: 'Customer Experience Management' }],
  ['Customer Journey Analytics', { class: 'JourneyOrchestration', name: 'Customer Journey Analytics' }],
  ['Data Collection', { class: 'Launch', name: 'Data Collection' }],
  ['Document Cloud', { class: 'CircleExperienceCloud', name: 'Document Cloud' }],
  ['Dynamic Media Classic', { class: 'Asset', name: 'Dynamic Media Classic' }],
  ['Experience Cloud', { class: 'CircleExpCloud', name: 'Experience Cloud' }],
  ['Experience Cloud Services', { class: 'CircleExpCloud', name: 'Experience Cloud Services' }],
  ['Experience Manager', { class: 'ExperienceManager', name: 'Experience Manager' }],
  ['Experience Manager 6.4', { class: 'ExperienceManager', name: 'Experience Manager 6.4' }],
  ['Experience Manager 6.5', { class: 'ExperienceManager', name: 'Experience Manager 6.5' }],
  ['Experience Manager Assets', { class: 'Assets', name: 'Experience Manager Assets' }],
  ['Experience Manager Cloud Manager', { class: 'CircleExperienceCloud', name: 'Experience Manager Cloud Manager' }],
  ['Experience Manager Forms', { class: 'ExperienceManager', name: 'Experience Manager Forms' }],
  ['Experience Manager Guides', { class: 'ExperienceManager', name: 'Experience Manager Guides' }],
  ['Experience Manager Learn', { class: 'ExperienceManager', name: 'Experience Manager Learn' }],
  ['Experience Manager Screens', { class: 'ExperienceManager', name: 'Experience Manager Screens' }],
  ['Experience Manager Sites', { class: 'ExperienceManager', name: 'Experience Manager Sites' }],
  [
    'Experience Manager as a Cloud Service',
    { class: 'ExperienceManager', name: 'Experience Manager as a Cloud Service' },
  ],
  ['Experience Platform', { class: 'CircleExperiencePlatform', name: 'Experience Platform' }],
  ['General', { class: 'CircleExpCloud', name: 'General' }],
  ['Journey Optimizer', { class: 'JourneyOrchestration', name: 'Journey Optimizer' }],
  ['Journey Orchestration', { class: 'JourneyOrchestration', name: 'Journey Orchestration' }],
  ['Learning Manager', { class: 'ContentProfile', name: 'Learning Manager' }],
  ['Magento Business Intelligence', { class: 'CircleExperienceCloud', name: 'Magento Business Intelligence' }],
  ['Marketo', { class: 'MarketoEngage', name: 'Marketo' }],
  ['Marketo Engage', { class: 'MarketoEngage', name: 'Marketo Engage' }],
  ['Marketo Measure', { class: 'MarketoEngage', name: 'Marketo Measure' }],
  ['Order Management', { class: 'CircleExpCloud', name: 'Order Management' }],
  ['PWA Studio', { class: 'CircleExpCloud', name: 'PWA Studio' }],
  ['Primetime', { class: 'Primetime', name: 'Primetime' }],
  ['Real-Time Customer Data Platform', { class: 'CircleExpCloud', name: 'Real-Time Customer Data Platform' }],
  ['Real-time Customer Data Platform', { class: 'CircleExpCloud', name: 'Real-time Customer Data Platform' }],
  ['Sensei', { class: 'CircleExpCloud', name: 'Sensei' }],
  ['Target', { class: 'target', name: 'Target' }],
  ['Workfront', { class: 'WorkfrontCircle', name: 'Workfront' }],
  ['default', { class: 'CircleExpCloud', name: 'Experience Cloud' }],
]);

/**
 * getSolutionName - Sets the name and class of an element based on a given solution name.
 * @param {string} solution - The name of the solution.
 * @returns {object} - The name and class of the solution.
 */
export default function getSolutionName(solution) {
  // Validate input
  if (typeof solution !== 'string') {
    throw new TypeError('Solution name must be a string');
  }

  // Split the solution name coma separated values
  const solutionArray = solution.split(',');
  const solutionData = solutionArray[0].trim();
  const elSolution = solutionMap.get(solutionData) || solutionMap.get('default');

  return elSolution;
}
