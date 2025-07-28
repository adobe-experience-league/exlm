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
  console.log('Block dataset:', block.dataset);
  if (block.dataset && block.dataset.lessonPaths) {
    try {
      const paths = JSON.parse(block.dataset.lessonPaths);
      console.log('Found lesson paths in dataset:', paths);

      if (Array.isArray(paths)) {
        paths.forEach((path) => {
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

  // APPROACH 2: Extract from DOM rows
  if (lessonUrls.length === 0) {
    console.log('No paths found in dataset, looking in DOM structure');

    const rows = [...block.children];
    console.log(`Found ${rows.length} rows in the block`);
    rows.forEach((row, i) => console.log(`Row ${i} HTML:`, row.outerHTML));

    rows.forEach((row, index) => {
      // Find all <a> links inside the row (even multiple)
      const links = row.querySelectorAll('a');
      if (links.length > 0) {
        links.forEach((link) => {
          const url = link.href;
          if (url && !lessonUrls.includes(url)) {
            lessonUrls.push(url);
            console.log(`Found link in row ${index}:`, url);
          }
        });
      } else {
        // Fallback: extract text that looks like URLs
        let cell = row;
        while (cell.children.length === 1 && cell.children[0].tagName === 'DIV') {
          cell = cell.children[0];
        }

        const text = cell.textContent.trim();
        console.log(`Text content in row ${index}:`, text);

        // Handle multiple space-separated or newline-separated URLs
        const possibleUrls = text.split(/\s+/).filter(part =>
          part.startsWith('http') || part.startsWith('/') || part.includes('/')
        );

        possibleUrls.forEach((urlCandidate) => {
          if (!lessonUrls.includes(urlCandidate)) {
            lessonUrls.push(urlCandidate);
            console.log(`Found URL text in row ${index}:`, urlCandidate);
          }
        });
      }
    });
  }

  // APPROACH 3: Special case for multi-value fields
  if (lessonUrls.length === 0) {
    console.log('Trying special case for multi-value fields');

    const allDivs = block.querySelectorAll('div');
    allDivs.forEach((div, index) => {
      const text = div.textContent.trim();

      // Same: split and handle multiple URLs per div
      const possibleUrls = text.split(/\s+/).filter(part =>
        part.startsWith('http') || part.startsWith('/') || part.includes('/')
      );

      possibleUrls.forEach((urlCandidate) => {
        if (!lessonUrls.includes(urlCandidate)) {
          lessonUrls.push(urlCandidate);
          console.log(`Found URL text in div ${index}:`, urlCandidate);
        }
      });
    });
  }

  console.log('Found lesson URLs:', lessonUrls);

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

      console.log(`Added lesson item for URL: ${url}`);
    });
  } else {
    console.error('No lesson URLs found');
    const message = document.createElement('div');
    message.textContent = 'No lesson URLs found. Please add lesson URLs to the block.';
    lessonsContainer.appendChild(message);
  }

  // Replace block content
  block.innerHTML = '';
  block.appendChild(lessonsContainer);

  console.log('Final HTML:', block.innerHTML);
}
