/**
 * Generates the DOM structure for the course-summary block
 * @param {HTMLElement} block The course-summary block element
 * @returns {HTMLElement} The generated DOM structure
 */
export function generateCourseSummaryDOM(block) {
  const wrapper = document.createElement('div');
  wrapper.className = 'course-summary-wrapper';

  const courseSummaryBlock = document.createElement('div');
  courseSummaryBlock.className = 'course-summary-block';

  // Process the block content using destructuring
  const [titleText, contentList] = Array.from(block.children);

  if (titleText) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'course-summary-title';

    const heading = titleText.querySelector('h1,h2,h3,h4,h5,h6');
    titleDiv.append(heading || titleText.textContent.trim());

    courseSummaryBlock.append(titleDiv);
  }

  if (contentList) {
    const listDiv = document.createElement('div');
    listDiv.className = 'course-summary-list';
    listDiv.append(contentList);

    courseSummaryBlock.append(listDiv);
  }

  wrapper.append(courseSummaryBlock);
  return wrapper;
}

/**
 * Decorates the course-summary block
 * @param {HTMLElement} block The course-summary block element
 */
export default function decorate(block) {
  block.classList.add('course-summary');
  const dom = generateCourseSummaryDOM(block);
  block.textContent = '';
  block.append(dom);
}
