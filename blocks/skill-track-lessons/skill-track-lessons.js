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
  console.log('Block HTML:', block.outerHTML);
  
  // Create a container for all lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('skill-track-lessons');
  
  // Get all rows in the block
  const rows = [...block.children];
  console.log('Number of rows:', rows.length);
  
  // Extract all text content that looks like a URL
  const allText = block.textContent;
  console.log('All text content:', allText);
  
  // Use a regex to find all URLs in the text content
  const urlRegex = /(https?:\/\/[^\s]+)|([^:\s]+\/[^\s]+)/g;
  const matches = allText.match(urlRegex) || [];
  
  console.log('Found URL matches:', matches);
  
  // Process each match as a lesson path
  matches.forEach((match, index) => {
    // Skip if it's not a valid URL or path
    if (!match.includes('/')) return;
    
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
    lessonLink.href = match;
    lessonLink.textContent = 'Go to lesson';
    lessonLink.setAttribute('target', '_blank');
    lessonDetails.appendChild(lessonLink);
    
    // Add the lesson details to the lesson item
    lessonItem.appendChild(lessonDetails);
    
    // Add the lesson item to the lessons container
    lessonsContainer.appendChild(lessonItem);
    
    console.log(`Added lesson item for path: ${match}`);
  });
  
  // If we still don't have any lessons, try a more direct approach
  if (lessonsContainer.children.length === 0) {
    console.log('No lessons found with URL matching, trying direct DOM traversal');
    
    // Process each row and cell directly
    rows.forEach((row) => {
      // Get all cells in the row
      const cells = [...row.children];
      
      cells.forEach((cell) => {
        // Get all text nodes in the cell
        const textNodes = [];
        const walker = document.createTreeWalker(
          cell,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while ((node = walker.nextNode())) {
          const text = node.nodeValue.trim();
          if (text && text.includes('/')) {
            textNodes.push(text);
          }
        }
        
        // Process each text node as a potential lesson path
        textNodes.forEach((text, index) => {
          addLessonItem(lessonsContainer, text, lessonsContainer.children.length);
        });
      });
    });
  }
  
  // Clear the original content
  block.innerHTML = '';
  
  // Add the lessons container to the block
  block.appendChild(lessonsContainer);
  
  // Debug the final result
  console.log('Final lesson count:', lessonsContainer.children.length);
  console.log('Final HTML:', block.innerHTML);
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
