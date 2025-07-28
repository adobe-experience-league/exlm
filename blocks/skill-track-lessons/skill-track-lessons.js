import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { getMetadata } from '../../scripts/scripts.js';

/**
 * Decorates the skill track lessons block
 * @param {Element} block The skill track lessons block element
 */
export default function decorate(block) {
  // Add main container class
  block.classList.add('skill-track-lessons-container');
  
  // Debug the entire block HTML
  console.log('Block HTML:', block.outerHTML);
  
  // Create a container for all lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('skill-track-lessons');
  
  // Extract all text content from the block
  const allText = block.textContent;
  console.log('All text content:', allText);
  
  // Find all URLs in the text content
  const urls = [];
  
  // First approach: Try to find all links in the block
  const links = block.querySelectorAll('a');
  if (links.length > 0) {
    console.log('Found links:', links.length);
    links.forEach(link => {
      urls.push(link.href);
    });
  }
  
  // Second approach: Try to extract URLs from text content
  if (urls.length === 0) {
    // Get all divs that might contain URLs
    const allDivs = block.querySelectorAll('div');
    allDivs.forEach(div => {
      const text = div.textContent.trim();
      if (text && (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
        urls.push(text);
      }
    });
  }
  
  // Third approach: Try to extract all text nodes
  if (urls.length === 0) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      block,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue.trim();
      if (text && (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
        urls.push(text);
      }
    }
  }
  
  // Log all found URLs
  console.log('All found URLs:', urls);
  
  // Create lesson items for each URL
  urls.forEach((url, index) => {
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
    lessonLink.href = url;
    lessonLink.textContent = 'Go to lesson';
    lessonLink.setAttribute('target', '_blank');
    lessonDetails.appendChild(lessonLink);
    
    // Add the lesson details to the lesson item
    lessonItem.appendChild(lessonDetails);
    
    // Add the lesson item to the lessons container
    lessonsContainer.appendChild(lessonItem);
    
    console.log(`Added lesson item for URL: ${url}`);
  });
  
  // If we still don't have any lessons, try one more approach
  if (lessonsContainer.children.length === 0) {
    console.log('No lessons found with previous approaches, trying direct attribute access');
    
    // Try to access the data directly from the block's dataset
    const dataKeys = Object.keys(block.dataset);
    console.log('Block dataset keys:', dataKeys);
    
    // Look for any data attribute that might contain lesson paths
    dataKeys.forEach(key => {
      if (key.includes('lesson') || key.includes('path') || key.includes('url')) {
        const value = block.dataset[key];
        console.log(`Found data attribute ${key}:`, value);
        
        // Try to parse it as JSON if it looks like an array
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            const paths = JSON.parse(value);
            console.log('Parsed paths:', paths);
            
            paths.forEach((path, index) => {
              addLessonItem(lessonsContainer, path, index);
            });
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        } else {
          // Add it as a single path
          addLessonItem(lessonsContainer, value, 0);
        }
      }
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
