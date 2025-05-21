import { decorateIcons, loadScript } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, getPathDetails, getConfig, htmlToElement } from '../../scripts/scripts.js';
import atomicFacetHandler from './components/atomic-search-facet.js';
import atomicResultHandler from './components/atomic-search-result.js';
import atomicSortDropdownHandler from './components/atomic-search-sort-dropdown.js';
import atomicFacetManagerHandler from './components/atomic-search-facet-manager.js';
import atomicQuerySummaryHandler from './components/atomic-search-query-summary.js';
import atomicBreadBoxHandler from './components/atomic-search-breadbox.js';
import atomicPagerHandler from './components/atomic-search-pager.js';
import atomicNoResultHandler from './components/atomic-search-no-results.js';
import getCoveoAtomicMarkup from './components/atomic-search-template.js';
import { CUSTOM_EVENTS, debounce, handleHeaderSearchVisibility } from './components/atomic-search-utils.js';
import { isMobile } from '../header/header-utils.js';
import createAtomicSkeleton from './components/atomic-search-skeleton.js';
import atomicSearchBoxHandler from './components/atomic-search-box.js';
import atomicResultPageHandler from './components/atomic-search-results-per-page.js';
import loadCoveoToken from '../../scripts/data-service/coveo/coveo-token-service.js';

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
  const renderAtomicShimmer = (insertBefore) => {
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
            <div class="atomic-load-skeleton-search-filter atomic-load-skeleton"></div>
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
    if (insertBefore && block.firstElementChild) {
      block.insertBefore(skeletonWrapper, block.firstElementChild);
    } else {
      block.appendChild(skeletonWrapper);
    }
  };
  const coveoTokenPromise = loadCoveoToken();
  const handleAtomicLibLoad = async () => {
    await customElements.whenDefined('atomic-search-interface');
    const searchInterface = block.querySelector('atomic-search-interface');
    const { coveoOrganizationId } = getConfig();
    const { lang: languageCode } = getPathDetails();
    const coveoToken = await coveoTokenPromise;

    // Initialization
    await searchInterface.initialize({
      accessToken: coveoToken,
      organizationId: coveoOrganizationId,
    });

    // Trigger a first search
    searchInterface.executeFirstSearch();

    const commonActionHandler = () => {
      atomicFacetHandler(block.querySelector('atomic-facet'));
      atomicSearchBoxHandler(block.querySelector('atomic-search-box'));
      atomicResultHandler(block, placeholders);
      atomicSortDropdownHandler(block.querySelector('atomic-sort-dropdown'));
      atomicFacetManagerHandler(block.querySelector('atomic-facet-manager'));
      atomicQuerySummaryHandler(block.querySelector('atomic-query-summary'), placeholders);
      atomicBreadBoxHandler(block.querySelector('atomic-breadbox'));
      atomicPagerHandler(block.querySelector('atomic-pager'));
      atomicResultPageHandler(block.querySelector('atomic-results-per-page'));
    };

    Promise.all([
      customElements.whenDefined('atomic-result-list'),
      customElements.whenDefined('atomic-result'),
      customElements.whenDefined('atomic-result-multi-value-text'),
      customElements.whenDefined('atomic-search-box'),
      customElements.whenDefined('atomic-facet'),
      customElements.whenDefined('atomic-query-summary'),
      customElements.whenDefined('atomic-breadbox'),
      customElements.whenDefined('atomic-pager'),
      customElements.whenDefined('atomic-no-results'),
      customElements.whenDefined('atomic-search-box'),
      customElements.whenDefined('atomic-results-per-page'),
    ]).then(() => {
      atomicNoResultHandler(block, placeholders);
      commonActionHandler();

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

      searchInterface.language = languageCode;
      searchInterface.i18n.addResourceBundle(languageCode, 'caption-el_contenttype', {
        Community: placeholders.searchContentTypeCommunityLabel || 'Community',
        Documentation: placeholders.searchContentTypeDocumentationLabel || 'Documentation',
        Troubleshooting: placeholders.searchContentTypeTroubleshootingLabel || 'Troubleshooting',
        Tutorial: placeholders.searchContentTypeTutorialLabel || 'Tutorial',
        Event: placeholders.searchContentTypeEventLabel || 'Event',
        Playlist: placeholders.searchContentTypePlaylistLabel || 'Playlist',
        Perspective: placeholders.searchContentTypePerspectiveLabel || 'Perspective',
        Certification: placeholders.searchContentTypeCertificationLabel || 'Certification',
        Blogs: placeholders.searchContentTypeCommunityBlogsLabel || 'Blogs',
        Discussions: placeholders.searchContentTypeCommunityDiscussionsLabel || 'Discussions',
        Ideas: placeholders.searchContentTypeCommunityIdeasLabel || 'Ideas',
        Questions: placeholders.searchContentTypeCommunityQuestionsLabel || 'Questions',
      });

      searchInterface.i18n.addResourceBundle(languageCode, 'caption-el_role', {
        Admin: placeholders.searchRoleAdminLabel || 'Admin',
        Developer: placeholders.searchRoleDeveloperLabel || 'Developer',
        Leader: placeholders.searchRoleLeaderLabel || 'Leader',
        User: placeholders.searchRoleUserLabel || 'User',
      });

      searchInterface.i18n.addResourceBundle(languageCode, 'caption-el_status', {
        true: placeholders.searchResolvedLabel || 'Resolved',
        false: placeholders.searchUnresolvedLabel || 'Unresolved',
      });

      searchInterface.i18n.addResourceBundle(languageCode, 'translation', {
        Name: placeholders.searchNameLabel || 'Name',
        'Content Type': placeholders.searchContentTypeLabel || 'Content Type',
        Content: placeholders.searchContentLabel || 'Content',
        Product: placeholders.searchProductLabel || 'Product',
        Updated: placeholders.searchUpdatedLabel || 'Updated',
        Role: placeholders.searchRoleLabel || 'Role',
        Date: placeholders.searchDateLabel || 'Date',
        'Newest First': placeholders.searchNewestFirstLabel || 'Newest First',
        'Oldest First': placeholders.searchOldesFirstLabel || 'Oldest First',
        'Most Likes': placeholders.searchMostLikesLabel || 'Most Likes',
        'Most Replies': placeholders.searchMostRepliesLabel || 'Most Replies',
        'Most Views': placeholders.searchMostViewsLabel || 'Most Views',
        clear: placeholders.searchClearLabel || 'Clear',
        filters: placeholders.searchFiltersLabel || 'Filters',
      });

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

      document.addEventListener(CUSTOM_EVENTS.NO_RESULT_FOUND, () => {
        const skeleton = block.querySelector('.atomic-search-load-skeleton');
        if (skeleton) {
          block.removeChild(skeleton);
        }
        const baseSummaryQueryEl = block.querySelector('atomic-query-summary');
        if (baseSummaryQueryEl) {
          baseSummaryQueryEl.dataset.observed = '';
        }
      });

      document.addEventListener(CUSTOM_EVENTS.RESULT_FOUND, () => {
        if (!block.querySelector('.atomic-search-load-skeleton')) {
          renderAtomicShimmer(true);
        }
        setTimeout(() => {
          commonActionHandler();
        }, 200);
      });
    });
  };

  renderAtomicShimmer();
  initiateCoveoAtomicSearch().then(async () => {
    try {
      placeholders = await fetchLanguagePlaceholders();
    } catch {
      // no-op
    }
    const atomicUIElements = getCoveoAtomicMarkup(placeholders);
    block.appendChild(atomicUIElements);
    handleAtomicLibLoad();
  });
}
