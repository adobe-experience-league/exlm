import { htmlToElement } from '../../../scripts/scripts.js';
import { waitFor, waitForChildElement, CUSTOM_EVENTS, isMobile, escapeHtml } from './atomic-search-utils.js';

export default function atomicQuerySummaryHandler(block, placeholders) {
  const baseElement = block.querySelector('atomic-query-summary');
  const searchInterface = block.querySelector('atomic-search-interface');

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
      const searchState = searchInterface.engine?.state;
      const { pagination, query } = searchState || {};
      const noOfResultsPerPage = pagination?.numberOfResults || 0;
      if (noOfResultsPerPage > 0) {
        const countTill = Math.min(pagination.firstResult + noOfResultsPerPage, pagination.totalCountFiltered);
        const resultCountText = `${pagination.firstResult + 1}${countTill > 1 ? `-${countTill}` : ''}`;
        const totalCount = Intl.NumberFormat().format(pagination.totalCountFiltered);
        const searchQuery = query?.q || '';
        const prefix = searchQuery
          ? `${placeholders.atomicSearchResultText || 'Search Results for'} ${searchQuery}`
          : placeholders.atomicSearchNoQueryResultText || 'Search Results';
        const ofText = placeholders.atomicSearchOfLabel || 'of';
        const queryElementWrap = baseElement.shadowRoot.querySelector('.result-query');
        if (
          queryElementWrap &&
          queryElementWrap.dataset.searchkey === searchQuery &&
          queryElementWrap.dataset.pagekey === resultCountText
        ) {
          return;
        }
        const resultTextElement = queryElementWrap || document.createElement('div');

        resultTextElement.innerHTML = '';

        const leftSpan = htmlToElement(`<span class="search-result-left" style="margin-right:8px"></span>`);
        leftSpan.textContent = prefix; // XSS protection - textContent is a safe sink, do not use innerHTML. UGP-13611

        const pageText = `${resultCountText} ${ofText} ${totalCount}`;

        const rightSpan = htmlToElement(`<span class="search-right"></span>`);
        rightSpan.textContent = pageText;

        resultTextElement.appendChild(leftSpan);
        resultTextElement.appendChild(rightSpan);

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
