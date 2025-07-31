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
