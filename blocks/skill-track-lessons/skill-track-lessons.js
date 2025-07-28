/**
 * Decorates the skill track lessons block
 * @param {Element} block The skill track lessons block element
 */
export default function decorate(block) {
  console.log('Decorating skill-track-lessons block');
  
  // Add container class
  block.classList.add('skill-track-lessons-container');
  
  // Store original HTML for debugging
  const originalHTML = block.innerHTML;
  console.log('Original HTML:', originalHTML);
  
  // Create a container for lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('skill-track-lessons');
  
  // Array to store all lesson URLs
  const lessonUrls = [];
  
  // APPROACH 1: Check for data attributes that might contain the lesson paths
  // The authoring system might store the data in a data attribute
  console.log('Block dataset:', block.dataset);
  if (block.dataset && block.dataset.lessonPaths) {
    try {
      // Try to parse the lesson paths as JSON
      const paths = JSON.parse(block.dataset.lessonPaths);
      console.log('Found lesson paths in dataset:', paths);
      
      if (Array.isArray(paths)) {
        paths.forEach(path => {
          if (path && !lessonUrls.includes(path)) {
            lessonUrls.push(path);
            console.log('Added path from dataset:', path);
          }
        });
      }
    } catch (e) {
      console.error('Error parsing lesson paths from dataset:', e);
    }
  }
  
  // APPROACH 2: Look for the specific structure that comes from the authoring system
  // If no paths found in dataset, try to extract from the DOM structure
  if (lessonUrls.length === 0) {
    console.log('No paths found in dataset, looking in DOM structure');
    
    // In the authoring system, multi-value fields often appear as separate rows
    const rows = [...block.children];
    
    // Debug the structure
    console.log(`Found ${rows.length} rows in the block`);
    rows.forEach((row, i) => console.log(`Row ${i} HTML:`, row.outerHTML));
    
    // Process each row to extract URLs
    rows.forEach((row, index) => {
      // First, try to find links directly
      const links = row.querySelectorAll('a');
      if (links.length > 0) {
        links.forEach(link => {
          const url = link.href;
          console.log(`Found link in row ${index}:`, url);
          if (url && !lessonUrls.includes(url)) {
            lessonUrls.push(url);
          }
        });
      } else {
        // If no links found, look for text content that might be a URL
        // Get the innermost div which typically contains the actual value
        let cell = row;
        while (cell.children.length === 1 && cell.children[0].tagName === 'DIV') {
          cell = cell.children[0];
        }
        
        const text = cell.textContent.trim();
        console.log(`Text content in row ${index}:`, text);
        
        if (text && (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
          console.log(`Found URL text in row ${index}:`, text);
          if (!lessonUrls.includes(text)) {
            lessonUrls.push(text);
          }
        }
      }
    });
  }
  
  // APPROACH 3: Special case for multi-value fields in AEM
  // If still no URLs found, try a different approach for multi-value fields
  if (lessonUrls.length === 0) {
    console.log('Trying special case for multi-value fields');
    
    // Sometimes multi-value fields are stored in a specific structure
    // Look for divs that might contain the values
    const allDivs = block.querySelectorAll('div');
    allDivs.forEach((div, index) => {
      // Check if this div might contain a URL
      const text = div.textContent.trim();
      if (text && (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
        console.log(`Found URL text in div ${index}:`, text);
        if (!lessonUrls.includes(text)) {
          lessonUrls.push(text);
        }
      }
    });
  }
  
  console.log('Found lesson URLs:', lessonUrls);
  
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
      
      // Create lesson details
      const lessonDetails = document.createElement('div');
      lessonDetails.classList.add('lesson-details');
      
      // Add title
      const lessonTitle = document.createElement('h3');
      lessonTitle.classList.add('lesson-title');
      lessonTitle.textContent = `Lesson ${index + 1}`;
      lessonDetails.appendChild(lessonTitle);
      
      // Add link
      const lessonLink = document.createElement('a');
      lessonLink.classList.add('lesson-link');
      lessonLink.href = url;
      lessonLink.textContent = 'Go to lesson';
      lessonLink.setAttribute('target', '_blank');
      lessonDetails.appendChild(lessonLink);
      
      // Add details to item
      lessonItem.appendChild(lessonDetails);
      
      // Add item to container
      lessonsContainer.appendChild(lessonItem);
      
      console.log(`Added lesson item for URL: ${url}`);
    });
  } else {
    // No lessons found
    console.error('No lesson URLs found');
    const message = document.createElement('div');
    message.textContent = 'No lesson URLs found. Please add lesson URLs to the block.';
    lessonsContainer.appendChild(message);
  }
  
  // Replace block content with new container
  block.innerHTML = '';
  block.appendChild(lessonsContainer);
  
  console.log('Final HTML:', block.innerHTML);
}
