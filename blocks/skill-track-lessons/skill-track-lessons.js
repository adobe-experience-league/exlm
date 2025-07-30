import { getMetadata } from '../../scripts/lib-franklin.js';

/**
 * Simple decorator for skill track lessons block
 * @param {Element} block The skill track lessons block element
 */
export default function decorate(block) {
  // Add container class to the main block
  block.classList.add('skill-track-lessons-container');
  
  // Create a container for lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('skill-track-lessons');
  
  // Get lesson paths from metadata - similar to author-bio-page
  let links = getMetadata('lesson-paths');
  
  // Try alternative metadata field names if needed
  if (!links) {
    links = getMetadata('lesson-urls');
  }
  
  if (!links) {
    links = getMetadata('lesson-page-urls');
  }
  
  // If we have links from metadata
  if (links) {
    // Process links similar to author-bio-page
    if (window.hlx && window.hlx.aemRoot) {
      links = links.split(',').map((link) => `${link.trim()}.html`);
    } else {
      links = links.split(',').map((link) => link.trim());
    }
    
    // Filter out null, empty and duplicate links
    const lessonUrls = Array.from(new Set(links.filter((link) => link)));
    
    // Create lesson items for each URL
    if (lessonUrls.length > 0) {
      lessonUrls.forEach((url, index) => {
        // Create lesson item
        const lessonItem = document.createElement('div');
        lessonItem.classList.add('skill-track-lesson-item');
        
        // Add lesson number
        const lessonNumber = document.createElement('div');
        lessonNumber.classList.add('lesson-number');
        lessonNumber.textContent = index + 1;
        lessonItem.appendChild(lessonNumber);
        
        // Create lesson details container
        const lessonDetails = document.createElement('div');
        lessonDetails.classList.add('lesson-details');
        
        // Create lesson link
        const lessonLink = document.createElement('a');
        lessonLink.classList.add('lesson-link');
        lessonLink.href = url;
        lessonLink.textContent = `Lesson ${index + 1}`;
        lessonDetails.appendChild(lessonLink);
        
        // Add the lesson details to the lesson item
        lessonItem.appendChild(lessonDetails);
        
        // Add the lesson item to the lessons container
        lessonsContainer.appendChild(lessonItem);
      });
    }
  } else {
    // Fallback to using the content from the block
    const rows = Array.from(block.children);
    
    if (rows.length > 0) {
      // Process each row as a lesson
      rows.forEach((row, index) => {
        // Create lesson item
        const lessonItem = document.createElement('div');
        lessonItem.classList.add('skill-track-lesson-item');
        
        // Add lesson number
        const lessonNumber = document.createElement('div');
        lessonNumber.classList.add('lesson-number');
        lessonNumber.textContent = index + 1;
        lessonItem.appendChild(lessonNumber);
        
        // Create lesson details container
        const lessonDetails = document.createElement('div');
        lessonDetails.classList.add('lesson-details');
        
        // Get cells from the row
        const cells = Array.from(row.children);
        
        // First cell is typically the title/content
        if (cells.length > 0) {
          // Move all content from the first cell to the lesson details
          lessonDetails.innerHTML = cells[0].innerHTML;
        }
        
        // Add the lesson details to the lesson item
        lessonItem.appendChild(lessonDetails);
        
        // Add the lesson item to the lessons container
        lessonsContainer.appendChild(lessonItem);
      });
    }
  }
  
  // Clear the block and add the lessons container
  block.innerHTML = '';
  block.appendChild(lessonsContainer);
}
