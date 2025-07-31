/**
 * Decorator for lesson items block
 * @param {Element} block The lesson items block element
 */
export default function decorate(block) {
  // Add container class to the main block
  block.classList.add('lesson-items-container');
  
  // Create a container for lessons
  const lessonsContainer = document.createElement('div');
  lessonsContainer.classList.add('lesson-items');
  
  // Process each lesson item
  const lessonItems = Array.from(block.children);
  
  if (lessonItems.length > 0) {
    lessonItems.forEach((row, index) => {
      // Create lesson item
      const lessonItem = document.createElement('div');
      lessonItem.classList.add('lesson-item');
      
      // Add lesson number
      const lessonNumber = document.createElement('div');
      lessonNumber.classList.add('lesson-number');
      lessonNumber.textContent = index + 1;
      lessonItem.appendChild(lessonNumber);
      
      // Create lesson details container
      const lessonDetails = document.createElement('div');
      lessonDetails.classList.add('lesson-details');
      
      // Get the author path from the row
      const cells = Array.from(row.children);
      if (cells.length > 0) {
        const authorPath = cells[0].textContent.trim();
        
        if (authorPath) {
          // Create a link to the lesson
          const lessonLink = document.createElement('a');
          lessonLink.classList.add('lesson-link');
          lessonLink.href = authorPath;
          lessonLink.textContent = `Lesson ${index + 1} - ${authorPath}`;
          lessonDetails.appendChild(lessonLink);
        }
      }
      
      // Add the lesson details to the lesson item
      lessonItem.appendChild(lessonDetails);
      
      // Add the lesson item to the lessons container
      lessonsContainer.appendChild(lessonItem);
    });
  } else {
    // No lessons found
    const noLessons = document.createElement('div');
    noLessons.classList.add('no-lessons');
    noLessons.textContent = 'No lessons available.';
    lessonsContainer.appendChild(noLessons);
  }
  
  // Clear the block and add the lessons container
  block.innerHTML = '';
  block.appendChild(lessonsContainer);
}
