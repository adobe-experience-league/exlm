/**
 * Decorates the skill track lessons block
 * @param {Element} block The skill track lessons block element
 */
export default function decorate(block) {
  // Add main container class
  block.classList.add('skill-track-lessons-container');
  
  // Create a container for all lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('skill-track-lessons');
  
  // Extract lesson paths from the block's dataset
  const lessonPaths = [];
  
  // Check if the block has a dataset with lesson-paths
  if (block.dataset && block.dataset.lessonPaths) {
    try {
      // Try to parse the lesson-paths as JSON
      const paths = JSON.parse(block.dataset.lessonPaths);
      console.log('Found lesson paths in dataset:', paths);
      
      if (Array.isArray(paths)) {
        paths.forEach(path => {
          if (path && !lessonPaths.includes(path)) {
            lessonPaths.push(path);
          }
        });
      }
    } catch (e) {
      console.error('Error parsing lesson paths from dataset:', e);
    }
  }
  
  // If no lesson paths found in dataset, extract from the block content
  if (lessonPaths.length === 0) {
    console.log('No lesson paths found in dataset, extracting from content');
    
    // Process each row in the block to find URLs
    [...block.children].forEach((row, index) => {
      // Get the cell content
      const cell = row.firstElementChild;
      if (!cell) return;
      
      // Try to extract URL from the cell
      let path = null;
      
      // Check if the cell contains a link
      const link = cell.querySelector('a');
      if (link) {
        path = link.href;
        console.log(`Found link in row ${index}:`, path);
      } else {
        // Otherwise use the text content if it looks like a URL
        const text = cell.textContent.trim();
        if (text && (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
          path = text;
          console.log(`Found URL-like text in row ${index}:`, path);
        }
      }
      
      if (path && !lessonPaths.includes(path)) {
        lessonPaths.push(path);
      }
    });
  }
  
  // If still no lesson paths, try to find all links in the block
  if (lessonPaths.length === 0) {
    console.log('No lesson paths found in rows, trying to find all links');
    
    const links = block.querySelectorAll('a');
    links.forEach(link => {
      if (!lessonPaths.includes(link.href)) {
        lessonPaths.push(link.href);
        console.log('Found link:', link.href);
      }
    });
    
    // Try to extract URLs from text content
    if (lessonPaths.length === 0) {
      console.log('No links found, trying to extract URLs from text content');
      
      const allText = block.textContent;
      const urlRegex = /(https?:\/\/[^\s]+|\/[^\s]+)/g;
      const textUrls = allText.match(urlRegex);
      
      if (textUrls) {
        textUrls.forEach(url => {
          if (!lessonPaths.includes(url)) {
            lessonPaths.push(url);
            console.log('Found URL in text:', url);
          }
        });
      }
    }
  }
  
  console.log('All found lesson paths:', lessonPaths);
  
  // Create lesson items for each path
  lessonPaths.forEach((path, index) => {
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
    
    // Add the lesson item to the lessons container
    lessonsContainer.appendChild(lessonItem);
    
    console.log(`Added lesson item for path: ${path}`);
  });
  
  // If no lessons were created, show an error message
  if (lessonsContainer.children.length === 0) {
    console.error('No lesson paths found in the block');
    
    // Create a placeholder lesson item
    const placeholderItem = document.createElement('div');
    placeholderItem.classList.add('skill-track-lesson-item');
    placeholderItem.textContent = 'No lesson paths found. Please add lesson paths to the block.';
    lessonsContainer.appendChild(placeholderItem);
  }
  
  // Clear the original content and add the new container
  block.innerHTML = '';
  block.appendChild(lessonsContainer);
  
  // Debug the final result
  console.log('Final lesson count:', lessonsContainer.children.length);
  console.log('Final HTML:', block.innerHTML);
}
