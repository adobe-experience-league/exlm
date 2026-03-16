import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';

export default function decorate(block) {
  const children = [...block.children];
  const [eyebrowRow, titleRow, descRow, ...cardRows] = children;

  // Create header section for block only if at least one element has content
  const hasEyebrow = eyebrowRow.textContent.trim();
  const hasTitle = titleRow.textContent.trim();
  const hasDesc = descRow.textContent.trim();

  if (hasEyebrow || hasTitle || hasDesc) {
    const headerDiv = document.createElement('div');
    headerDiv.classList.add('grid-cards-header');

    if (hasEyebrow) {
      eyebrowRow.classList.add('grid-cards-eyebrow');
      headerDiv.appendChild(eyebrowRow);
    } else {
      eyebrowRow.remove();
    }

    if (hasTitle) {
      const headingTag = document.createElement('h2');
      headingTag.classList.add('grid-cards-title', 'h1');
      headingTag.innerHTML = titleRow.textContent;
      titleRow.replaceWith(headingTag);
      headerDiv.appendChild(headingTag);
    } else {
      titleRow.remove();
    }

    if (hasDesc) {
      descRow.classList.add('grid-cards-description');
      headerDiv.appendChild(descRow);
    } else {
      descRow.remove();
    }

    block.appendChild(headerDiv);
  } else {
    eyebrowRow.remove();
    titleRow.remove();
    descRow.remove();
  }

  // Create card container and populate with cards
  const cardsContainer = document.createElement('div');
  cardsContainer.classList.add('grid-card-container');
  const isWide = block.classList.contains('wide');
  const isStandard = block.classList.contains('standard');

  cardRows.forEach((cardRow, index) => {
    cardRow.classList.add('grid-card', 'glass-bg');
    cardRow.dataset.cardPosition = index + 1;
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
    if (!isWide && ctaCell) {
      const anchor = ctaCell.querySelector('a');

      if (anchor) {
        const text = anchor.textContent.trim();
        const href = anchor.getAttribute('href')?.trim();

        // Only show CTA if author provided real label text
        if (text && href && text !== href) {
          ctaCell.classList.add('grid-card-cta');
          ctaCell.innerHTML = decorateCustomButtons(ctaCell);
          contentWrapper.appendChild(ctaCell);
        }
      }
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

        // Add componentClick tracking for wide variant
        anchor.addEventListener('click', async () => {
          const { pushComponentClick, generateComponentID } = await import('../../scripts/analytics/lib-analytics.js');
          const componentID = generateComponentID(block, 'grid-cards');

          pushComponentClick({
            component: 'grid-cards',
            componentID,
            linkTitle: cardHeading.textContent.trim(),
            linkType: cardHeading.textContent.trim(),
            destinationDomain: anchor.href,
            position: index + 1,
          });
        });
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
