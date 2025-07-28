import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { getMetadata } from '../../scripts/scripts.js';

/**
 * Decorates the skill track lessons block
 * @param {Element} block The skill track lessons block element
 */
export default function decorate(block) {
  // Add main container class
  block.classList.add('skill-track-lessons-container');

  // Get all rows in the block
  const rows = [...block.children];

  // Create a container for all lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('skill-track-lessons');

  // Process each lesson path row
  rows.forEach((row, index) => {
    const lessonPathCell = row.querySelector(':scope > div');
    if (lessonPathCell) {
      const lessonPath = lessonPathCell.textContent.trim();
      if (lessonPath) {
        // Create a lesson item
        const lessonItem = document.createElement('div');
        lessonItem.classList.add('skill-track-lesson-item');

        // Add lesson number
        const lessonNumber = document.createElement('div');
        lessonNumber.classList.add('lesson-number');
        lessonNumber.textContent = index + 1;
        lessonItem.appendChild(lessonNumber);

        // Fetch lesson details (this would typically be done via an API call)
        // For now, we'll create a placeholder that would be replaced with actual data
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
      }
    }

    // Remove the original row
    row.remove();
  });

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
