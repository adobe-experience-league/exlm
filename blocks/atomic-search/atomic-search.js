import { loadScript } from '../../scripts/lib-franklin.js';
import { getConfig } from '../../scripts/scripts.js';
import atomicFacetHandler from './atomic-facet.js';
import atomicResultHandler from './atomic-result.js';
import atomicSortDropdownHandler from './atomic-sort-dropdown.js';
import atomicFacetManagerHandler from './atomic-facet-manager.js';
import atomicQuerySummaryHandler from './atomic-query-summary.js';
import atomicBreadBoxHandler from './atomic-breadbox.js';
import atomicPagerHandler from './atomic-pager.js';
import getCoveoAtomicMarkup from './coveo-search-html-structure.js';

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

const handleHeaderSearchVisibility = () => {
  const exlHeader = document.querySelector('exl-header');
  if (exlHeader) {
    exlHeader.addEventListener('search-decorated', () => {
      const searchElement = exlHeader.shadowRoot.querySelector('.search');
      searchElement.style.visibility = 'hidden';
    });
  }
};

export default function decorate(block) {
  const handleAtomicLibLoad = async () => {
    await customElements.whenDefined('atomic-search-interface');
    const searchInterface = document.querySelector('atomic-search-interface');
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
      atomicFacetHandler();
      atomicResultHandler();
      atomicSortDropdownHandler();
      atomicFacetManagerHandler();
      atomicQuerySummaryHandler();
      atomicBreadBoxHandler();
      atomicPagerHandler();

      handleHeaderSearchVisibility();
    });
  };

  const atomicUIElements = getCoveoAtomicMarkup();
  initiateCoveoAtomicSearch().then(handleAtomicLibLoad);
  block.appendChild(atomicUIElements);
}
