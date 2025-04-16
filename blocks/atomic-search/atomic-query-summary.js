import { isMobile } from '../header/header-utils.js';
import { waitFor, waitForChildElement, debounce } from './atomicUtils.js';

export default function atomicQuerySummaryHandler() {
  const baseElement = document.querySelector('atomic-query-summary');

  const updateQuerySummaryUI = () => {
    const atomicChildElement = baseElement.shadowRoot.firstElementChild;
    const resultTextElement = baseElement.shadowRoot.querySelector('.result-query');
    atomicChildElement.style.display = 'none';
    if (isMobile()) {
      resultTextElement.style.cssText = `display: flex; flex-direction: column; font-size: 18px; color: #2C2C2C`;
      const lastSpan = resultTextElement.querySelector('span:last-child');
      lastSpan.style.cssText = `font-size: 14px; color: #4B4B4B`;
    } else {
      resultTextElement.style.cssText = '';
      const lastSpan = resultTextElement.querySelector('span:last-child');
      lastSpan.style.cssText = '';
    }
  };

  const handlerSummaryTextChanges = () => {
    const target = baseElement.shadowRoot.querySelector('[part~="container"]');
    const summaryText = target?.textContent;
    if (!target) {
      waitFor(handlerSummaryTextChanges);
      return;
    }
    if (summaryText) {
      const normalized = summaryText.replace(/\s+/g, ' ');
      const match = normalized.match(/Results?\s+((?:\d+-\d+|\d+) of [\d,]+)(?: for(.*?))? in\b/i);
      if (match) {
        const [, pageText, searchQuery = ''] = match;
        const queryElementWrap = baseElement.shadowRoot.querySelector('.result-query');
        if (
          queryElementWrap &&
          queryElementWrap.dataset.searchkey === searchQuery &&
          queryElementWrap.dataset.pagekey === pageText
        ) {
          return;
        }
        const resultTextElement = queryElementWrap || document.createElement('div');

        resultTextElement.innerHTML = `<span style="margin-right: 8px;" class="search-result-left">Search Results for: ${searchQuery}</span> <span class="search-right">${pageText}</span>`;
        resultTextElement.dataset.searchkey = searchQuery;
        resultTextElement.dataset.pagekey = pageText;
        if (!queryElementWrap) {
          resultTextElement.className = 'result-query';
          baseElement.shadowRoot.appendChild(resultTextElement);
          updateQuerySummaryUI();
        }
      }
      if (!baseElement.dataset.observed) {
        const observer = new MutationObserver((mutationsList) => {
          mutationsList.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
              handlerSummaryTextChanges();
            }
          });
        });

        observer.observe(target, {
          characterData: true,
          childList: true,
          subtree: true,
        });
        baseElement.dataset.observed = 'true';
      }
    }
  };

  const initAtomicQuerySummaryUI = () => {
    if (!baseElement.shadowRoot) {
      waitForChildElement(baseElement, initAtomicQuerySummaryUI);
      return;
    }
    handlerSummaryTextChanges();
  };

  function onResize() {
    const isMobileView = isMobile();
    const view = isMobileView ? 'mobile' : 'desktop';
    if (view !== baseElement.dataset.view) {
      baseElement.dataset.view = view;
      updateQuerySummaryUI();
    }
  }
  const debouncedResize = debounce(200, onResize);
  window.addEventListener('resize', debouncedResize);

  initAtomicQuerySummaryUI();
}
