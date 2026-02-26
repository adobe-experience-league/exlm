import { decorateIcons } from '../../scripts/lib-franklin.js';

// Helper function to create card image
function createCardImage(picture, altText) {
  if (!picture) return null;
  const imageWrapper = document.createElement('div');
  imageWrapper.classList.add('grid-card-image');
  const img = picture.querySelector('img');
  if (img && altText) {
    img.alt = altText;
  }
  imageWrapper.appendChild(picture);
  return imageWrapper;
}

// Helper function to create card title
function createCardTitle(heading) {
  if (!heading) return null;
  heading.classList.add('grid-card-title');
  return heading;
}

// Helper function to create card description
function createCardDescription(description) {
  if (!description?.textContent.trim()) return null;
  const desc = document.createElement('div');
  desc.classList.add('grid-card-description');
  desc.innerHTML = description.innerHTML || description.textContent;
  return desc;
}

// Helper function to create card CTA - reuses existing anchor if available
function createCardCTA(ctaTextCell, ctaLinkCell) {
  const existingAnchor = ctaLinkCell?.querySelector('a');
  const ctaText = ctaTextCell?.textContent.trim();

  if (!existingAnchor || !existingAnchor.href) return null;

  // If CTA text is provided, use it; otherwise keep the anchor's existing text
  if (ctaText) {
    existingAnchor.textContent = ctaText;
  }

  existingAnchor.classList.add('grid-card-cta', 'button');
  return existingAnchor;
}

export default function decorate(block) {
  const children = [...block.children];

  // First 4 rows are block header (eyebrow, title, description, variant)
  const [eyebrowRow, titleRow, descRow, variantRow, ...cardRows] = children;

  // Get variant from fourth row
  const variant = variantRow?.textContent.trim().toLowerCase() || 'card-v1';
  block.classList.add(variant);

  // Create header wrapper div
  const headerDiv = document.createElement('div');
  headerDiv.classList.add('grid-cards-header');

  // Process block eyebrow
  if (eyebrowRow) {
    const eyebrowText = eyebrowRow.textContent.trim();
    if (eyebrowText) {
      const eyebrow = document.createElement('p');
      eyebrow.classList.add('grid-cards-eyebrow');
      eyebrow.textContent = eyebrowText;
      headerDiv.appendChild(eyebrow);
    }
    eyebrowRow.remove();
  }

  // Process block title
  if (titleRow) {
    const heading = titleRow.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      heading.classList.add('grid-cards-title');
      headerDiv.appendChild(heading);
    }
    titleRow.remove();
  }

  // Process block description
  if (descRow) {
    const desc = descRow.querySelector('div');
    if (desc && desc.textContent.trim()) {
      desc.classList.add('grid-cards-description');
      headerDiv.appendChild(desc);
    }
    descRow.remove();
  }

  // Remove variant row after adding class to block
  if (variantRow) {
    variantRow.remove();
  }

  // Add header div to block if it has content
  if (headerDiv.children.length > 0) {
    block.appendChild(headerDiv);
  }

  // Create cards container
  const cardsContainer = document.createElement('div');
  cardsContainer.classList.add('grid-cards-container');

  // Process each card based on variant
  cardRows.forEach((cardRow) => {
    cardRow.classList.add('grid-card');

    const cells = [...cardRow.children];
    const [titleCell, descCell, imageCell, ctaTextCell, ctaLinkCell] = cells;

    // Get card elements
    const picture = imageCell?.querySelector('picture');
    const heading = titleCell?.querySelector('h1, h2, h3, h4, h5, h6');
    const description = descCell?.querySelector('div') || descCell;

    // Clear card
    cardRow.textContent = '';

    if (variant === 'card-v1') {
      // card-v1: Only title, description, and CTA (no image)
      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('grid-card-content');

      const title = createCardTitle(heading);
      const desc = createCardDescription(description);
      const cta = createCardCTA(ctaTextCell, ctaLinkCell);

      if (title) contentWrapper.appendChild(title);
      if (desc) contentWrapper.appendChild(desc);
      if (cta) contentWrapper.appendChild(cta);

      cardRow.appendChild(contentWrapper);
    } else if (variant === 'card-v2') {
      // card-v2: Image on top, then title, description, and CTA
      const image = createCardImage(picture);

      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('grid-card-content');

      const title = createCardTitle(heading);
      const desc = createCardDescription(description);
      const cta = createCardCTA(ctaTextCell, ctaLinkCell);

      if (title) contentWrapper.appendChild(title);
      if (desc) contentWrapper.appendChild(desc);
      if (cta) contentWrapper.appendChild(cta);

      if (image) cardRow.appendChild(image);
      cardRow.appendChild(contentWrapper);
    } else if (variant === 'card-v3') {
      // card-v3: Horizontal - image on left, title and description on right - whole card is clickable
      const image = createCardImage(picture);

      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('grid-card-content');

      const title = createCardTitle(heading);
      const desc = createCardDescription(description);

      if (title) contentWrapper.appendChild(title);
      if (desc) contentWrapper.appendChild(desc);

      // Get the existing anchor and use its href
      const existingAnchor = ctaLinkCell?.querySelector('a');
      if (existingAnchor && existingAnchor.href) {
        // Clear the existing content and reuse the anchor element
        existingAnchor.textContent = '';
        existingAnchor.classList.add('grid-card-link');

        if (image) existingAnchor.appendChild(image);
        existingAnchor.appendChild(contentWrapper);
        cardRow.appendChild(existingAnchor);
      }
    }

    // Add card to container
    cardsContainer.appendChild(cardRow);
  });

  // Add container to block
  block.appendChild(cardsContainer);

  decorateIcons(block);
}
