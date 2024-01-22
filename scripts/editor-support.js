import {
  decorateBlock, decorateButtons, decorateIcons, loadBlock,
} from './lib-franklin.js';

function handleEditorUpdate(event) {
  const { detail: { requestData, responseData } } = event;
  const target = requestData?.target;
  const updates = responseData?.updates;
  Promise.all(updates
    .map(async (update) => {
      const { resource } = target;
      const { content } = update;
      const block = document.querySelector(`[data-aue-resource="${resource}"]`);
      if (block && resource?.startsWith('urn:aemconnection:')) {
        const newBlockDocument = new DOMParser().parseFromString(content, 'text/html');
        const newBlock = newBlockDocument?.querySelector(`[data-aue-resource="${resource}"]`);
        if(newBlock) {
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
          newBlock.style.display = null;
          return Promise.resolve();
        }
      }
      return Promise.reject();
    }))
    .catch(() => {
      // fallback to a full reload if any item could not be reloaded
      window.location.reload();
    });
}

document.addEventListener('aue:content-patch', handleEditorUpdate);
