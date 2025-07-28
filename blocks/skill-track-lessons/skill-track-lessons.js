import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { getMetadata } from '../../scripts/scripts.js';

/**
 * Decorates the skill track lessons block
 * @param {Element} block The skill track lessons block element
 */
export default function decorate(block) {
  // Add main container class
  block.classList.add('skill-track-lessons-container');
  
  // Debug the block structure
  console.log('Block structure:', block);
  
  // Create a container for all lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('skill-track-lessons');
  
  // Get all rows in the block
  const rows = [...block.children];
  console.log('Number of rows:', rows.length);
  
  // Process each row as a separate lesson
  let lessonIndex = 0;
  rows.forEach((row) => {
    // Get all cells in the row
    const cells = [...row.children];
    
    // Process each cell as a separate lesson path
    cells.forEach((cell) => {
      const lessonPath = cell.textContent.trim();
      if (lessonPath) {
        console.log(`Found lesson path: ${lessonPath}`);
        
        // Create a lesson item
        const lessonItem = document.createElement('div');
        lessonItem.classList.add('skill-track-lesson-item');
        
        // Add lesson number
        const lessonNumber = document.createElement('div');
        lessonNumber.classList.add('lesson-number');
        lessonNumber.textContent = lessonIndex + 1;
        lessonItem.appendChild(lessonNumber);
        
        // Create lesson details
        const lessonDetails = document.createElement('div');
        lessonDetails.classList.add('lesson-details');
        lessonDetails.setAttribute('data-lesson-path', lessonPath);
        
        // Add a title
        const lessonTitle = document.createElement('h3');
        lessonTitle.classList.add('lesson-title');
        lessonTitle.textContent = `Lesson ${lessonIndex + 1}`;
        lessonDetails.appendChild(lessonTitle);
        
        // Add a link to the lesson
        const lessonLink = document.createElement('a');
        lessonLink.classList.add('lesson-link');
        lessonLink.href = lessonPath;
        lessonLink.textContent = 'Go to lesson';
        lessonLink.setAttribute('target', '_blank');
        lessonDetails.appendChild(lessonLink);
        
        // Add the lesson details to the lesson item
        lessonItem.appendChild(lessonDetails);
        
        // Add the lesson item to the lessons container
        lessonsContainer.appendChild(lessonItem);
        
        // Increment the lesson index
        lessonIndex++;
      }
    });
  });
  
  // Clear the original content
  block.innerHTML = '';
  
  // Add the lessons container to the block
  block.appendChild(lessonsContainer);
  
  // Debug the final result
  console.log('Final lesson count:', lessonsContainer.children.length);
}
