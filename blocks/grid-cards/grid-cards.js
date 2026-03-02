import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';

export default function decorate(block) {
  const children = [...block.children];
  const [eyebrowRow, titleRow, descRow, ...cardRows] = children;

  // Create header section for block
  const headerDiv = document.createElement('div');
  headerDiv.classList.add('grid-cards-header');
  eyebrowRow.classList.add('grid-cards-eyebrow');

  const headingTag = document.createElement('h2');
  headingTag.classList.add('grid-cards-title');
  headingTag.innerHTML = titleRow.textContent;
  titleRow.replaceWith(headingTag);

  descRow.classList.add('grid-cards-description');
  headerDiv.append(eyebrowRow, headingTag, descRow);

  if (headerDiv.children.length > 0) {
    block.appendChild(headerDiv);
  }

  // Create card container and populate with cards
  const cardsContainer = document.createElement('div');
  cardsContainer.classList.add('grid-card-container');
  const isWide = block.classList.contains('wide');
  const isStandard = block.classList.contains('standard');

  cardRows.forEach((cardRow) => {
    cardRow.classList.add('grid-card');
    const [titleCell, descCell, imageCell, ctaCell] = cardRow.children;
    const picture = imageCell?.querySelector('picture');

    cardRow.textContent = '';

    const cardHeading = document.createElement('h3');
    cardHeading.classList.add('grid-card-title');
    cardHeading.innerHTML = titleCell.textContent;

    descCell.classList.add('grid-card-description');

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('grid-card-content');
    contentWrapper.append(cardHeading, descCell);

    // Add picture to card if it's a wide or standard card, and add appropriate classes
    if ((isWide || isStandard) && picture) {
      picture.classList.add('grid-card-image');
    }

    // add cta button if its not a wide card
    if (!isWide) {
      ctaCell.classList.add('grid-card-cta');
      ctaCell.innerHTML = decorateCustomButtons(ctaCell);
      contentWrapper.appendChild(ctaCell);
    }

    // create clickable wrapper for wide card
    if (isWide) {
      const anchor = ctaCell?.querySelector('a');
      if (anchor?.href) {
        anchor.textContent = '';
        anchor.classList.add('grid-card-link');
        if (picture) anchor.appendChild(picture);
        anchor.appendChild(contentWrapper);
        cardRow.appendChild(anchor);
      }
    } else {
      if (isStandard && picture) cardRow.appendChild(picture);
      cardRow.appendChild(contentWrapper);
    }

    cardsContainer.appendChild(cardRow);
  });

  block.appendChild(cardsContainer);
  decorateIcons(block);
}
