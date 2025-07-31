/**
 * Decorates the skill track lesson block
 * @param {Element} block The skill track lesson block element
 */
export default function decorate(block) {
  // Add both classes to ensure compatibility with both name and model
  block.classList.add('skill-track');
  block.classList.add('skill-track-lesson');
  
  // Set data attributes to help the system recognize the block
  block.dataset.blockName = 'skill-track-lesson';
  block.dataset.blockModel = 'skill-track-lesson';
  
  // Get all rows in the block
  const rows = [...block.children];

  // Create the skill track lesson header
  const headerRow = rows.shift();
  if (headerRow) {
    const headerContainer = document.createElement('div');
    headerContainer.classList.add('skill-track-header');

    // Get the title from the first cell
    const titleCell = headerRow.querySelector(':scope > div');
    if (titleCell) {
      const title = titleCell.textContent.trim();
      const titleEl = document.createElement('h2');
      titleEl.textContent = title;
      headerContainer.appendChild(titleEl);

      // Get the description from the second cell if it exists
      const descriptionCell = titleCell.nextElementSibling;
      if (descriptionCell) {
        const description = descriptionCell.textContent.trim();
        const descriptionEl = document.createElement('p');
        descriptionEl.textContent = description;
        headerContainer.appendChild(descriptionEl);
      }
    }

    block.prepend(headerContainer);
    headerRow.remove();
  }

  // Create a container for lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('lessons-container');
  block.appendChild(lessonsContainer);

  // Process each lesson row
  rows.forEach((row, index) => {
    // Create a lesson item that will be recognized by the system
    const lessonItem = document.createElement('div');
    lessonItem.classList.add('lesson');
    lessonItem.dataset.blockName = 'lesson';
    lessonItem.dataset.blockModel = 'lesson';
    lessonItem.dataset.slingResourceType = 'core/franklin/components/block/v1/block/item';
    
    // Get lesson content cells
    const cells = [...row.querySelectorAll(':scope > div')];

    // Get title from first cell
    if (cells[0]) {
      const titleEl = document.createElement('h3');
      titleEl.classList.add('lesson-title');
      titleEl.textContent = cells[0].textContent.trim();
      lessonItem.appendChild(titleEl);
    }

    // Get URL from second cell and create link
    if (cells[1]) {
      const url = cells[1].textContent.trim();
      if (url) {
        // Store the URL as a data attribute for the system to recognize
        lessonItem.dataset.lessonUrl = url;
        
        const linkEl = document.createElement('a');
        linkEl.classList.add('lesson-link');
        linkEl.href = url;
        linkEl.textContent = 'Go to lesson';
        linkEl.setAttribute('target', '_blank');
        lessonItem.appendChild(linkEl);
      }
    }

    // Add the lesson to the lessons container
    lessonsContainer.appendChild(lessonItem);
    row.remove();
  });
  
  // Add a special attribute to indicate this block has been processed
  block.dataset.processed = 'true';
}
