/**
 * Decorates the lessons block
 * @param {Element} block The lessons block element
 */
export default function decorate(block) {
  // Add container class
  block.classList.add('lessons-container');
  
  // Create a container for lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('lessons');
  
  // Array to store all lesson URLs
  const lessonUrls = [];
  
  // Approach 1: Try to get URLs from each row directly
  const rows = [...block.children];
  rows.forEach((row) => {
    // Get all divs in this row
    const allDivsInRow = row.querySelectorAll('div');
    
    // Check for links in this row
    const links = row.querySelectorAll('a');
    if (links.length > 0) {
      links.forEach(link => {
        // Check if the URL contains commas (multiple URLs)
        const url = link.href;
        if (url && url.includes(',')) {
          // Split by comma and add each URL
          const multipleUrls = url.split(',').map(u => u.trim());
          multipleUrls.forEach(singleUrl => {
            if (singleUrl && !lessonUrls.includes(singleUrl)) {
              lessonUrls.push(singleUrl);
            }
          });
        } else if (url && !lessonUrls.includes(url)) {
          lessonUrls.push(url);
        }
        
        // Also check the link text for comma-separated URLs
        const linkText = link.textContent.trim();
        if (linkText && linkText.includes(',')) {
          const multipleUrls = linkText.split(',').map(u => u.trim());
          multipleUrls.forEach(singleUrl => {
            if (singleUrl && !lessonUrls.includes(singleUrl) && 
               (singleUrl.startsWith('http') || singleUrl.startsWith('/') || singleUrl.includes('/'))) {
              lessonUrls.push(singleUrl);
            }
          });
        }
      });
    } else {
      // If no links, check for URL text in all divs
      allDivsInRow.forEach((div) => {
        const text = div.textContent.trim();
        
        // Check for comma-separated URLs in text
        if (text && text.includes(',')) {
          const multipleUrls = text.split(',').map(u => u.trim());
          multipleUrls.forEach(singleUrl => {
            if (singleUrl && !lessonUrls.includes(singleUrl) && 
               (singleUrl.startsWith('http') || singleUrl.startsWith('/') || singleUrl.includes('/'))) {
              lessonUrls.push(singleUrl);
            }
          });
        } else if (text && (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
          if (!lessonUrls.includes(text)) {
            lessonUrls.push(text);
          }
        }
      });
      
      // Also check the row text directly for comma-separated URLs
      const rowText = row.textContent.trim();
      if (rowText && rowText.includes(',')) {
        const multipleUrls = rowText.split(',').map(u => u.trim());
        multipleUrls.forEach(singleUrl => {
          if (singleUrl && !lessonUrls.includes(singleUrl) && 
             (singleUrl.startsWith('http') || singleUrl.startsWith('/') || singleUrl.includes('/'))) {
            lessonUrls.push(singleUrl);
          }
        });
      } else if (rowText && (rowText.startsWith('http') || rowText.startsWith('/') || rowText.includes('/'))) {
        if (!lessonUrls.includes(rowText)) {
          lessonUrls.push(rowText);
        }
      }
    }
  });
  
  // Approach 2: Try to find all links in the block
  if (lessonUrls.length === 0) {
    const allLinks = block.querySelectorAll('a');
    allLinks.forEach((link) => {
      const url = link.href;
      if (!lessonUrls.includes(url)) {
        lessonUrls.push(url);
      }
    });
  }
  
  // Approach 3: Try to find all text nodes that look like URLs
  if (lessonUrls.length === 0) {
    const allDivs = block.querySelectorAll('div');
    allDivs.forEach((div) => {
      const text = div.textContent.trim();
      if (text && (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
        if (!lessonUrls.includes(text)) {
          lessonUrls.push(text);
        }
      }
    });
  }
  
  // Approach 4: Try to extract URLs from the block's text content
  if (lessonUrls.length === 0) {
    const text = block.textContent;
    const urlRegex = /(https?:\/\/[^\s]+|\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    if (matches) {
      matches.forEach(match => {
        if (!lessonUrls.includes(match)) {
          lessonUrls.push(match);
        }
      });
    }
  }
  
  // Approach 5: Try to get URLs from the block's dataset
  if (lessonUrls.length === 0 && block.dataset && block.dataset.lessonUrls) {
    try {
      const urls = JSON.parse(block.dataset.lessonUrls);
      if (Array.isArray(urls)) {
        urls.forEach(url => {
          if (url && !lessonUrls.includes(url)) {
            lessonUrls.push(url);
          }
        });
      }
    } catch (e) {
      // Continue to next approach
    }
  }
  
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
    });
  } else {
    // No lessons found
    const message = document.createElement('div');
    message.textContent = 'No lesson URLs found. Please add lesson URLs to the block.';
    lessonsContainer.appendChild(message);
  }
  
  // Replace block content with new container
  block.innerHTML = '';
  block.appendChild(lessonsContainer);
}
