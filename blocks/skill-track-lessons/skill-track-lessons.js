import { getMetadata } from '../../scripts/lib-franklin.js';

/**
 * Normalizes a URL path by removing /content/exlm/global prefix if present
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL
 */
function normalizeUrl(url) {
  if (!url) return '';
  
  // Remove /content/exlm/global prefix if present
  if (url.includes('/content/exlm/global')) {
    return url.replace('/content/exlm/global', '');
  }
  return url;
}

/**
 * Fetches lesson data from a given URL
 * @param {string} lessonUrl - The URL of the lesson page
 * @returns {Promise<Object>} - Promise resolving to lesson data
 */
async function fetchLessonData(lessonUrl) {
  try {
    // Normalize the URL before fetching
    const normalizedUrl = normalizeUrl(lessonUrl);
    const fullUrl = new URL(normalizedUrl, window.location.origin).href;
    
    const resp = await fetch(fullUrl);
    if (!resp.ok) {
      throw new Error(`Failed to fetch lesson data: ${resp.status} ${resp.statusText}`);
    }
    
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract lesson title from the page
    const title = doc.querySelector('h1')?.textContent || 
                 doc.querySelector('h2')?.textContent || 
                 'Lesson';
    
    // Extract description if available
    const description = doc.querySelector('meta[name="description"]')?.content || '';
    
    // Extract additional links from the page
    const additionalLinks = [];
    
    // Look for links in specific sections (like "Resources" or "Additional Materials")
    const resourceSections = Array.from(doc.querySelectorAll('h2, h3, h4')).filter(heading => 
      heading.textContent.toLowerCase().includes('resource') || 
      heading.textContent.toLowerCase().includes('additional') ||
      heading.textContent.toLowerCase().includes('material') ||
      heading.textContent.toLowerCase().includes('reference')
    );
    
    resourceSections.forEach(section => {
      // Get the next element after the heading
      let nextElement = section.nextElementSibling;
      
      // Look for links in the next few elements after the heading
      let count = 0;
      while (nextElement && count < 5) {
        const links = nextElement.querySelectorAll('a');
        links.forEach(link => {
          if (link.href && link.textContent.trim()) {
            additionalLinks.push({
              url: link.href,
              text: link.textContent.trim()
            });
          }
        });
        nextElement = nextElement.nextElementSibling;
        count++;
      }
    });
    
    // Also look for links in lists that might contain resources
    const lists = doc.querySelectorAll('ul, ol');
    lists.forEach(list => {
      const listItems = list.querySelectorAll('li');
      listItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && link.href && link.textContent.trim()) {
          additionalLinks.push({
            url: link.href,
            text: link.textContent.trim()
          });
        }
      });
    });
    
    return {
      url: fullUrl,
      title,
      description,
      additionalLinks: additionalLinks.length > 0 ? additionalLinks : null
    };
  } catch (error) {
    console.error(`Error fetching lesson data from ${lessonUrl}:`, error);
    return {
      url: lessonUrl,
      title: `Lesson (${lessonUrl.split('/').pop()})`,
      description: ''
    };
  }
}

/**
 * Decorates the skill track lessons block
 * @param {Element} block The skill track lessons block element
 */
