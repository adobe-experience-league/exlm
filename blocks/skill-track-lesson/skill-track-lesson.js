import { generateLessonDOM } from '../lesson/lesson.js';

/**
 * Decorates the skill track lesson block
 * @param {Element} block The skill track lesson block element
 */
export default function decorate(block) {
  // Add container class
  block.classList.add('skill-track-lesson');
  
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
  
  rows.forEach((lesson) => {
    const lessonDOM = generateLessonDOM(lesson);
    lesson.textContent = '';
    
    // Add lesson class
    lesson.classList.add('lesson');
    
    // Append the lesson DOM
    lesson.appendChild(lessonDOM);
  });
}
