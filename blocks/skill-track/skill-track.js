import { generateLessonDOM } from '../lesson/lesson.js';

/**
 * Decorates the skill track block
 * @param {Element} block The skill track block element
 */
export default function decorate(block) {
  // Add container class
  block.classList.add('skill-track');
  
  // Get all rows
  const rows = [...block.children];
  
  // Process header (first row)
  if (rows.length > 0) {
    const header = rows.shift();
    const headerDiv = document.createElement('div');
    headerDiv.classList.add('skill-track-header');
    
    // Get title from first cell
    const titleCell = header.querySelector(':scope > div');
    if (titleCell) {
      const title = document.createElement('h2');
      title.textContent = titleCell.textContent.trim();
      headerDiv.appendChild(title);
    }
    
    block.prepend(headerDiv);
  }
  
  // Process each lesson row
  rows.forEach((row) => {
    // Set data attributes to match component definition
    row.dataset.blockName = 'lesson';
    row.dataset.blockModel = 'lesson';
    row.classList.add('lesson');
    
    // Generate the lesson DOM
    const lessonDOM = generateLessonDOM(row);
    
    // Empty the content, keep root element
    row.textContent = '';
    
    // Append the lesson DOM
    row.appendChild(lessonDOM);
  });
}
