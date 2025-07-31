/**
 * Generates the lesson DOM from a lesson element
 * @param {Element} lesson The lesson element
 * @returns {Element} The lesson DOM
 */
export function generateLessonDOM(lesson) {
  const lessonContainer = document.createElement('div');
  lessonContainer.classList.add('lesson-content');
  
  // Get lesson URL from data attribute or from the first cell
  let lessonUrl = lesson.dataset.lessonUrl;
  
  if (!lessonUrl) {
    const cells = [...lesson.querySelectorAll(':scope > div')];
    if (cells[0] && cells[0].textContent.trim()) {
      lessonUrl = cells[0].textContent.trim();
    }
  }
  
  if (lessonUrl) {
    // Create link element
    const linkEl = document.createElement('a');
    linkEl.classList.add('lesson-link');
    linkEl.href = lessonUrl;
    linkEl.textContent = 'Go to lesson';
    linkEl.setAttribute('target', '_blank');
    lessonContainer.appendChild(linkEl);
  }
  
  return lessonContainer;
}

/**
 * Decorates the lesson block
 * @param {Element} block The lesson block element
 */
export default function decorate(block) {
  // Add class for styling
  block.classList.add('lesson');
  
  // Generate the lesson DOM
  const lessonDOM = generateLessonDOM(block);
  
  // Replace block content
  block.innerHTML = '';
  block.appendChild(lessonDOM);
}
