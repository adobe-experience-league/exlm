import createAtomicSkeleton from './atomic-search-skeleton.js';
import {
  waitForChildElement,
  waitFor,
  debounce,
  CUSTOM_EVENTS,
  isMobile,
  handleHeaderSearchVisibility,
} from './atomic-search-utils.js';
import { ContentTypeIcons } from './atomic-search-icons.js';
import { decorateIcons } from '../../../scripts/lib-franklin.js';

export default function atomicResultHandler(baseElement) {
  const shadow = baseElement.shadowRoot;
  const container = shadow?.querySelector('[part="result-list"]');

  if (!container) {
    waitFor(() => {
      atomicResultHandler(baseElement);
    });
    return;
  }

  // Make result section hidden and start adding skeleton.
  container.style.cssText = 'display: none;';
  container.dataset.view = isMobile() ? 'mobile' : 'desktop';
  const skeletonWrapper = document.createElement('div');
  skeletonWrapper.setAttribute('part', 'skeleton');
  skeletonWrapper.innerHTML = `${[...Array(10)]
    .map((_, i) => 10 - i)
    .map(() => {
      const element = createAtomicSkeleton();
      return element.outerHTML;
    })
    .join('')}`;
  container.parentElement.appendChild(skeletonWrapper);
  handleHeaderSearchVisibility();

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
        const resultContentType = resultItem?.querySelector('.result-content-type');
        const contentTypeElWrap = resultContentType?.firstElementChild?.shadowRoot;

        if (!resultItem || !contentTypeElWrap) {
          waitFor(hydrateResult);
          return;
        }
        const contentTypeElParent = contentTypeElWrap?.querySelector('ul');
        if (!contentTypeElParent) {
          waitFor(hydrateResult);
          return;
        }
        if (!resultItem.dataset.decorated) {
          decorateIcons(resultItem);
          resultItem.dataset.decorated = 'true';
        }

        // Remove skeleton
        const skeleton = container.parentElement.querySelector('.atomic-skeleton');
        if (skeleton) {
          container.style.cssText = '';
          container.parentElement.removeChild(skeletonWrapper);
        }

        const productElWrap = resultItem?.querySelector('.result-product')?.firstElementChild?.shadowRoot;
        const productElements = productElWrap?.querySelectorAll('li') || [];
        const contentTypeElements = contentTypeElParent?.querySelectorAll('li') || [];

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
            const svgIcon = ContentTypeIcons[contentType] || '';
            if (contentType) resultContentType.classList.add(contentType);
            const svgElement = contentTypeEl.querySelector('span.svg-element');
            if (svgElement) {
              contentTypeEl.removeChild(svgElement);
            }
            if (svgIcon) {
              const svgWrapper = document.createElement('span');
              svgWrapper.setAttribute('part', 'svg-element');
              svgWrapper.className = 'svg-element';
              svgWrapper.innerHTML = `<span class="icon icon-${svgIcon}"></span>`;
              contentTypeEl.appendChild(svgWrapper);
            }
          }
        });
        if (contentTypeElements.length) {
          decorateIcons(contentTypeElParent);
        }

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
  const resizeObserver = new ResizeObserver(debouncedResize);
  resizeObserver.observe(container);

  // Add observer to check the loading of result items.
  const observer = new MutationObserver(updateAtomicResultUI);

  observer.observe(container, { childList: true, subtree: false });
}
