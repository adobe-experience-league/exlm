import { waitFor, waitForChildElement, CUSTOM_EVENTS, isMobile, escapeHtml } from './atomic-search-utils.js';

export default function atomicQuerySummaryHandler(baseElement, placeholders) {
  baseElement.dataset.view = isMobile() ? 'mobile' : 'desktop';

  const updateQuerySummaryUI = () => {
    const atomicChildElement = baseElement.shadowRoot.firstElementChild;
    const resultTextElement = baseElement.shadowRoot.querySelector('.result-query');
    const lastSpan = resultTextElement.querySelector('span:last-child');
    atomicChildElement.style.display = 'none';
    resultTextElement.setAttribute('part', 'results');
    lastSpan.setAttribute('part', 'duration');
    if (isMobile()) {
      baseElement.setAttribute('mobile', '');
    } else {
      baseElement.removeAttribute('mobile');
    }
  };

  const handlerSummaryTextChanges = () => {
    const target = baseElement.shadowRoot.querySelector('[part~="container"]');
    const summaryText = target?.textContent ? escapeHtml(target?.textContent) : '';
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
        const resultText = searchQuery
          ? placeholders.atomicSearchResultText || 'Search Results for'
          : placeholders.atomicSearchNoQueryResultText || 'Search Results';
        resultTextElement.innerHTML = `<span style="margin-right: 8px;" class="search-result-left">${resultText}: ${searchQuery}</span> <span class="search-right">${pageText}</span>`;
        resultTextElement.dataset.searchkey = searchQuery;
        resultTextElement.dataset.pagekey = pageText;
        if (!queryElementWrap) {
          resultTextElement.className = 'result-query';
          baseElement.shadowRoot.appendChild(resultTextElement);
          updateQuerySummaryUI();
        }
        const event = new CustomEvent(CUSTOM_EVENTS.SEARCH_QUERY_CHANGED);
        document.dispatchEvent(event);
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
  document.addEventListener(CUSTOM_EVENTS.RESIZED, onResize);

  document.addEventListener(CUSTOM_EVENTS.NO_RESULT_FOUND, () => {
    const resultQueryEl = baseElement.shadowRoot.querySelector('.result-query');
    if (resultQueryEl) {
      baseElement.shadowRoot.removeChild(resultQueryEl);
    }
  });

  initAtomicQuerySummaryUI();
}
