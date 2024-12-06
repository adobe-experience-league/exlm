import { fetchLanguagePlaceholders, isPerspectivePage } from '../../scripts/scripts.js';
import { highlight, setLevels, hashFragment } from './utils.js';
import Dropdown, { DROPDOWN_VARIANTS } from '../../scripts/dropdown/dropdown.js';

/**
 * debounce fn execution
 */
const debounce = (ms, fn) => {
  let timer;
  // eslint-disable-next-line func-names
  return function (...args) {
    clearTimeout(timer);
    args.unshift(this);
    timer = setTimeout(fn(args), ms);
  };
};

/**
 * Registers a resize observer for the wrapper, executing the callback on resize events.
 * @param {Function} callback - The callback to execute on resize.
 */
function registerWrapperResizeHandler(callback, block) {
  const debouncedCallback = debounce(200, callback);
  const wrapperResizeObserver = new ResizeObserver(debouncedCallback);
  wrapperResizeObserver.observe(block);
}

function createDropdown(anchorTexts, block) {
  if (window.innerWidth < 900 && !block.querySelector('.custom-filter-dropdown')) {
    // eslint-disable-next-line no-new
    new Dropdown(block, 'Summary', anchorTexts, DROPDOWN_VARIANTS.ANCHOR); // Initialise mini-toc dropdown for mobile view
    const articleContainer = document.querySelector('.article-content-container');
    if (articleContainer) articleContainer.style.paddingTop = '0';
    window.addEventListener('hashchange', () => {
      const { hash } = window.location;
      const matchFound = anchorTexts.find((a) => {
        const [, linkHash] = a.value.split('#');
        return `#${linkHash}` === hash;
      });
      if (matchFound && Dropdown) {
        Dropdown.closeAllDropdowns();
      }
    });
  }
}

function setPadding(arg = '') {
  const num = parseInt(arg.split('')[1], 10);
  const indent = '-big';

  return num >= 3 ? `is-padded-left${indent.repeat(num - 2)}` : '';
}

function headerExclusions(header) {
  return (
    header.id.length > 0 &&
    !header.classList.contains('no-mtoc') &&
    !header.closest('details') &&
    !header.closest('sp-tabs')
  );
}

function getHeadingLevels() {
  const levels = document.querySelector('meta[name="mini-toc-levels"]');
  const headingLevels = setLevels(
    levels !== null && parseInt(levels.content, 10) > 0 ? parseInt(levels.content, 10) : undefined,
  );
  return headingLevels;
}

function buildMiniToc(block, placeholders) {
  const miniTOCHeading = placeholders?.onThisPage;
  const render = window.requestAnimationFrame;
  const miniTocQuerySelection = isPerspectivePage ? '.article-content-section' : 'main';
  const headingLevels = getHeadingLevels();
  const selectorQuery = headingLevels
    .split(',')
    .map((query) => `${miniTocQuerySelection} ${query}`)
    .join(',');
  const baseEl = block.closest(miniTocQuerySelection) ?? document;
  const headers = Array.from(baseEl.querySelectorAll(selectorQuery)).filter(headerExclusions);

  if (headers.length > 1) {
    const html = headers.map((i) => `<li><a href="#${i.id}" class="${setPadding(i.nodeName)}">${i.innerText}</a></li>`);
    // eslint-disable-next-line no-restricted-globals
    const url = new URL(location.href);
    const lhash = url.hash.length > 0;

    render(() => {
      const tocHeadingDivNode = `<div><h2>${miniTOCHeading}</h2></div>`;
      block.innerHTML = `${tocHeadingDivNode}\n<div class='scrollable-div'><ul>${html.join('\n')}</ul></div>`;

      let lactive = false;
      const anchors = Array.from(block.querySelectorAll('a'));

      if (isPerspectivePage) {
        const anchorTexts = anchors.map((anchor) => {
          const content = anchor.textContent;
          return {
            id: content,
            value: anchor.href,
            title: content,
          };
        });
        createDropdown(anchorTexts, block);
        registerWrapperResizeHandler(() => {
          createDropdown(anchorTexts, block);
        }, block);
      }

      let isAnchorScroll = false;
      if (anchors.length > 0) {
        anchors.forEach((i, idx) => {
          if (lhash === false && idx === 0) {
            i.classList.add('is-active');
            lactive = true;
          } else if (lhash && i.hash === url.hash) {
            i.classList.add('is-active');
            lactive = true;
          }

          i.addEventListener(
            'click',
            () => {
              const ahash = (i.href.length > 0 ? new URL(i.href).hash || '' : '').replace(/^#/, '');
              const activeAnchor = i;
              render(() => {
                anchors.forEach((a) => a.classList.remove('is-active'));
                activeAnchor.classList.add('is-active');

                if (ahash.length > 0) {
                  hashFragment(ahash);
                }
              });
              isAnchorScroll = true;
              setTimeout(() => {
                isAnchorScroll = false;
              }, 1000);
            },
            false,
          );

          if (lactive === false) {
            highlight(false);
          }
        });
        const debounceHighlight = debounce(10, () => highlight(false, isAnchorScroll));
        window.addEventListener('scroll', debounceHighlight);
      }
    });
  } else {
    render(() => {
      block.classList.add('hidden');
    });
  }
}

function observeElementHeadingChanges(element, block, placeholders) {
  let timeoutId = 0;
  const scheduleMiniTocBuild = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = 0;
    }
    timeoutId = setTimeout(() => {
      buildMiniToc(block, placeholders);
    }, 100);
  };
  const headingLevels = getHeadingLevels();
  const tagNamesToObserve = headingLevels.split(',').map((query) => query.split(':')[0]);
  const callback = (mutationsList) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (tagNamesToObserve.includes(node.nodeName.toLowerCase())) {
            scheduleMiniTocBuild();
          }
        });
        mutation.removedNodes.forEach((node) => {
          if (tagNamesToObserve.includes(node.nodeName.toLowerCase())) {
            scheduleMiniTocBuild();
          }
        });
      }
    }
  };

  const observer = new MutationObserver(callback);

  observer.observe(element, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }
  buildMiniToc(block, placeholders);

  if (window.hlx.aemRoot) {
    // This is strictly for UE flow for capturing the updates made to header tags and re-render Mini-TOC
    const miniTocQuerySelection = isPerspectivePage ? '.article-content-section' : 'main';
    const baseEl = block.closest(miniTocQuerySelection) ?? document;
    observeElementHeadingChanges(baseEl, block, placeholders);
  }
}