export default async function decorate(block) {
  console.log('Skill Track Lessons: Starting decoration');
  
  // Store the original content before clearing
  const originalContent = block.innerHTML;
  console.log('Skill Track Lessons: Original content:', originalContent);
  
  // Add container class
  block.classList.add('skill-track-lessons-container');

  // Create a container for lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('skill-track-lessons');
  
  // Show loading state
  const loadingMessage = document.createElement('div');
  loadingMessage.classList.add('loading-message');
  loadingMessage.textContent = 'Loading lessons...';
  lessonsContainer.appendChild(loadingMessage);
  
  // Replace block content with loading message initially
  block.innerHTML = '';
  block.appendChild(lessonsContainer);

  // Try multiple approaches to get lesson paths
  
  // Get lesson paths from metadata - exactly like author-bio-page
  let links = getMetadata('lesson-paths');
  console.log('Skill Track Lessons: From metadata (lesson-paths):', links);
  
  // APPROACH 2: Try alternative metadata field name
  if (!links) {
    links = getMetadata('lesson-urls');
    console.log('Skill Track Lessons: From metadata (lesson-urls):', links);
  }
  
  // APPROACH 3: Try another alternative metadata field name
  if (!links) {
    links = getMetadata('lesson-page-urls');
    console.log('Skill Track Lessons: From metadata (lesson-page-urls):', links);
  }
  
  // APPROACH 4: Look for the field in the block content
  if (!links) {
    console.log('Skill Track Lessons: Looking in block content');
    
    // Create a temporary div to parse the original content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalContent;
    
    // Log all divs in the block to help debug
    const allDivs = tempDiv.querySelectorAll('div');
    console.log('Skill Track Lessons: All divs in block:', Array.from(allDivs).map(div => div.textContent.trim()));
    
    // Look for links in the block
    const allLinks = tempDiv.querySelectorAll('a');
    if (allLinks.length > 0) {
      console.log('Skill Track Lessons: Found links in block:', Array.from(allLinks).map(link => link.href));
      links = Array.from(allLinks).map(link => link.href).join(',');
    }
    
    // If still no links, try to find the field label
    if (!links) {
      // Try to find the parent block element
      const blockParent = block.parentElement;
      if (blockParent) {
        console.log('Skill Track Lessons: Block parent HTML:', blockParent.innerHTML);
        
        // Look for the field label in various ways
        const fieldLabels = blockParent.querySelectorAll('div');
        for (const label of fieldLabels) {
          console.log('Skill Track Lessons: Checking label:', label.textContent.trim());
          if (label.textContent.trim() === 'Lesson Page URLs') {
            console.log('Skill Track Lessons: Found field label');
            const valueDiv = label.nextElementSibling;
            if (valueDiv) {
              links = valueDiv.textContent.trim();
              console.log('Skill Track Lessons: Found value:', links);
              break;
            }
          }
        }
      }
    }
  }
  
  // APPROACH 5: Direct extraction from block parent
  if (!links) {
    // Try to get the raw text content and parse it
    const blockParent = block.parentElement;
    if (blockParent) {
      const rawText = blockParent.textContent.trim();
      console.log('Skill Track Lessons: Raw text from parent:', rawText);
      
      // Look for URLs in the text
      const urlRegex = /(https?:\/\/[^\s]+|\/[^\s]+)/g;
      const matches = rawText.match(urlRegex);
      if (matches && matches.length > 0) {
        links = matches.join(',');
        console.log('Skill Track Lessons: Extracted URLs from text:', links);
      }
    }
  }
  
  console.log('Skill Track Lessons: Final links value:', links);
  
  if (links) {
    // Process links exactly like author-bio-page
    if (window.hlx && window.hlx.aemRoot) {
      links = links.split(',').map((link) => `${link.trim()}.html`);
    } else {
      links = links.split(',').map((link) => link.trim());
    }
    
    console.log('Skill Track Lessons: After splitting:', links);
    
    // Filter out null, empty and duplicate links
    const lessonUrls = Array.from(new Set(links.filter((link) => link)));
    
    console.log('Skill Track Lessons: Final lesson URLs:', lessonUrls);

    // Fetch lesson data for each URL
    if (lessonUrls.length > 0) {
      try {
        // Fetch all lesson data in parallel
        const lessonDataCalls = lessonUrls.map(url => fetchLessonData(url));
        const lessonDataResults = await Promise.allSettled(lessonDataCalls);
        
        console.log('Skill Track Lessons: Fetched data results:', lessonDataResults);
        
        // Clear loading message
        lessonsContainer.innerHTML = '';
        
        // Create lesson items
        const successfulResults = lessonDataResults
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
          
        if (successfulResults.length > 0) {
          successfulResults.forEach((lesson, index) => {
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
            lessonTitle.textContent = lesson.title || `Lesson ${index + 1}`;
            lessonDetails.appendChild(lessonTitle);
            
            if (lesson.description) {
              const lessonDescription = document.createElement('p');
              lessonDescription.classList.add('lesson-description');
              lessonDescription.textContent = lesson.description;
              lessonDetails.appendChild(lessonDescription);
            }

            // Create a container for multiple links
            const lessonLinks = document.createElement('div');
            lessonLinks.classList.add('lesson-links');
            
            // Add the primary lesson link
            const lessonLink = document.createElement('a');
            lessonLink.classList.add('lesson-link');
            lessonLink.href = lesson.url;
            lessonLink.textContent = 'Go to lesson';
            lessonLink.setAttribute('target', '_blank');
            lessonLinks.appendChild(lessonLink);
            
            // If there are additional links in the lesson data, add them
            if (lesson.additionalLinks && Array.isArray(lesson.additionalLinks)) {
              lesson.additionalLinks.forEach(linkInfo => {
                const additionalLink = document.createElement('a');
                additionalLink.classList.add('lesson-link', 'additional-link');
                additionalLink.href = linkInfo.url;
                additionalLink.textContent = linkInfo.text || 'Additional resource';
                additionalLink.setAttribute('target', '_blank');
                lessonLinks.appendChild(additionalLink);
              });
            }
            
            lessonDetails.appendChild(lessonLinks);
            lessonItem.appendChild(lessonDetails);
            lessonsContainer.appendChild(lessonItem);
          });
        } else {
          const message = document.createElement('div');
          message.textContent = 'No lesson data could be retrieved. Please check the lesson URLs.';
          lessonsContainer.appendChild(message);
        }
      } catch (error) {
        console.error('Error processing lesson data:', error);
        lessonsContainer.innerHTML = '';
        const errorMessage = document.createElement('div');
        errorMessage.textContent = 'An error occurred while loading lessons. Please try again later.';
        lessonsContainer.appendChild(errorMessage);
      }
    } else {
      lessonsContainer.innerHTML = '';
      const message = document.createElement('div');
      message.textContent = 'No lesson URLs found (after filtering). Please add valid lesson URLs to the block.';
      lessonsContainer.appendChild(message);
    }
  } else {
    lessonsContainer.innerHTML = '';
    const message = document.createElement('div');
    message.textContent = 'No lesson URLs found. Please add lesson URLs to the block.';
    lessonsContainer.appendChild(message);
  }
}
