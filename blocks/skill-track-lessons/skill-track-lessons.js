import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { getMetadata } from '../../scripts/scripts.js';

/**
 * Decorates the skill track lessons block
 * @param {Element} block The skill track lessons block element
 */
export default function decorate(block) {
  // Add main container class
  block.classList.add('skill-track-lessons-container');

  // For multi-path fields, the structure is different
  // Each path is in a separate div inside a row
  const lessonPaths = [];

  // Get all rows in the block
  const rows = [...block.children];

  // Extract all lesson paths from the rows
  rows.forEach((row) => {
    // Each row might contain multiple paths (one per cell)
    const cells = [...row.querySelectorAll(':scope > div')];
    cells.forEach((cell) => {
      const path = cell.textContent.trim();
      if (path) {
        lessonPaths.push(path);
      }
    });
  });

  // Create a container for all lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('skill-track-lessons');

  // Process each lesson path
  lessonPaths.forEach((lessonPath, index) => {
    // Create a lesson item
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
    lessonDetails.setAttribute('data-lesson-path', lessonPath);

    // Add a placeholder title
    const lessonTitle = document.createElement('h3');
    lessonTitle.classList.add('lesson-title');
    lessonTitle.textContent = `Lesson ${index + 1}`;
    lessonDetails.appendChild(lessonTitle);

    // Add a link to the lesson
    const lessonLink = document.createElement('a');
    lessonLink.classList.add('lesson-link');
    lessonLink.href = lessonPath;
    lessonLink.textContent = 'Go to lesson';
    lessonLink.setAttribute('target', '_blank');
    lessonDetails.appendChild(lessonLink);

    // Add the lesson details to the lesson item
    lessonItem.appendChild(lessonDetails);

    // Add the lesson item to the lessons container
    lessonsContainer.appendChild(lessonItem);
  });

  // Clear the original content
  block.innerHTML = '';

  // Add the lessons container to the block
  block.appendChild(lessonsContainer);

  // In a real implementation, we would now fetch the lesson details from the paths
  // and update the lesson items with the actual titles and other information
  // This would typically be done via an API call or by loading the pages directly

  // For example:
  // const lessonItems = block.querySelectorAll('.lesson-details');
  // lessonItems.forEach(async (item) => {
  //   const path = item.getAttribute('data-lesson-path');
  //   const lessonData = await fetchLessonData(path);
  //   const titleEl = item.querySelector('.lesson-title');
  //   if (titleEl && lessonData.title) {
  //     titleEl.textContent = lessonData.title;
  //   }
  // });
}
