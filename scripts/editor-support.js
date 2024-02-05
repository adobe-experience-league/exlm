import { decorateBlock, decorateButtons, decorateIcons, loadBlock } from './lib-franklin.js';

const connectionPrefix = 'urn:aemconnection:';

// set aem content root
window.hlx.aemRoot = '/content/exlm/global';

// extract the visual state so we can restore it after applying updates
function getState(block) {
  const state = {};
  if (block.matches('.tabs')) state.activeTabId = block.querySelector('[aria-selected="true"]').dataset.tabId;
  if (block.matches('.carousel')) {
    const container = block.querySelector('.panel-container');
    state.scrollLeft = container.scrollLeft;
  }
  return state;
}

function restoreState(newBlock, state) {
  if (state.activeTabId) {
    newBlock.querySelector(`[data-tab-id="${state.activeTabId}"]`).click();
  }
  if (state.scrollLeft) {
    newBlock.querySelector('.panel-container').scrollTo({ left: state.scrollLeft, behavior: 'instant' });
  }
}

async function handleEditorUpdate(event) {
  const { detail } = event;

  const resource = detail?.requestData?.target?.resource;
  if (!resource) return;

  const element = document.querySelector(`[data-aue-resource="${resource}"]`);
  const block = element?.parentElement?.closest('.block') || element?.closest('.block');
  const blockResource = block?.getAttribute('data-aue-resource');
  if (!block || !blockResource?.startsWith(connectionPrefix)) return;

  // keep info about currently selected tab
  const uiState = getState(block);

  const updates = detail?.responseData?.updates;
  if (updates.length > 0) {
    const { content } = updates[0];
    const newBlockDocument = new DOMParser().parseFromString(content, 'text/html');
    const newBlock = newBlockDocument?.querySelector(`[data-aue-resource="${blockResource}"]`);
    if (newBlock) {
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

      restoreState(newBlock, uiState);
    }
  }
}

document.querySelector('main')?.addEventListener('aue:content-patch', handleEditorUpdate);

// group editable texts in single wrappers if applicable
//
// this should work reliably as the script executes while the main script waits for the lcp content.
// so we can wait for the last section to be initialized before we merge grouped text components
// here into a single wrapper.
const aueDataAttrs = ['aueBehavior', 'aueProp', 'aueResource', 'aueType', 'aueFilter'];

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
}).observe(document.querySelector('main > div:last-child'), { attributeFilter: ['data-section-status'] });
