import { decorateBlock, decorateButtons, decorateIcons, loadBlock } from './lib-franklin.js';

const connectionPrefix = 'urn:aemconnection:';

// set aem content root
window.hlx.aemRoot = '/content/exlm/global';

// extracts the title independent active tab of a tabs component
function getSelectedTab(block) {
  return block.querySelector('[aria-selected="true"]').getAttribute('data-tab-id');
}

// reactivates the previously active tab on the new edited block
function setSelectedTab(id, newBlock) {
  // click the previously slected tab
  newBlock.querySelector(`[data-tab-id="${id}"]`).click();
}

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
        if (block && blockItemId?.startsWith(connectionPrefix)) {
          const path = blockItemId.substring(connectionPrefix.length);

          // keep info about currently selected tab
          const activeTabId = block.classList.contains('tabs') ? getSelectedTab(block) : null;

          const resp = await fetch(`${path}.html${window.location.search}`);
          if (resp.ok) {
            const text = await resp.text();
            const newBlock = new DOMParser().parseFromString(text, 'text/html').body.firstElementChild;
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
            newBlock.style.display = null;

            if (activeTabId) setSelectedTab(activeTabId, newBlock);

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

// group editable texts in single wrappers if applicable
//
// this should work reliably as the script executes while the main script waits for the lcp content.
// so we can wait for the last section to be initialized before we merge grouped text components
// here into a single wrapper.
const aueDataAttrs = [
  'aueBehavior',
  'aueProp',
  'aueResource',
  'aueType',
  'aueFilter',
];

function removeInstrumentation(on) {
  aueDataAttrs.forEach((attr) => delete on.dataset[attr]);
}

function moveInstrumentation(from, to) {
  aueDataAttrs.forEach((attr) => {
    to.dataset[attr] = from.dataset[attr];
  });
  removeInstrumentation(from);
}

new MutationObserver((mutations, observe) => {
  for (let i = 0; i < mutations.length; i += 1) {
    const { target } = mutations[i];
    const { sectionStatus } = target.dataset;
    if (sectionStatus) {
      // any of initialized, loading or loaded
      const editables = [...document.querySelectorAll('[data-aue-type="richtext"]:not(div)')];
      while (editables.length) {
        const editable = editables.shift();
        // group rich texts
        // eslint-disable-next-line object-curly-newline
        const { aueProp, aueResource } = editable.dataset;
        const container = document.createElement('div');
        moveInstrumentation(editable, container);
        editable.replaceWith(container);
        container.append(editable);
        while (editables.length) {
          const nextEditable = editables.shift();
          // TODO: check if nextEditable is a consecutive sibling of the current editable.
          // should never happane, as AEM renders the paragraphs of a single text component
          // conescutively anyway. however there may be some inference with auto blocking
          // eventually.
          const { aueProp: nextAueProp, aueResource: nextAueResource } = nextEditable.dataset;
          if (aueProp === nextAueProp && nextAueResource === aueResource) {
            removeInstrumentation(nextEditable);
            container.append(nextEditable);
          } else {
            editables.unshift(nextEditable);
            break;
          }
        }
      }
      observe.disconnect();
      return;
    }
  }
}).observe(
  document.querySelector('main > div:last-child'),
  { attributeFilter: ['data-section-status'] },
);
