import { buildCard } from './browse-card/browse-card.js';
import { CONTENT_TYPES } from './browse-card/browse-cards-constants.js';

export default function decprate() {
  const mainDoc = document.querySelector('main > div.content-section-last');
  const container = document.createElement('div');
  container.classList.add('tutorial-cards');

  // anchor
  const a = document.createElement('a');
  a.href = '#';
  container.appendChild(a);

  buildCard(container, container, {
    thumbnail: '#',
    product: ['Analytics'],
    title: 'How to create repor',
    contentType: CONTENT_TYPES.TUTORIAL.LABEL,
    badgeTitle: CONTENT_TYPES.TUTORIAL.LABEL,
    inProgressStatus: '',
    viewLink: 'https://www.google.com',
  });

  mainDoc.appendChild(container);
}
