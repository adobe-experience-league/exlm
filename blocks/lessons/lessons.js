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
  
  // IMPORTANT: Debug the block structure in detail
  console.log('Block structure details:');
  console.log('Block children count:', block.children.length);
  console.log('Block dataset:', block.dataset);
  console.log('Block attributes:', [...block.attributes].map(attr => `${attr.name}="${attr.value}"`).join(', '));
  
  // Approach 1: Try to get URLs from each row directly
  console.log('Approach 1: Processing rows directly');
  const rows = [...block.children];
  rows.forEach((row, index) => {
    console.log(`Row ${index} HTML:`, row.outerHTML);
    
    // Get all divs in this row
    const allDivsInRow = row.querySelectorAll('div');
    console.log(`Row ${index} has ${allDivsInRow.length} divs`);
    
    // Check for links in this row
    const links = row.querySelectorAll('a');
    if (links.length > 0) {
      links.forEach(link => {
        const url = link.href;
        console.log(`Found link in row ${index}:`, url);
        if (!lessonUrls.includes(url)) {
          lessonUrls.push(url);
        }
      });
    } else {
      // If no links, check for URL text in all divs
      allDivsInRow.forEach((div, divIndex) => {
        const text = div.textContent.trim();
        console.log(`Row ${index}, Div ${divIndex} text:`, text);
        if (text && (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
          console.log(`Found URL text in row ${index}, div ${divIndex}:`, text);
          if (!lessonUrls.includes(text)) {
            lessonUrls.push(text);
          }
        }
      });
      
      // Also check the row text directly
      const rowText = row.textContent.trim();
      if (rowText && (rowText.startsWith('http') || rowText.startsWith('/') || rowText.includes('/'))) {
        console.log(`Found URL text directly in row ${index}:`, rowText);
        if (!lessonUrls.includes(rowText)) {
          lessonUrls.push(rowText);
        }
      }
    }
  });
  
  // Approach 2: Try to find all links in the block
  if (lessonUrls.length === 0) {
    console.log('Approach 2: Finding all links in the block');
    const allLinks = block.querySelectorAll('a');
    allLinks.forEach((link, index) => {
      const url = link.href;
      console.log(`Found link ${index}:`, url);
      if (!lessonUrls.includes(url)) {
        lessonUrls.push(url);
      }
    });
  }
  
  // Approach 3: Try to find all text nodes that look like URLs
  if (lessonUrls.length === 0) {
    console.log('Approach 3: Finding all text nodes that look like URLs');
    const allDivs = block.querySelectorAll('div');
    allDivs.forEach((div, index) => {
      const text = div.textContent.trim();
      if (text && (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
        console.log(`Found URL-like text in div ${index}:`, text);
        if (!lessonUrls.includes(text)) {
          lessonUrls.push(text);
        }
      }
    });
  }
  
  // Approach 4: Try to extract URLs from the block's text content
  if (lessonUrls.length === 0) {
    console.log('Approach 4: Extracting URLs from text content');
    const text = block.textContent;
    const urlRegex = /(https?:\/\/[^\s]+|\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    if (matches) {
      matches.forEach(match => {
        console.log('Found URL in text content:', match);
        if (!lessonUrls.includes(match)) {
          lessonUrls.push(match);
        }
      });
    }
  }
  
  // Approach 5: Try to get URLs from the block's dataset
  if (lessonUrls.length === 0 && block.dataset && block.dataset.lessonUrls) {
    console.log('Approach 5: Getting URLs from dataset');
    try {
      const urls = JSON.parse(block.dataset.lessonUrls);
      console.log('URLs from dataset:', urls);
      if (Array.isArray(urls)) {
        urls.forEach(url => {
          if (url && !lessonUrls.includes(url)) {
            lessonUrls.push(url);
          }
        });
      }
    } catch (e) {
      console.error('Error parsing URLs from dataset:', e);
    }
  }
  
  console.log('Final lesson URLs:', lessonUrls);
  
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
