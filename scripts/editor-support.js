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

/**
 * Event listener for aue:content-patch, edit of a component
 */
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

// switch to the selected tab
function handleSelectTabItem(tabItem) {
  // get the corresponding tabs button
  const buttonId = tabItem.getAttribute('aria-labelledby');
  const button = tabItem.closest('.tabs.block').querySelector(`button[id="${buttonId}"]`);
  // click it
  button.click();
}

// switch to the selected carousel slide
function handleSelectCarouselItem(carouselItem) {
  carouselItem.parentElement.scrollTo({
    top: 0,
    left: carouselItem.offsetLeft - carouselItem.parentNode.offsetLeft,
    behavior: 'instant',
  });
}

/**
 * Event listener for aue:ui-select, selection of a component
 */
function handleEditorSelect(event) {
  // we are only interested in the target
  if (!event.detail.selected) {
    return;
  }

  // if a tab panel was selected
  if (event.target.closest('.tabpanel')) {
    handleSelectTabItem(event.target.closest('.tabpanel'));
  }

  // if a teaser in a carousel was selected
  if (event.target.closest('.panel-container')) {
    handleSelectCarouselItem(event.target);
  }
}

document.querySelector('main')?.addEventListener('aue:ui-select', handleEditorSelect);

// handle reording of tabs
function handleMoveTabItem(detail) {
  // get tab button ids to get reordered
  const buttonMovedId = document
    .querySelector(`[data-aue-resource="${detail?.from?.component?.resource}"]`)
    ?.getAttribute('aria-labelledby');
  const buttonAfterId = document
    .querySelector(`[data-aue-resource="${detail?.to?.before?.resource}"]`)
    ?.getAttribute('aria-labelledby');
  if (buttonMovedId && buttonAfterId) {
    // get the tabs block
    const block = document.querySelector(`[data-aue-resource="${detail?.from?.container?.resource}"]`);
    // get the 2 buttons
    const moveButton = block.querySelector(`button[id="${buttonMovedId}"]`);
    const afterButton = block.querySelector(`button[id="${buttonAfterId}"]`);
    // do the reordering
    afterButton.before(moveButton);
    // fix data-tab-ids so that content-patch state store/restore works correctly
    block.querySelectorAll('button[role="tab"]').forEach((elem, i) => {
      elem.dataset.tabId = i;
    });
  }
}

// handle reordering of carousel slides
function handlerMoveSlide(detail) {
  // get the slide ids
  const slideMovedId = document.querySelector(`[data-aue-resource="${detail?.from?.component?.resource}"]`)?.dataset
    .panel;
  const slideAfterId = document.querySelector(`[data-aue-resource="${detail?.to?.before?.resource}"]`)?.dataset.panel;
  if (slideMovedId && slideAfterId) {
    // get the carousel buttons block
    const block = document.querySelector(
      `[data-aue-resource="${detail?.from?.container?.resource}"] .button-container`,
    );
    // get the 2 buttons
    const moveButton = block.querySelector(`button[data-panel="${slideMovedId}"]`);
    const afterButton = block.querySelector(`button[data-panel="${slideAfterId}"]`);
    // do the reordering
    afterButton.before(moveButton);
  }
}

/**
 * Event listener for aue:content-move,  moving a component
 */
function handleEditorMove(event) {
  // if a tab panel was moved
  if (event.target.closest('.tabpanel')) {
    handleMoveTabItem(event.detail);
  }

  // if a carousel slide was moved
  if (event.target.closest('.panel-container')) {
    handlerMoveSlide(event.detail);
  }
}

document.querySelector('main')?.addEventListener('aue:content-move', handleEditorMove);

// group editable texts in single wrappers if applicable
//
// this should work reliably as the script executes after the scripts.js and hence all sections
// should be decorated already.
(function mergeRichtexts() {
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
})();
