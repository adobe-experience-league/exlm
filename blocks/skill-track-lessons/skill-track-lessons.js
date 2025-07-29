/**
 * Decorates the skill track lessons block
 * @param {Element} block The skill track lessons block element
 */
export default function decorate(block) {
  // Add container class
  block.classList.add('skill-track-lessons-container');

  // Create a container for lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('skill-track-lessons');

  // Array to store all lesson URLs
  const lessonUrls = [];

  // PRIORITY APPROACH: Extract lesson paths from the data attribute
  // This is the most reliable way to get the multi-valued field data
  if (block.dataset && block.dataset.lessonPaths) {
    try {
      const paths = JSON.parse(block.dataset.lessonPaths);
      
      if (Array.isArray(paths)) {
        paths.forEach((path) => {
          if (path && !lessonUrls.includes(path)) {
            lessonUrls.push(path);
          }
        });
      } else if (typeof paths === 'string') {
        // Handle case where it might be a single string
        lessonUrls.push(paths);
      }
    } catch (e) {
      console.error('Error parsing lesson paths from data attribute:', e);
    }
  }

  // If no URLs found in data attribute, try to extract from DOM structure
  if (lessonUrls.length === 0) {
    // Look for the multi-value field row
    const rows = [...block.children];
    
    rows.forEach((row) => {
      // First, check if this is a multi-value field row
      const firstDiv = row.querySelector('div');
      if (firstDiv && firstDiv.textContent.trim() === 'Lesson Page URLs') {
        // This is the multi-value field row, extract all URLs from the second div
        const urlsDiv = row.querySelector('div:nth-child(2)');
        if (urlsDiv) {
          // Extract all links
          const links = urlsDiv.querySelectorAll('a');
          if (links.length > 0) {
            links.forEach(link => {
              if (link.href && !lessonUrls.includes(link.href)) {
                lessonUrls.push(link.href);
              }
            });
          } else {
            // If no links found, try to parse the text content
            const text = urlsDiv.textContent.trim();
            if (text) {
              // Check if there are multiple URLs separated by commas or line breaks
              const separators = [',', '\n', '\r\n'];
              let foundSeparator = false;
              
              for (const separator of separators) {
                if (text.includes(separator)) {
                  const urls = text.split(separator).map(url => url.trim());
                  urls.forEach(url => {
                    if (url && !lessonUrls.includes(url) && 
                       (url.startsWith('http') || url.startsWith('/') || url.includes('/'))) {
                      lessonUrls.push(url);
                    }
                  });
                  foundSeparator = true;
                  break;
                }
              }
              
              // If no separator found, treat the whole text as a single URL
              if (!foundSeparator && 
                 (text.startsWith('http') || text.startsWith('/') || text.includes('/'))) {
                lessonUrls.push(text);
              }
            }
          }
        }
      } else {
        // Regular row, check for links
        const links = row.querySelectorAll('a');
        if (links.length > 0) {
          links.forEach(link => {
            if (link.href && !lessonUrls.includes(link.href)) {
              lessonUrls.push(link.href);
            }
          });
        }
      }
    });
  }

  // Fallback: Try to extract URLs from the block's text content
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

  // Create lesson items
  if (lessonUrls.length > 0) {
    lessonUrls.forEach((url, index) => {
      const lessonItem = document.createElement('div');
      lessonItem.classList.add('skill-track-lesson-item');

      const lessonNumber = document.createElement('div');
      lessonNumber.classList.add('lesson-number');
      lessonNumber.textContent = index + 1;
      lessonItem.appendChild(lessonNumber);

      const lessonDetails = document.createElement('div');
      lessonDetails.classList.add('lesson-details');

      const lessonTitle = document.createElement('h3');
      lessonTitle.classList.add('lesson-title');
      lessonTitle.textContent = `Lesson ${index + 1}`;
      lessonDetails.appendChild(lessonTitle);

      const lessonLink = document.createElement('a');
      lessonLink.classList.add('lesson-link');
      lessonLink.href = url;
      lessonLink.textContent = 'Go to lesson';
      lessonLink.setAttribute('target', '_blank');
      lessonDetails.appendChild(lessonLink);

      lessonItem.appendChild(lessonDetails);
      lessonsContainer.appendChild(lessonItem);
    });
  } else {
    const message = document.createElement('div');
    message.textContent = 'No lesson URLs found. Please add lesson URLs to the block.';
    lessonsContainer.appendChild(message);
  }

  // Replace block content
  block.innerHTML = '';
  block.appendChild(lessonsContainer);
  
  // Debug: Log the URLs found to help with troubleshooting
  console.log('Skill Track Lessons block: Found URLs:', lessonUrls);
}
