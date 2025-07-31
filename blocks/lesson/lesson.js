/**
 * Generates the lesson DOM from a lesson element
 * @param {Element} lesson The lesson element
 * @returns {Element} The lesson DOM
 */
export function generateLessonDOM(lesson) {
  const rows = [...lesson.children];
  const lessonContainer = document.createElement('div');
  lessonContainer.classList.add('lesson-content');
  
  // Process title from first row
  if (rows[0]) {
    const titleCell = rows[0].querySelector(':scope > div');
    if (titleCell && titleCell.textContent.trim()) {
      const titleEl = document.createElement('h3');
      titleEl.classList.add('lesson-title');
      titleEl.textContent = titleCell.textContent.trim();
      lessonContainer.appendChild(titleEl);
    }
  }
  
  // Process URL from second row
  if (rows[1]) {
    const urlCell = rows[1].querySelector(':scope > div');
    if (urlCell && urlCell.textContent.trim()) {
      const linkEl = document.createElement('a');
      linkEl.classList.add('lesson-link');
      linkEl.href = urlCell.textContent.trim();
      linkEl.textContent = 'Go to lesson';
      linkEl.setAttribute('target', '_blank');
      lessonContainer.appendChild(linkEl);
    }
  }
  
  return lessonContainer;
}

/**
 * Decorates the lesson block
 * @param {Element} block The lesson block element
 */
export default function decorate(block) {
  block.classList.add('lesson-container');
  
  // Generate the lesson DOM
  const lessonDOM = generateLessonDOM(block);
  
  // Replace block content
  block.innerHTML = '';
  block.appendChild(lessonDOM);
}
