import { clearIconHandler } from './atomic-search-box.js';
import {
  waitFor,
  CUSTOM_EVENTS,
  observeShadowRoot,
  updateHash,
  hasContentTypeFilter,
  COMMUNITY_CONTENT_TYPES,
} from './atomic-search-utils.js';
import { htmlToElement } from '../../../scripts/scripts.js';

export default function atomicNoResultHandler(block, placeholders) {
  const searchInterface = block.querySelector('atomic-search-interface');
  const facetSection = block.querySelector('atomic-layout-section[section="facets"]');
  const baseElement = block.querySelector('atomic-no-results');
  let buildBreadcrumbManagerFn = null;
  const { engine } = searchInterface;
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

        const labels = {
          clearFilters: placeholders?.searchNoResultsClearFiltersButton || 'Clear filters for more results',
          clearSearch: placeholders?.searchNoResultsClearSearchLabel || 'Clear search and try a more general term',
          noResultsText: placeholders?.searchNoResultsTextLabel || 'We are sorry, no results were found matchings:',
        };

        const createButton = (label, onClick) => {
          const button = htmlToElement(`<button part="clear-button">${label}</button>`);
          button.addEventListener('click', onClick);
          return button;
        };

        const clearFiltersButton = createButton(labels.clearFilters, () => updateHash((key) => key.includes('q='), ''));

        const clearSearchButton = createButton(labels.clearSearch, () => updateHash((key) => !key.includes('q='), '&'));

        const decorateNoResults = async () => {
          // Remove the 'f-el_status' when community content type is unchecked
          if (!hasContentTypeFilter(COMMUNITY_CONTENT_TYPES)) {
            updateHash((key) => !key.includes('f-el_status'), '&');
          }
          const shadowElement = baseElement?.shadowRoot;
          if (shadowElement) {
            const defaultAtomicContent = shadowElement.querySelector('div');
            if (defaultAtomicContent) {
              defaultAtomicContent.classList?.remove('items-center');
              const noResultsText = defaultAtomicContent.querySelector('[part="no-results"]');
              const mainSection = block.querySelector("atomic-layout-section[section='main']");
              const clearFiltersText = baseElement.querySelector('.clear-filters-text');
              if (noResultsText) {
                noResultsText.firstChild.textContent = `${labels.noResultsText} `;
              }
              if (!buildBreadcrumbManagerFn) {
                // eslint-disable-next-line import/no-relative-packages
                const module = await import('../../../scripts/coveo-headless/libs/browser/headless.esm.js');
                buildBreadcrumbManagerFn = module.buildBreadcrumbManager;
              }

              const breadcrumbManager = buildBreadcrumbManagerFn(engine);
              const unsubscribe = breadcrumbManager.subscribe(() => {
                const hasFilters = breadcrumbManager.state.hasBreadcrumbs;
                facetSection?.classList.toggle('all-facets-hidden', !hasFilters);
                mainSection?.classList.toggle('atomic-no-result', !hasFilters);
                clearFiltersButton.remove();
                clearSearchButton.remove();
                if (hasFilters) {
                  defaultAtomicContent.appendChild(clearFiltersButton);
                } else {
                  defaultAtomicContent.appendChild(clearSearchButton);
                  clearFiltersText?.remove();
                }
              });
              unsubscribe();
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
            decorateNoResults();
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
