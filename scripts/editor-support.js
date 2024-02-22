import {
  decorateBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  loadBlock,
  loadBlocks,
} from './lib-franklin.js';
// eslint-disable-next-line import/no-unresolved
import { decorateRichtext } from './editor-support-rte.js';
import { decorateMain, loadIms } from './scripts.js';

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

async function applyChanges(event) {
  // redecorate default content and blocks on patches (in the properties rail)
  const { detail } = event;

  const resource =
    detail?.request?.target?.resource || // update, patch components
    detail?.request?.target?.container?.resource || // update, patch, add to sections
    detail?.request?.to?.container?.resource; // move in sections
  if (!resource) return false;
  const updates = detail?.response?.updates;
  if (!updates.length) return false;
  const { content } = updates[0];
  if (!content) return false;

  const parsedUpdate = new DOMParser().parseFromString(content, 'text/html');
  const element = document.querySelector(`[data-aue-resource="${resource}"]`);

  if (element) {
    if (element.matches('main')) {
      const newMain = parsedUpdate.querySelector(`[data-aue-resource="${resource}"]`);
      newMain.style.display = 'none';
      element.insertAdjacentElement('afterend', newMain);
      decorateMain(newMain);
      decorateRichtext(newMain);
      await loadBlocks(newMain);
      element.remove();
      newMain.style.display = null;
      // eslint-disable-next-line no-use-before-define
      attachEventListners(newMain);
      return true;
    }

    const block =
      element.parentElement?.closest('.block[data-aue-resource]') || element?.closest('.block[data-aue-resource]');
    if (block) {
      const state = getState(block);
      const blockResource = block.getAttribute('data-aue-resource');
      const newBlock = parsedUpdate.querySelector(`[data-aue-resource="${blockResource}"]`);
      if (newBlock) {
        newBlock.style.display = 'none';
        block.insertAdjacentElement('afterend', newBlock);
        decorateButtons(newBlock);
        decorateIcons(newBlock);
        decorateBlock(newBlock);
        await loadBlock(newBlock);
        block.remove();
        newBlock.style.display = null;
        restoreState(newBlock, state);
        return true;
      }
    } else {
      // sections and default content, may be multiple in the case of richtext
      const newElements = parsedUpdate.querySelectorAll(
        `[data-aue-resource="${resource}"],[data-richtext-resource="${resource}"]`,
      );
      if (newElements.length) {
        const { parentElement } = element;
        if (element.matches('.section')) {
          const [newSection] = newElements;
          newSection.style.display = 'none';
          element.insertAdjacentElement('afterend', newSection);
          decorateButtons(newSection);
          decorateIcons(newSection);
          decorateRichtext(newSection);
          decorateSections(parentElement);
          decorateBlocks(parentElement);
          await loadBlocks(parentElement);
          element.remove();
          newSection.style.display = null;
        } else {
          element.replaceWith(...newElements);
          decorateButtons(parentElement);
          decorateIcons(parentElement);
          decorateRichtext(parentElement);
        }
        return true;
      }
    }
  }

  return false;
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
    // switch to the selected tab
    const tabItem = event.target.closest('.tabpanel');
    // get the corresponding tabs button
    const buttonId = tabItem.getAttribute('aria-labelledby');
    const button = tabItem.closest('.tabs.block').querySelector(`button[id="${buttonId}"]`);
    // click it
    button.click();
  }

  // if a teaser in a carousel was selected
  if (event.target.closest('.panel-container')) {
    // switch to the selected carousel slide
    const carouselItem = event.target;
    carouselItem.parentElement.scrollTo({
      top: 0,
      left: carouselItem.offsetLeft - carouselItem.parentNode.offsetLeft,
      behavior: 'instant',
    });
  }
}

function attachEventListners(main) {
  ['aue:content-patch', 'aue:content-update', 'aue:content-add', 'aue:content-move', 'aue:content-remove'].forEach(
    (eventType) =>
      main?.addEventListener(eventType, async (event) => {
        event.stopPropagation();
        const applied = await applyChanges(event);
        if (!applied) window.location.reload();
      }),
  );

  main.addEventListener('aue:ui-select', handleEditorSelect);
}

attachEventListners(document.querySelector('main'));

// temporary workaround until aue:ui-edit and aue:ui-preview events become available
// show/hide sign-up block when switching betweeen UE Edit mode and preview
const signUpBlock = document.querySelector('.block.sign-up');
if (signUpBlock) {
  // check if user is signed in
  try {
    await loadIms();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }

  new MutationObserver((e) => {
    e.forEach((change) => {
      if (change.target.classList.contains('adobe-ue-edit')) {
        signUpBlock.style.display = 'block';
      } else {
        signUpBlock.style.display = window.adobeIMS?.isSignedInUser() ? 'none' : 'block';
      }
    });
  }).observe(document.documentElement, { attributeFilter: ['class'] });
}
