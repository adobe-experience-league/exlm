/**
 * Decorates the lessons block
 * @param {Element} block The lessons block element
 */
export default function decorate(block) {
  console.log('Decorating lessons block');
  
  // Add container class
  block.classList.add('lessons-container');
  
  // Store original HTML for debugging
  const originalHTML = block.innerHTML;
  console.log('Original HTML:', originalHTML);
  
  // Create a container for lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('lessons');
  
  // Array to store all lesson URLs
  const lessonUrls = [];
  
  // Process each row in the block to find URLs
  const rows = [...block.children];
  console.log(`Found ${rows.length} rows in the block`);
  
  // Extract URLs from each row
  rows.forEach((row, index) => {
    // Get the cell content (first child of the row)
    const cell = row.firstElementChild;
    if (!cell) return;
    
    // Check if the cell contains a link
    const link = cell.querySelector('a');
    if (link) {
      const url = link.href;
      console.log(`Found link in row ${index}:`, url);
      lessonUrls.push(url);
    } else {
      // If no link, check for URL text
      const text = cell.textContent.trim();
      if (text && (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
        console.log(`Found URL text in row ${index}:`, text);
        lessonUrls.push(text);
      }
    }
  });
  
  console.log('Found lesson URLs:', lessonUrls);
  
  // Create lesson items for each URL
  if (lessonUrls.length > 0) {
    lessonUrls.forEach((url, index) => {
      // Create lesson item
      const lessonItem = document.createElement('div');
      lessonItem.classList.add('lesson-item');
      
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
