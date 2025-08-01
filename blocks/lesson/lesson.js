/**
 * Generates the lesson DOM from a lesson element
 * @param {Element} lesson The lesson element
 * @returns {Element} The lesson DOM
 */
export function generateLessonDOM(lesson) {
  const lessonContainer = document.createElement('div');
  lessonContainer.classList.add('lesson-content');

  let { lessonUrl } = lesson.dataset;

  if (!lessonUrl) {
    const [firstCell] = lesson.querySelectorAll(':scope > div');
    if (firstCell?.textContent.trim()) {
      lessonUrl = firstCell.textContent.trim();
    }
  }

  if (lessonUrl) {
    const linkEl = document.createElement('a');
    linkEl.classList.add('lesson-link');
    linkEl.href = lessonUrl;
    linkEl.textContent = lessonUrl;
    linkEl.setAttribute('title', lessonUrl);
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
  block.classList.add('lesson');

  const lessonDOM = generateLessonDOM(block);

  block.innerHTML = '';
  block.appendChild(lessonDOM);
}
