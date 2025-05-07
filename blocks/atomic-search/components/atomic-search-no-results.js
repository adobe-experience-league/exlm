import { clearIconHandler } from './atomic-search-box.js';
import { waitFor, CUSTOM_EVENTS, observeShadowRoot, fragment } from './atomic-search-utils.js';
import { htmlToElement } from '../../../scripts/scripts.js';
import {
  buildBreadcrumbManager,
// eslint-disable-next-line import/no-relative-packages
} from '../../../scripts/coveo-headless/libs/browser/headless.esm.js';

export default function atomicNoResultHandler(block) {
  const searchInterface = block.querySelector('atomic-search-interface');
  const facetSection = block.querySelector('atomic-layout-section[section="facets"]');
  const baseElement = block.querySelector('atomic-no-results');
  const { engine } = searchInterface;
  // const { updateQuery } = loadQueryActions(engine);
  // const { executeSearch } = loadSearchActions(engine);
  if (baseElement && !baseElement.dataset.observed) {
    waitFor(() => {
      if (!baseElement.dataset.observed) {
        baseElement.dataset.observed = 'true';

        const toggleResultHeaderClass = (add) => {
          const layoutSectionEl = block.querySelector('atomic-layout-section[section="results"]');
          const resultHeader = layoutSectionEl?.querySelector('.result-header-section');
          if (resultHeader) {
            resultHeader.classList.toggle('result-header-inactive', add);
          }
        };

        const attachCustomHtml = async () => {
          const shadowElement = baseElement?.shadowRoot;
          if (shadowElement) {
            const defaultAtomicContent = shadowElement.querySelector('div');
            if (defaultAtomicContent) {
              defaultAtomicContent.classList?.remove('items-center');
              const noResultsText = defaultAtomicContent.querySelector('[part="no-results"]');
              const clearFiltersText = baseElement.querySelector('.clear-filters-text');
              // console.log(clearFiltersText);
              if (noResultsText) {
                noResultsText.firstChild.textContent = 'We are sorry, no results were found matchings:';
              }
              const breadcrumbManager = buildBreadcrumbManager(engine);
              breadcrumbManager.subscribe(() => {
                const hasFilters = breadcrumbManager.state.hasBreadcrumbs;
                // console.log('Are any filters selected?', hasFilters);
                if (hasFilters) {
                  const clearFiltersButton =htmlToElement(`<button id="clearFilterBtn">Clear filters for more results</button>`);
                  defaultAtomicContent.appendChild(clearFiltersButton);
                  clearFiltersButton.addEventListener('click', () => {
                    const hash = fragment();
                    const splitHashWithoutSearchQuery = hash.split('&').filter((key) => key.includes('q='));
                    const updatedHash = splitHashWithoutSearchQuery.join('');
                    window.location.hash = updatedHash;
                  })
                  facetSection?.classList.remove('all-facets-hidden');
                } else {

                  const clearSearchBtn = htmlToElement(`<button id="clearSearchBtn">Clear search and try a more general term</button>`);
                  defaultAtomicContent.appendChild(clearSearchBtn);

                  clearSearchBtn.addEventListener('click', () => {
                    const hash = fragment();
                    const splitHashWithoutSearchQuery = hash.split('&').filter((key) => !key.includes('q='));
                    const updatedHash = splitHashWithoutSearchQuery.join('&');
                    window.location.hash = updatedHash;
                  });
                  facetSection?.classList.add('all-facets-hidden');
                  clearFiltersText?.remove();
                }
              });
            }
          }
        };

        const handleSearchClearIcon = () => {
          const searchElement = block.querySelector('atomic-search-box');
          const clearIcon = searchElement?.shadowRoot?.querySelector('[part="clear-button"]');
          clearIconHandler(clearIcon);
        };

        observeShadowRoot(baseElement, {
          onPopulate: () => {
            toggleResultHeaderClass(true);
            document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.NO_RESULT_FOUND));
            setTimeout(() => {
              handleSearchClearIcon();
            }, 100);
            attachCustomHtml();
          },
          onClear: () => {
            toggleResultHeaderClass(false);
            document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.RESULT_FOUND));
          },
        });
      }
    }, 300);
  }
}
