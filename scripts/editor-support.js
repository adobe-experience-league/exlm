import {
  decorateBlock,
  decorateButtons,
  decorateIcons,
  loadBlock,
} from './lib-franklin.js';

function handleEditorUpdate(event) {
  const {
    detail: { itemids },
  } = event;
  Promise.all(
    itemids
      .map((itemId) => document.querySelector(`[itemid="${itemId}"]`))
      .map(async (element) => {
        const block = element.closest('.block');
        const blockItemId = block?.getAttribute('itemid');
        if (block && blockItemId?.startsWith('urn:aemconnection:')) {
          const path = blockItemId.substring(18);
          const resp = await fetch(`${path}.html${window.location.search}`);
          if (resp.ok) {
            const text = await resp.text();
            const newBlock = new DOMParser().parseFromString(text, 'text/html')
              .body.firstElementChild;
            // hide the new block, and insert it after the existing one
            newBlock.style.display = 'none';
            block.insertAdjacentElement('afterend', newBlock);
            // decorate buttons and icons
            decorateButtons(newBlock);
            decorateIcons(newBlock);
            // decorate and load the block
            decorateBlock(newBlock);
            await loadBlock(newBlock);
            // remove the old block and show the new one
            block.remove();
            newBlock.style.display = 'unset';
            return Promise.resolve();
          }
        }
        return Promise.reject();
      }),
  ).catch(() => {
    // fallback to a full reload if any item could not be reloaded
    window.location.reload();
  });
}

document.addEventListener('editor-update', handleEditorUpdate);
