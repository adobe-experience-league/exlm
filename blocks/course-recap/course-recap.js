/**
 * Generates the DOM structure for the course-recap block
 * @param {HTMLElement} block The course-recap block element
 * @returns {HTMLElement} The generated DOM structure
 */
export function generateCourseRecapDOM(block) {
  const wrapper = document.createElement('div');
  wrapper.className = 'course-recap-wrapper';

  const courseRecapBlock = document.createElement('div');
  courseRecapBlock.className = 'course-recap-block';

  // Process the block content using destructuring
  const [titleText, contentList] = Array.from(block.children);

  if (titleText) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'course-recap-title';

    const heading = titleText.querySelector('h1,h2,h3,h4,h5,h6');
    titleDiv.append(heading || titleText.textContent.trim());

    courseRecapBlock.append(titleDiv);
  }

  if (contentList) {
    const listDiv = document.createElement('div');
    listDiv.className = 'course-recap-list';
    listDiv.append(contentList);

    courseRecapBlock.append(listDiv);
  }

  wrapper.append(courseRecapBlock);
  return wrapper;
}

/**
 * Decorates the course-recap block
 * @param {HTMLElement} block The course-recap block element
 */
export default function decorate(block) {
  block.classList.add('course-recap');
  const dom = generateCourseRecapDOM(block);
  block.textContent = '';
  block.append(dom);
}
