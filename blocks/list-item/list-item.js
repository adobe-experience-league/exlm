import { loadBlock, updateSectionsStatus } from '../../scripts/lib-franklin.js';

const INNER_BLOCK_LIST = ['note', 'code', 'video-embed'];

function decorateListContainer(items, listType) {
  const container = document.createElement(listType);
  items.forEach((item) => {
    const li = document.createElement('li');
    li.appendChild(item);
    container.appendChild(li);
  });
  return container;
}

function setBlockNameFromClass(listContent) {
  const blockTypes = INNER_BLOCK_LIST;
  blockTypes.forEach((type) => {
    if ([...listContent.classList].some((c) => c.includes(type))) {
      listContent.dataset.blockName = type;
    }
  });
}

export default function decorate(block) {
  const listContents = [...block.children];
  listContents.forEach(async (listContent) => {
    // Extract class selection from first child
    const classesText = listContent.children[0];
    const classes = (classesText ? classesText.textContent.split(',') : [])
      .map((c) => c && c.trim())
      .filter((c) => !!c);

    // Extract remaining rows before clearing
    const rows = Array.from(listContent.children).slice(1);
    
    // Clear the entire DOM immediately after reading class selection
    listContent.innerHTML = '';
    
    listContent.classList.add(...classes);
    
    rows.forEach((row) => {
      const wrapper = document.createElement('div');
      wrapper.append(row);
      listContent.append(wrapper);
    });

    if (classes.includes('list-content')) {
      listContent.classList.add('default-content-wrapper');
    } else {
      listContent.classList.add('block');

      // Decorate the blocks
      setBlockNameFromClass(listContent);

      loadBlock(listContent).then(() => {
        updateSectionsStatus(document.querySelector('main'));
      });
    }
  });

  // Check if this block is the last block inside its .list-item-container parent
  const parent = block.closest('.list-item-container');
  if (parent && block.parentElement.nextElementSibling === null) {
    const items = Array.from(parent.querySelectorAll('.list-item-wrapper'));
    const listType = parent.dataset?.listType || 'ul';
    const list = decorateListContainer(items, listType);
    parent.replaceChildren(list);
  }
}
