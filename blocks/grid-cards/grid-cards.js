import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';

function createCardHeading(titleCell) {
  const cardHeading = document.createElement('h3');
  cardHeading.classList.add('grid-card-title');
  cardHeading.innerHTML = titleCell.textContent;
  titleCell.remove();
  return cardHeading;
}

export default function decorate(block) {
  const children = [...block.children];

  const [eyebrowRow, titleRow, descRow, ...cardRows] = children;

  const headerDiv = document.createElement('div');
  headerDiv.classList.add('grid-cards-header');
  eyebrowRow.classList.add('grid-cards-eyebrow');
  const headingTag = document.createElement('h2');
  headingTag.classList.add('grid-cards-title');
  headingTag.innerHTML = titleRow.textContent;
  titleRow.remove();
  descRow.classList.add('grid-cards-description');
  headerDiv.appendChild(eyebrowRow);
  headerDiv.appendChild(headingTag);
  headerDiv.appendChild(descRow);

  if (headerDiv.children.length > 0) {
    block.appendChild(headerDiv);
  }

  const cardsContainer = document.createElement('div');
  cardsContainer.classList.add('grid-card-container');

  cardRows.forEach((cardRow) => {
    cardRow.classList.add('grid-card');
    const cells = [...cardRow.children];
    const [titleCell, descCell, imageCell, ctaCell] = cells;
    const picture = imageCell?.querySelector('picture');
    cardRow.textContent = '';

    if (block.classList.contains('minimal')) {
      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('grid-card-content');
      const cardHeading = createCardHeading(titleCell);
      descCell.classList.add('grid-card-description');
      ctaCell.classList.add('grid-card-cta');
      ctaCell.innerHTML = decorateCustomButtons(ctaCell);
      contentWrapper.appendChild(cardHeading);
      contentWrapper.appendChild(descCell);
      contentWrapper.appendChild(ctaCell);
      cardRow.appendChild(contentWrapper);
    } else if (block.classList.contains('standard')) {
      picture.classList.add('grid-card-image');
      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('grid-card-content');
      const cardHeading = createCardHeading(titleCell);
      descCell.classList.add('grid-card-description');
      ctaCell.classList.add('grid-card-cta');
      ctaCell.innerHTML = decorateCustomButtons(ctaCell);
      contentWrapper.appendChild(cardHeading);
      contentWrapper.appendChild(descCell);
      contentWrapper.appendChild(ctaCell);
      if (picture) cardRow.appendChild(picture);
      cardRow.appendChild(contentWrapper);
    } else if (block.classList.contains('wide')) {
      picture.classList.add('grid-card-image');
      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('grid-card-content');
      const cardHeading = createCardHeading(titleCell);
      descCell.classList.add('grid-card-description');
      contentWrapper.appendChild(cardHeading);
      contentWrapper.appendChild(descCell);
      const existingAnchor = ctaCell?.querySelector('a');
      if (existingAnchor && existingAnchor.href) {
        existingAnchor.textContent = '';
        existingAnchor.classList.add('grid-card-link');
        if (picture) existingAnchor.appendChild(picture);
        existingAnchor.appendChild(contentWrapper);
        cardRow.appendChild(existingAnchor);
      }
    }
    cardsContainer.appendChild(cardRow);
  });

  block.appendChild(cardsContainer);
  decorateIcons(block);
}
