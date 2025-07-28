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
  
  // First approach: Look for links in each row
  console.log('Looking for links in rows');
  const rows = [...block.children];
  rows.forEach((row, index) => {
    console.log(`Processing row ${index}:`, row.outerHTML);
    
    // Check for links in this row
    const links = row.querySelectorAll('a');
    if (links.length > 0) {
      links.forEach(link => {
        console.log(`Found link in row ${index}:`, link.href);
        lessonUrls.push(link.href);
      });
    } else {
      // If no links, check for URL text
      const cells = [...row.children];
      cells.forEach(cell => {
        const text = cell.textContent.trim();
        if (text && (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
          console.log(`Found URL text in row ${index}:`, text);
          lessonUrls.push(text);
        }
      });
    }
  });
  
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
