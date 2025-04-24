import { decorateIcons, loadScript } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, getConfig, htmlToElement } from '../../scripts/scripts.js';
import atomicFacetHandler from './components/atomic-search-facet.js';
import atomicResultHandler from './components/atomic-search-result.js';
import atomicSortDropdownHandler from './components/atomic-search-sort-dropdown.js';
import atomicFacetManagerHandler from './components/atomic-search-facet-manager.js';
import atomicQuerySummaryHandler from './components/atomic-search-query-summary.js';
import atomicBreadBoxHandler from './components/atomic-search-breadbox.js';
import atomicPagerHandler from './components/atomic-search-pager.js';
import getCoveoAtomicMarkup from './components/atomic-search-template.js';
import { CUSTOM_EVENTS, debounce, handleHeaderSearchVisibility } from './components/atomic-search-utils.js';
import { isMobile } from '../header/header-utils.js';
import createAtomicSkeleton from './components/atomic-search-skeleton.js';

let placeholders = {};

async function initiateCoveoAtomicSearch() {
  return new Promise((resolve, reject) => {
    loadScript('https://static.cloud.coveo.com/atomic/v3.13.0/atomic.esm.js', { type: 'module' })
      .then(async () => {
        resolve(true);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export default function decorate(block) {
  const placeHolderPromise = fetchLanguagePlaceholders();

  const handleAtomicLibLoad = async () => {
    await customElements.whenDefined('atomic-search-interface');
    const searchInterface = block.querySelector('atomic-search-interface');
    const { coveoOrganizationId } = getConfig();

    // Initialization
    await searchInterface.initialize({
      accessToken: window.exlm.config.coveoToken,
      organizationId: coveoOrganizationId,
    });

    // Trigger a first search
    searchInterface.executeFirstSearch();

    Promise.all([
      customElements.whenDefined('atomic-result-list'),
      customElements.whenDefined('atomic-result'),
      customElements.whenDefined('atomic-result-multi-value-text'),
      customElements.whenDefined('atomic-search-box'),
      customElements.whenDefined('atomic-facet'),
      customElements.whenDefined('atomic-query-summary'),
      customElements.whenDefined('atomic-breadbox'),
      customElements.whenDefined('atomic-pager'),
    ]).then(() => {
      atomicFacetHandler(block.querySelector('atomic-facet'));
      atomicResultHandler(block.querySelector('atomic-result-list'));
      atomicSortDropdownHandler(block.querySelector('atomic-sort-dropdown'));
      atomicFacetManagerHandler(block.querySelector('atomic-facet-manager'));
      atomicQuerySummaryHandler(block.querySelector('atomic-query-summary'), placeholders);
      atomicBreadBoxHandler(block.querySelector('atomic-breadbox'));
      atomicPagerHandler(block.querySelector('atomic-pager'));

      handleHeaderSearchVisibility();
      decorateIcons(block);

      const onResize = () => {
        const isMobileView = isMobile();
        const view = isMobileView ? 'mobile' : 'desktop';
        if (view !== searchInterface.dataset.view) {
          searchInterface.dataset.view = view;
          const event = new CustomEvent(CUSTOM_EVENTS.RESIZED);
          document.dispatchEvent(event);
        }
      };
      const debouncedResize = debounce(200, onResize);
      const resizeObserver = new ResizeObserver(debouncedResize);
      resizeObserver.observe(searchInterface);

      document.addEventListener(
        CUSTOM_EVENTS.FACET_LOADED,
        () => {
          const skeleton = block.querySelector('.atomic-search-load-skeleton');
          if (skeleton) {
            block.removeChild(skeleton);
          }
        },
        { once: true },
      );
    });
  };

  const skeletonWrapper = htmlToElement(`<div class="atomic-search-load-skeleton">
    <div class="atomic-load-skeleton-head">
      <div class="atomic-load-skeleton"></div>
    </div>
    <div class="atomic-load-skeleton-main">
      <div></div>
      <div class="atomic-load-skeleton-left">
        <div class="atomic-load-mobile-header">
          <div class="atomic-load-mobile-query">
            <div class="atomic-load-mobile-search-text atomic-load-skeleton"></div>
            <div class="atomic-load-mobile-count atomic-load-skeleton"></div>
          </div>
          <div class="atomic-load-mobile-filter">
            <div class="atomic-load-mobile-icon atomic-load-skeleton"></div>
            <div class="atomic-load-mobile-sort atomic-load-skeleton"></div>
          </div>
        </div>
        <div class="atomic-load-facet-header">
          <div class="atomic-load-skeleton"></div>
        </div>
        <div class="atomic-load-facet-item">
          <div class="atomic-load-skeleton"></div>
        </div>
        <div class="atomic-load-facet-item">
          <div class="atomic-load-skeleton"></div>
        </div>
        <div  class="atomic-load-facet-item">
          <div class="atomic-load-skeleton"></div>
        </div>
      </div>
      <div class="atomic-load-skeleton-right">
        <div class="atomic-load-skeleton-filter">
          <div class="atomic-load-skeleton"></div>
          <div class="atomic-load-skeleton"></div>
        </div>
        <div class="atomic-load-skeleton-result">
          ${`${[...Array(10)]
            .map((_, i) => 10 - i)
            .map(() => {
              const element = createAtomicSkeleton();
              return element.innerHTML;
            })
            .join('')}`}
        </div>
      </div>
      <div></div>
    </div>
  </div>`);
  block.appendChild(skeletonWrapper);

  initiateCoveoAtomicSearch().then(async () => {
    try {
      placeholders = await placeHolderPromise;
    } catch {
      // no-op
    }
    const atomicUIElements = getCoveoAtomicMarkup(placeholders);
    block.appendChild(atomicUIElements);
    handleAtomicLibLoad();
  });
}
