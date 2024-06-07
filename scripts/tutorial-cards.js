import { buildCard } from './browse-card/browse-card.js';
import { CONTENT_TYPES } from './browse-card/browse-cards-constants.js';

export default function decorate() {
  // Select the main content section of the page
  const mainDoc = document.querySelector('main > div.content-section-last');

  // Create a new div element to contain the tutorial cards
  const container = document.createElement('div');
  container.classList.add('tutorial-cards');

  // Create an anchor element to append the card
  const a = document.createElement('a');
  a.href = '#';
  container.appendChild(a);

  // Define the models for the tutorial cards
  const model1= {
    thumbnail: '#',
    product: ['Target'],
    title: 'Migrate Target from at.js to Platform Web SDK',
    description:'Learn how to migrate your at.js implementeation to Adobe Expeirence...',
    contentType: CONTENT_TYPES.TUTORIAL.LABEL,
    badgeTitle: CONTENT_TYPES.TUTORIAL.LABEL,
    inProgressStatus: '',
    viewLink: 'https://www.google.com',
    copyLink: 'https://www.google.com',
    viewLinkText: 'View Tutorial'
  };

  const model2= {
    thumbnail: '#',
    product: ['Analytics'],
    title: 'Training Tutorial Template in Analysis Workspace',
    description:'The Analysis Workspace Training Tutorial walks users through...',
    contentType: CONTENT_TYPES.TUTORIAL.LABEL,
    badgeTitle: CONTENT_TYPES.TUTORIAL.LABEL,
    inProgressStatus: '',
    viewLink: 'https://www.google.com',
    copyLink: 'https://www.google.com',
    viewLinkText: 'View Tutorial'
  };

  const model3= {
    thumbnail: '#',
    product: ['Journey Optimizer'],
    title: 'CREATE a campaign',
    description:'Learn how to deliver one-time content to a specific audience by executing actions immediately, or...',
    contentType: CONTENT_TYPES.TUTORIAL.LABEL,
    badgeTitle: CONTENT_TYPES.TUTORIAL.LABEL,
    inProgressStatus: '',
    viewLink: 'https://www.google.com',
    copyLink: 'https://www.google.com',
    viewLinkText: 'View Tutorial'
  };

  // Build the tutorial cards
  buildCard(container, a, model1);
  buildCard(container, a, model2);
  buildCard(container, a, model3);

  // Append the tutorial cards to the main content section
  mainDoc.appendChild(container);
}