import { decorateIcons } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  block.classList.add('key-takeaways-block');

  // Extract content from the block using destructuring
  const [titleElement, contentElement] = [...block.children];

  const titleText = titleElement?.querySelector('div')?.textContent;
  const contentList = contentElement?.querySelector('div > ul');

  // Create container
  const container = document.createElement('div');
  container.className = 'key-takeaways-container';
  const title = document.createElement(headingType);
  title.id = 'key-takeaways-title';
  title.textContent = titleText;
  container.appendChild(title);
  contentList.className = 'key-takeaways-list';
  container.appendChild(contentList);

  // Clear the block and append the new structure
  block.textContent = '';
  block.appendChild(container);
  decorateIcons(block);
}
