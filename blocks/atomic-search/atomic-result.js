import createAtomicSkeleton from './atomic-skeleton.js';
import { waitForChildElement, waitFor, debounce, CUSTOM_EVENTS } from './atomicUtils.js';
import { ContentTypeIcons } from './icons.js';
import { isMobile } from '../header/header-utils.js';

export default function atomicResultHandler() {
  const resultList = document.getElementById('coveo-results-list-wrapper');
  const shadow = resultList.shadowRoot;
  const container = shadow?.querySelector('[part="result-list"]');

  if (!container) {
    // console.log('[Coveo] Waiting for [part="result-list"] inside atomic-result-list...');
    waitFor(atomicResultHandler);
    return;
  }

  // Make result section hidden and start adding skeleton.
  container.style.cssText = 'display: none;';
  const skeletonWrapper = document.createElement('div');
  skeletonWrapper.style.cssText = 'display: flex; flex-direction: column';
  skeletonWrapper.innerHTML = `${[...Array(10)]
    .map((_, i) => 10 - i)
    .map(() => {
      const element = createAtomicSkeleton();
      return element.outerHTML;
    })
    .join('')}`;
  container.parentElement.appendChild(skeletonWrapper);

  function onClearBtnClick() {
    const atomicBreadBox = document.querySelector('atomic-breadbox');
    const coveoClearBtn = atomicBreadBox?.shadowRoot?.querySelector('[part="clear"]');
    if (coveoClearBtn) {
      coveoClearBtn.click();
    }
  }

  const clearAllBtn = document.querySelector('.clear-label');
  clearAllBtn.addEventListener('click', onClearBtnClick);

  const updateAtomicResultUI = () => {
    const results = container.querySelectorAll('atomic-result');
    const isMobileView = isMobile();
    container.dataset.view = isMobileView ? 'mobile' : 'desktop';
    results.forEach((resultEl) => {
      const hydrateResult = () => {
        const resultShadow = resultEl.shadowRoot;
        if (!resultShadow) {
          waitForChildElement(resultEl, hydrateResult);
          return;
        }

        const resultItem = resultShadow.querySelector(`.result-item.${isMobileView ? 'mobile-only' : 'desktop-only'}`);
        const contentTypeElWrap = resultItem?.querySelector('.result-content-type')?.firstElementChild?.shadowRoot;

        if (!resultItem || !contentTypeElWrap) {
          waitFor(hydrateResult);
          return;
        }
        const contentTypeElParent = contentTypeElWrap?.querySelector('ul');
        if (!contentTypeElParent) {
          waitFor(hydrateResult);
          return;
        }
        // Remove skeleton
        const skeleton = container.parentElement.querySelector('.atomic-skeleton');
        if (skeleton) {
          container.style.cssText = '';
          container.parentElement.removeChild(skeletonWrapper);
        }

        const productElWrap = resultItem?.querySelector('.result-product')?.firstElementChild?.shadowRoot;
        const productElements = productElWrap.querySelectorAll('li');
        const contentTypeElements = contentTypeElParent.querySelectorAll('li');

        contentTypeElements.forEach((contentTypeEl) => {
          const contentType = contentTypeEl.textContent.toLowerCase().trim();
          if (contentType.includes('|')) {
            contentTypeEl.style.cssText = `display: none !important`;
            const slotEl = contentTypeEl.firstElementChild;
            if (slotEl) {
              slotEl.style.cssText = `display: none`;
            }
          } else if (!isMobileView) {
            // UI effect is only for desktop.
            let colourCodes;
            switch (contentType) {
              case 'community':
                colourCodes = '#379947';
                break;
              case 'troubleshoot':
              case 'troubleshooting':
                colourCodes = '#7A42BF';
                break;
              case 'course':
                colourCodes = '#5151D3';
                break;
              case 'tutorial':
                colourCodes = '#C4A600';
                break;
              case 'event':
                colourCodes = '#A228AD';
                break;
              case 'documentation':
                colourCodes = '#0F797D';
                break;
              case 'playlist':
                colourCodes = '#30a7ff';
                break;

              case 'perspective':
                colourCodes = '#F29423';
                break;

              default:
                colourCodes = '#6E6E6E';
                break;
            }
            const svgIcon = ContentTypeIcons[contentType] || '';
            contentTypeEl.style.setProperty('--content-type-color', colourCodes);
            const svgElement = contentTypeEl.querySelector('span.svg-element');
            if (svgElement) {
              contentTypeEl.removeChild(svgElement);
            }
            if (svgIcon) {
              const svgWrapper = document.createElement('span');
              svgWrapper.className = 'svg-element';
              svgWrapper.style.cssText = `top: 2px; position: relative; max-height: 18px`; // For some reason stylesheet css was not working.
              svgWrapper.innerHTML = svgIcon;
              contentTypeEl.appendChild(svgWrapper);
            }
          }
        });

        productElements.forEach((productElement) => {
          const product = productElement.textContent.toLowerCase().trim();
          if (product?.includes('|')) {
            productElement.style.cssText = `display: none`;
            const slotEl = productElement.firstElementChild;
            if (slotEl) {
              slotEl.style.cssText = `display: none`;
            }
          }
        });
      };
      hydrateResult();
    });
    const event = new CustomEvent(CUSTOM_EVENTS.RESULT_UPDATED);
    document.dispatchEvent(event);
  };

  const onResize = () => {
    const isMobileView = isMobile();
    const view = isMobileView ? 'mobile' : 'desktop';
    if (view !== container.dataset.view) {
      updateAtomicResultUI();
    }
  };
  const debouncedResize = debounce(200, onResize);
  window.addEventListener('resize', debouncedResize);

  // Add observer to check the loading of result items.
  const observer = new MutationObserver(updateAtomicResultUI);

  observer.observe(container, { childList: true, subtree: false });
}
