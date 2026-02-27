import { decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';

export default function decorate(block) {
  const children = [...block.children];

  const [eyebrowRow, titleRow, descRow, ...cardRows] = children;

  const headerDiv = document.createElement('div');
  headerDiv.classList.add('grid-cards-header');

  if (eyebrowRow) {
    const eyebrowText = eyebrowRow.textContent.trim();
    if (eyebrowText) {
      const eyebrow = htmlToElement(`<p class="grid-cards-eyebrow">${eyebrowText}</p>`);
      headerDiv.appendChild(eyebrow);
    }
    eyebrowRow.remove();
  }

  if (titleRow) {
    const titleText = titleRow.textContent.trim();
    if (titleText) {
      const heading = htmlToElement(`<h2 class="grid-cards-title">${titleText}</h2>`);
      headerDiv.appendChild(heading);
    }
    titleRow.remove();
  }

  if (descRow) {
    const desc = descRow.querySelector('div');
    if (desc && desc.textContent.trim()) {
      desc.classList.add('grid-cards-description');
      headerDiv.appendChild(desc);
    }
    descRow.remove();
  }

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
    const description = descCell?.querySelector('div') || descCell;

    cardRow.textContent = '';

    if (block.classList.contains('minimal')) {
      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('grid-card-content');

      const title = titleCell?.querySelector('div') || titleCell;
      if (title?.textContent.trim()) {
        title.classList.add('grid-card-title');
        contentWrapper.appendChild(title);
      }

      if (description?.textContent.trim()) {
        description.classList.add('grid-card-description');
        contentWrapper.appendChild(description);
      }

      if (ctaCell) {
        ctaCell.classList.add('grid-card-cta');
        ctaCell.innerHTML = decorateCustomButtons(ctaCell);
        contentWrapper.appendChild(ctaCell);
      }

      cardRow.appendChild(contentWrapper);
    } else if (block.classList.contains('standard')) {
      if (picture) {
        picture.classList.add('grid-card-image');
      }

      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('grid-card-content');

      const title = titleCell?.querySelector('div') || titleCell;
      if (title?.textContent.trim()) {
        title.classList.add('grid-card-title');
        contentWrapper.appendChild(title);
      }

      if (description?.textContent.trim()) {
        description.classList.add('grid-card-description');
        contentWrapper.appendChild(description);
      }

      if (ctaCell) {
        ctaCell.classList.add('grid-card-cta');
        ctaCell.innerHTML = decorateCustomButtons(ctaCell);
        contentWrapper.appendChild(ctaCell);
      }

      if (picture) cardRow.appendChild(picture);
      cardRow.appendChild(contentWrapper);
    } else if (block.classList.contains('wide')) {
      if (picture) {
        picture.classList.add('grid-card-image');
      }

      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('grid-card-content');

      const title = titleCell?.querySelector('div') || titleCell;
      if (title?.textContent.trim()) {
        title.classList.add('grid-card-title');
        contentWrapper.appendChild(title);
      }

      if (description?.textContent.trim()) {
        description.classList.add('grid-card-description');
        contentWrapper.appendChild(description);
      }

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
