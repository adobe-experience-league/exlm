import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { getMetadata } from '../../scripts/scripts.js';

/**
 * Decorates the lesson block
 * @param {Element} block The lesson block element
 */
export default function decorate(block) {
  // Add main container class
  block.classList.add('lesson-container');

  // Get all rows in the block
  const rows = [...block.children];

  // Process the lesson content
  const lessonContainer = document.createElement('div');
  lessonContainer.classList.add('lesson-content');

  // Get title from first row
  const titleRow = rows[0];
  if (titleRow) {
    const titleCell = titleRow.querySelector(':scope > div');
    if (titleCell) {
      const title = titleCell.textContent.trim();
      const titleEl = document.createElement('h3');
      titleEl.classList.add('lesson-title');
      titleEl.textContent = title;
      lessonContainer.appendChild(titleEl);
    }
  }

  // Get URL from second row
  const urlRow = rows[1];
  if (urlRow) {
    const urlCell = urlRow.querySelector(':scope > div');
    if (urlCell) {
      const url = urlCell.textContent.trim();
      if (url) {
        const linkEl = document.createElement('a');
        linkEl.classList.add('lesson-link');
        linkEl.href = url;
        linkEl.textContent = 'Go to lesson';
        linkEl.setAttribute('target', '_blank');
        lessonContainer.appendChild(linkEl);
      }
    }
  }

  // Replace the block content with our formatted lesson container
  block.innerHTML = '';
  block.appendChild(lessonContainer);
}
