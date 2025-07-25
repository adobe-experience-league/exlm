import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { getMetadata } from '../../scripts/scripts.js';

/**
 * Decorates the skill track block
 * @param {Element} block The skill track block element
 */
export default function decorate(block) {
  // Add main container class
  block.classList.add('skill-track-container');
  
  // Get all rows in the block
  const rows = [...block.children];
  
  // Create the skill track header
  const headerRow = rows.shift();
  if (headerRow) {
    const headerContainer = document.createElement('div');
    headerContainer.classList.add('skill-track-header');
    
    // Get the title from the first cell
    const titleCell = headerRow.querySelector(':scope > div');
    if (titleCell) {
      const title = titleCell.textContent.trim();
      const titleEl = document.createElement('h2');
      titleEl.textContent = title;
      headerContainer.appendChild(titleEl);
      
      // Get the description from the second cell if it exists
      const descriptionCell = titleCell.nextElementSibling;
      if (descriptionCell) {
        const description = descriptionCell.textContent.trim();
        const descriptionEl = document.createElement('p');
        descriptionEl.textContent = description;
        headerContainer.appendChild(descriptionEl);
      }
    }
    
    block.prepend(headerContainer);
    headerRow.remove();
  }
  
  // Create a container for all lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('skill-track-lessons');
  
  // Process each lesson row
  rows.forEach((row, index) => {
    const lessonContainer = document.createElement('div');
    lessonContainer.classList.add('skill-track-lesson');
    
    // Add lesson number
    const lessonNumber = document.createElement('div');
    lessonNumber.classList.add('lesson-number');
    lessonNumber.textContent = index + 1;
    lessonContainer.appendChild(lessonNumber);
    
    // Get lesson content cells
    const cells = [...row.querySelectorAll(':scope > div')];
    
    // Get title from first cell
    if (cells[0]) {
      const titleEl = document.createElement('h3');
      titleEl.classList.add('lesson-title');
      titleEl.textContent = cells[0].textContent.trim();
      lessonContainer.appendChild(titleEl);
    }
    
    // Get URL from second cell and create link
    if (cells[1]) {
      const url = cells[1].textContent.trim();
      if (url) {
        const linkEl = document.createElement('a');
        linkEl.classList.add('lesson-link');
        linkEl.href = url;
        linkEl.textContent = 'Go to lesson';
        linkEl.setAttribute('target', '_blank');
        lessonContainer.appendChild(linkEl);
      }
    }
    
    // Add the lesson to the lessons container
    lessonsContainer.appendChild(lessonContainer);
    
    // Remove the original row
    row.remove();
  });
  
  // Add the lessons container to the block
  block.appendChild(lessonsContainer);
}
