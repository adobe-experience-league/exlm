/**
 * Generates the DOM structure for the key-takeaways block
 * @param {HTMLElement} block The key-takeaways block element
 * @returns {HTMLElement} The generated DOM structure
 */
export function generateKeyTakeawaysDOM(block) {
  const wrapper = document.createElement('div');
  wrapper.className = 'key-takeaways-wrapper';

  const keyTakeawaysBlock = document.createElement('div');
  keyTakeawaysBlock.className = 'key-takeaways-block';

  // Process the block content
  const rows = [...block.children];

  if (rows[0]) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'key-takeaways-title';

    const heading = rows[0].querySelector('h1,h2,h3,h4,h5,h6');
    titleDiv.append(heading || rows[0].textContent.trim());

    keyTakeawaysBlock.append(titleDiv);
  }

  if (rows[1]) {
    const listDiv = document.createElement('div');
    listDiv.className = 'key-takeaways-list';
    listDiv.append(rows[1]);

    keyTakeawaysBlock.append(listDiv);
  }

  wrapper.append(keyTakeawaysBlock);
  return wrapper;
}

/**
 * Decorates the key-takeaways block
 * @param {HTMLElement} block The key-takeaways block element
 */
export default function decorate(block) {
  block.classList.add('key-takeaways');
  const dom = generateKeyTakeawaysDOM(block);
  block.textContent = '';
  block.append(dom);
}
