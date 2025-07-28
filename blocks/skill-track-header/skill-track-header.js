import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { getMetadata } from '../../scripts/scripts.js';

/**
 * Decorates the skill track header block
 * @param {Element} block The skill track header block element
 */
export default function decorate(block) {
  // Add main container class
  block.classList.add('skill-track-header-container');

  // Get all rows in the block
  const rows = [...block.children];

  // Create the skill track header
  const headerContainer = document.createElement('div');
  headerContainer.classList.add('skill-track-header');

  // Process title row
  const titleRow = rows[0];
  if (titleRow) {
    const titleCell = titleRow.querySelector(':scope > div');
    if (titleCell) {
      const title = titleCell.textContent.trim();
      const titleTypeCell = titleCell.nextElementSibling;
      let titleType = 'h1';

      if (titleTypeCell) {
        const titleTypeText = titleTypeCell.textContent.trim();
        if (titleTypeText && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(titleTypeText.toLowerCase())) {
          titleType = titleTypeText.toLowerCase();
        }
      }

      const titleEl = document.createElement(titleType);
      titleEl.classList.add('skill-track-title');
      titleEl.textContent = title;
      headerContainer.appendChild(titleEl);
    }
    titleRow.remove();
  }

  // Process description row
  const descriptionRow = rows[0]; // Now the first row after removing the title row
  if (descriptionRow) {
    const descriptionCell = descriptionRow.querySelector(':scope > div');
    if (descriptionCell) {
      const description = descriptionCell.innerHTML;
      const descriptionEl = document.createElement('div');
      descriptionEl.classList.add('skill-track-description');
      descriptionEl.innerHTML = description;
      headerContainer.appendChild(descriptionEl);
    }
    descriptionRow.remove();
  }

  // Add the header container to the block
  block.appendChild(headerContainer);
}
