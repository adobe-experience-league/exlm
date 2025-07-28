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
  
  // Look for the specific structure of multi-path fields
  // In AEM, multi-value fields often have a specific structure
  // Each value is in its own row with a specific class or attribute
  
  // First, try to find elements with data attributes related to multi-value fields
  const multiValueRows = block.querySelectorAll('[data-multifield="true"], [data-multi="true"], .multifield-item, .multi-field-item');
  
  if (multiValueRows.length > 0) {
    console.log('Found multi-value rows:', multiValueRows.length);
    
    // Process each multi-value row
    multiValueRows.forEach((row, index) => {
      const path = row.textContent.trim();
      if (path) {
        addLessonItem(lessonsContainer, path, index);
      }
    });
  } else {
    // If no specific multi-value structure is found, try a more general approach
    // Look for any div that might contain a path
    const allDivs = block.querySelectorAll('div');
    const paths = [];
    
    allDivs.forEach(div => {
      // Check if this div contains text that looks like a path
      const text = div.textContent.trim();
      if (text && (text.includes('/') || text.includes('http'))) {
        paths.push(text);
      }
    });
    
    // Process unique paths
    [...new Set(paths)].forEach((path, index) => {
      addLessonItem(lessonsContainer, path, index);
    });
    
    // If still no paths found, try one more approach - look at the raw HTML
    if (paths.length === 0) {
      // Get all rows in the block
      const rows = [...block.children];
      
      // Process each row
      rows.forEach((row, rowIndex) => {
        // Get all cells in the row
        const cells = [...row.children];
        
        // Process each cell
        cells.forEach((cell, cellIndex) => {
          const text = cell.textContent.trim();
          if (text && (text.includes('/') || text.includes('http'))) {
            addLessonItem(lessonsContainer, text, paths.length);
            paths.push(text);
          }
        });
      });
    }
  }
  
  // If we still don't have any lessons, try a completely different approach
  if (lessonsContainer.children.length === 0) {
    console.log('No lessons found with previous approaches, trying direct HTML parsing');
    
    // Get the HTML and look for patterns that might be paths
    const html = block.innerHTML;
    
    // Look for any text that might be a path
    const pathRegex = /(?:https?:\/\/[^\s"'<>]+)|(?:[^:\s"'<>]+\/[^\s"'<>]+)/g;
    const matches = html.match(pathRegex) || [];
    
    // Process unique matches
    [...new Set(matches)].forEach((match, index) => {
      // Skip if it's not a valid URL or path
      if (!match.includes('/')) return;
      
      addLessonItem(lessonsContainer, match, index);
    });
  }
  
  // Clear the original content
  block.innerHTML = '';
  
  // Add the lessons container to the block
  block.appendChild(lessonsContainer);
  
  // Debug the final result
  console.log('Final lesson count:', lessonsContainer.children.length);
}

/**
 * Helper function to add a lesson item to the container
 * @param {Element} container The container to add the lesson to
 * @param {string} path The lesson path
 * @param {number} index The lesson index
 */
function addLessonItem(container, path, index) {
  // Create a lesson item
  const lessonItem = document.createElement('div');
  lessonItem.classList.add('skill-track-lesson-item');
  
  // Add lesson number
  const lessonNumber = document.createElement('div');
  lessonNumber.classList.add('lesson-number');
  lessonNumber.textContent = index + 1;
  lessonItem.appendChild(lessonNumber);
  
  // Create lesson details
  const lessonDetails = document.createElement('div');
  lessonDetails.classList.add('lesson-details');
  
  // Add a title
  const lessonTitle = document.createElement('h3');
  lessonTitle.classList.add('lesson-title');
  lessonTitle.textContent = `Lesson ${index + 1}`;
  lessonDetails.appendChild(lessonTitle);
  
  // Add a link to the lesson
  const lessonLink = document.createElement('a');
  lessonLink.classList.add('lesson-link');
  lessonLink.href = path;
  lessonLink.textContent = 'Go to lesson';
  lessonLink.setAttribute('target', '_blank');
  lessonDetails.appendChild(lessonLink);
  
  // Add the lesson details to the lesson item
  lessonItem.appendChild(lessonDetails);
  
  // Add the lesson item to the container
  container.appendChild(lessonItem);
  
  console.log(`Added lesson item for path: ${path}`);
}
