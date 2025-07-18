import { renderAtomicSekeletonUI } from './atomic-search-skeleton.js';
import {
  waitForChildElement,
  waitFor,
  debounce,
  CUSTOM_EVENTS,
  isMobile,
  disconnectShadowObserver,
  observeShadowRoot,
} from './atomic-search-utils.js';
import { ContentTypeIcons } from './atomic-search-icons.js';
import { decorateIcons } from '../../../scripts/lib-franklin.js';
import { htmlToElement, getConfig } from '../../../scripts/scripts.js';
import { INITIAL_ATOMIC_RESULT_CHILDREN_COUNT } from './atomic-result-children.js';

const { communityTopicsUrl } = getConfig();
const MAX_HYDRATION_ATTEMPTS = 10;

export const atomicResultStyles = `
                  <style>
                    :host {
                      --content-type-playlist-color: #30a7ff;
                      --content-type-tutorial-color: #10cfa9;
                      --content-type-documentation-color: #0aa35b;
                      --content-type-community-color: #ffde2c;
                      --content-type-certification-color: #b6db00;
                      --content-type-troubleshooting-color: #ffa213;
                      --content-type-event-color: #ff709f;
                      --content-type-perspective-color: #c844dc;
                      --content-type-default-color: #000000;
                      --atomic-visited-link-color: #93219E;
                    }

                    .result-description atomic-result-multi-value-text::part(result-multi-value-text-list) {
                      gap: 4px;
                      margin-top: 10px;
                      flex-wrap: wrap;
                    }
                    
                    .result-description atomic-result-multi-value-text::part(result-multi-value-text-value) {
                      border: 1px solid #959595;
                      border-radius: 4px;
                      color: var(--non-spectrum-grey-updated);
                      font-size: 12px;
                      line-height: 15px;
                      padding: 5px;
                    }

                    .result-item {
                      display: none;
                      gap: 16px;
                      margin-left: 32px;
                    }
                    .result-item.mobile-only {
                      display: flex;
                      flex-direction: column;
                      gap: 2px;
                      margin-left: 0;
                    }
                    .atomic-search-result-item.mobile-only .result-field.result-thumbnail {
                      margin-top: 10px;
                    }
                    .result-root.recommendation-badge {
                          margin: 40px 0px 0px;
                    }
                    .atomic-search-result-item .result-field.text-thumbnail {
                      display: flex;
                      gap: 18px;
                    }
                    .atomic-search-result-item .result-field.text-thumbnail:not(:has(.result-thumbnail)) {
                      gap: 0;
                    }
                    .atomic-search-result-item .result-field.text-thumbnail:has(.result-thumbnail) .result-text {
                      flex: 0 0 56%;
                    }
                    .atomic-search-result-item.result-item .thumbnail-wrapper {
                      position: relative;
                      display: inline-block;
                      cursor: pointer;
                    } 
                    .atomic-search-result-item.result-item .thumbnail-img {
                      display: block;
                    }
                    .atomic-search-result-item.result-item .thumbnail-wrapper .icon-play-outline-white {
                      position: absolute;
                      left: 50%;
                      top: 50%;
                      transform: translate(-50%, -50%);
                      pointer-events: none;
                    }
                    .atomic-search-result-item.result-item .thumbnail-wrapper .icon-play-outline-white img {
                      width: 40px;
                      height: 40px;
                    }
                    .atomic-search-result-item .result-product .result-field-multi {
                      display: flex;
                      gap: 6px;
                      align-items: center;
                    }
                    .atomic-search-result-item .result-product .hidden {
                      display: none;
                    }
                    .atomic-search-result-item .result-product .result-field-title {
                      font-size: var(--spectrum-font-size-75);
                      text-transform: capitalize;
                    }
                    .atomic-search-result-item .tooltip-placeholder {
                      line-height: 0;
                      margin-top: 2px;
                    }
                    .atomic-search-result-item .tooltip {
                      display: inline;
                      position: relative;
                      margin: 2px 0 0 5px;
                    }
                    .atomic-search-result-item .tooltip .icon-info {
                      width: 14px;
                      height: 14px;
                    }
                    .atomic-search-result-item .tooltip svg {
                      pointer-events: none;
                    }
                    .atomic-search-result-item .tooltip .tooltip-text {
                      background-color: var(--non-spectrum-dim-gray);
                      border-radius: 4px;
                      color: var(--spectrum-gray-50);
                      display: inline-block;
                      font-size: var(--spectrum-font-size-50);
                      font-weight: normal;
                      line-height: var(--spectrum-line-height-xs);
                      margin-left: 10px;
                      opacity: 0;
                      padding: 4px 9px 5px 10px;
                      position: absolute;
                      top: 0;
                      transition: opacity 0.3s;
                      visibility: hidden;
                      width: max-content;
                      max-width: 155px;
                      z-index: 11;
                    }
                    .atomic-search-result-item .tooltip-top .tooltip-text {
                      transform: translateX(-50%);
                      top: unset;
                      left: 50%;
                      bottom: 100%;
                      margin: 0 0 2px;
                    }
                    .atomic-search-result-item .tooltip .tooltip-text::before {
                      border-color: transparent var(--non-spectrum-dim-gray) transparent transparent;
                      border-style: solid;
                      border-width: 4px;
                      content: '';
                      display: inline-block;
                      margin-top: -4px;
                      position: absolute;
                      right: 100%;
                      top: 50%;
                    }
                    .atomic-search-result-item .tooltip-top .tooltip-text::before {
                      margin-top: 0;
                      right: unset;
                      top: unset;
                      left: calc(50% - 7px);
                      bottom: -7px;
                      transform: rotate(-90deg);
                    }
                    .atomic-search-result-item .tooltip:hover .tooltip-text {
                      visibility: visible;
                      opacity: 1;
                    }
                    @media(min-width: 1024px) {
                      .result-item.desktop-only {
                        display: grid;
                        grid-template-columns: 1.5fr 0.5fr 0.6fr 0.4fr;
                        row-gap: 0;
                        margin-top: 8px;
                      }
                      .result-item.mobile-only {
                        display: none;
                      }
                      .atomic-search-result-item .result-product .result-field-title {
                        font-size: var(--spectrum-font-size-100);
                      }
                    }
                    .result-title {
                      position: relative;
                    }
                    atomic-result-section-excerpt, atomic-result-text {
                      font-size: var(--spectrum-font-size-75);
                      color: var(--non-spectrum-article-dark-gray);
                    }
                    atomic-result-section-excerpt {
                      color: #959595;
                      font-size: var(--spectrum-font-size-75);
                      display: -webkit-box;
                      -webkit-line-clamp: 3; 
                      -webkit-box-orient: vertical;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      margin: 6px 0 4px;
                      max-width: 90vw;
                    }
                    atomic-result-section-excerpt atomic-result-text {
                      color: #505050;
                      font-size: var(--spectrum-font-size-75);
                    }
                    .result-title atomic-result-text, .mobile-result-title atomic-result-text {
                      font-size: var(--spectrum-font-size-100);
                      color: var(--non-spectrum-dark-charcoal);
                      font-weight: bold;
                      overflow: hidden;
                      max-width: 90vw;
                      display: -webkit-box;
                      -webkit-line-clamp: 2; 
                      -webkit-box-orient: vertical;
                      overflow: hidden;
                      text-overflow: ellipsis;
                    }
                    .result-title atomic-result-text atomic-result-link, .mobile-result-title atomic-result-text atomic-result-link {
                      width: 100%;
                      display: block;
                    }
                    .result-title atomic-result-text {
                      font-size: var(--spectrum-font-size-200);
                      line-height: 20px;
                    }
                    .result-content-type {
                      display: flex;
                      justify-content: flex-start;
                    }
                    atomic-result-multi-value-text::part(svg-element) {
                      top: 2px;
                      position: relative;
                      max-height: 18px
                    }
                    .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-list) {
                      margin: 0 8px 0 0;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-wrap: wrap;
                    }
                    .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-value) {
                      width: fit-content;
                      font-size: var(--spectrum-font-size-75);
                      white-space: pre;
                      white-space: nowrap;
                    }
                    .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-separator) {
                      display: none;
                    }
                    .result-product > atomic-result-multi-value-text::part(result-multi-value-text-value) {
                      font-size: var(--spectrum-font-size-100);
                      color: var(--non-spectrum-web-gray);
                      display: block;
                    }
                    .result-product > atomic-result-multi-value-text::part(result-multi-value-text-list) {
                      flex-wrap: wrap;
                      gap: 4px;
                    }
                    .result-updated {
                      font-size: var(--spectrum-font-size-75);
                      text-align: left;
                    }
                    atomic-result-link {
                      position: relative;
                      color: #1E76E3;
                      font-size: var(--spectrum-font-size-50);
                      cursor: pointer;
                    }
                    atomic-result-link a {
                      text-decoration: none !important;
                    }
                    atomic-result-link > a:not([slot="label"]) {
                      left: 0;
                    }
                    .result-title atomic-result-link:has(a), .mobile-result-title atomic-result-link:has(a) {
                      display: block;
                      width: 100%;
                      overflow: hidden;
                      max-width: 90vw;
                      display: -webkit-box;
                      -webkit-line-clamp: 2; 
                      -webkit-box-orient: vertical;
                      text-overflow: ellipsis;
                    }
                    .result-title atomic-result-link a:visited > * {
                      color:  var(--atomic-visited-link-color);
                      visibility: visible;
                    }
                    atomic-result-link > a img {
                      display: inline-block;
                      margin-bottom: 6px;
                      margin-left: 4px;
                      height: 14px;
                      width: 14px;
                    }
                    atomic-result-link .icon-external-link {
                      display: none;
                    }
                    .result-icons-wrapper {
                      display: flex;
                      align-items: center;
                      gap: 8px;
                      margin: 2px 0;
                    }
                    .result-icon-item {
                      display: flex;
                      gap: 2px;
                      align-items: center;
                    }
                    .icon-text {
                      font-size: var(--spectrum-font-size-50);
                      color: var(--non-spectrum-grey-updated);
                      font-weight: bold;
                    }
                    .child-result-count {
                      display: none;
                    }
                    .mobile-result-info {
                      display: flex;
                      align-items: center;
                      gap: 12px;
                      justify-content: flex-start;
                    }
                    .mobile-result-title {
                        position: relative;
                     }    
                    .result-item.mobile-only .mobile-result-title atomic-result-link a:visited > * {
                      color:  var(--atomic-visited-link-color);
                      visibility: visible;
                    }
                    .result-item.mobile-only .mobile-result-title atomic-result-text {
                      font-size: var(--spectrum-font-size-200);
                      font-weight: bold;
                      color: var(--non-spectrum-dark-gray);
                    }
                    .mobile-result-info .result-field atomic-result-multi-value-text, .mobile-result-info .atomic-result-date, 
                    .mobile-result-info .result-product > atomic-result-multi-value-text::part(result-multi-value-text-value) {
                      font-size: var(--spectrum-font-size-75);
                    }
                    .mobile-result-info .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-value) {
                      padding: 0;
                    }
                    .mobile-description atomic-result-section-excerpt atomic-result-text {
                      font-size: var(--spectrum-font-size-75);
                      color: #505050;
                    }
                    .result-title .atomic-recommendation-badge, .mobile-result-title .atomic-recommendation-badge {
                      position: absolute;
                      background-color: var(--non-spectrum-dim-gray);
                      padding: 2px 8px;
                      border-radius: 4px;
                      font-size: var(--spectrum-font-size-75);
                      color: var(--spectrum-gray-50);
                      top: -28px;
                    }
                    @media(min-width: 1024px) {
                      .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-value) {
                        border: 1px solid var(--content-type-default-color);
                        border-radius: 4px;
                        padding: 4px 8px;
                        color: var(--content-type-default-color);
                        display: flex;
                        align-items: center;
                        flex-direction: row-reverse;
                        gap: 4px;
                        border: 1px solid #959595;
                        color: var(--non-spectrum-grey-updated);
                      }
                      .result-updated {
                        font-size: var(--spectrum-font-size-100);
                      }
                    }
                  </style>
`;

export const atomicResultListStyles = `
                <style>
                  atomic-folded-result-list::part(outline)::before {
                    background-color:var(--footer-border-color);
                  }
                  atomic-folded-result-list::part(skeleton) {
                    display: flex;
                    flex-direction: column;
                  }
                  atomic-folded-result-list::part(atomic-skeleton),
                  atomic-folded-result-list::part(atomic-mobile-view) {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin: 24px 0;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-line) {
                    background: linear-gradient(-90deg, var(--shimmer-image-slide-start) 0%, var(--shimmer-image-slide-end) 50%, var(--shimmer-image-slide-start) 100%);
                    background-size: 400% 400%;
                    animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-line-title) {
                    height: 22px;
                    width: 50%;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-line-subtitle) {
                    height: 12px;
                    width: 40%;
                    margin: 6px 0;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-line-content) {
                    height: 48px;
                    width: 90%;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-grid-desktop) {
                    display: grid;
                    grid-template-columns: 1.5fr 0.5fr 0.6fr 0.4fr;
                    gap: 16px;
                    align-items: start;
                    border-bottom: 1px solid #ddd;
                    padding: 36px 0 24px;
                    margin-left: 32px;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-desktop-line) {
                    background: linear-gradient(-90deg, var(--shimmer-image-slide-start) 0%, var(--shimmer-image-slide-end) 50%, var(--shimmer-image-slide-start) 100%);background-size: 400% 400%;
                    animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-desktop-line-heading) {
                    width: 100%;
                    height: 26px;
                    margin-bottom: 8px;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-desktop-line-subheading) {
                    width: 50%;
                    height: 11px;
                    margin-bottom: 8px;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-desktop-line-content) {
                    width: 100%;
                    height: 44px;
                    margin-bottom: 8px;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-desktop-line-tag) {
                    width: 50px;
                    height: 12px;
                    margin-bottom: 6px;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-desktop-line-button) {
                    width: 80px;
                    height: 26px;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-desktop-line-info) {
                    width: 120px;
                    height: 24px;
                  }

                  atomic-folded-result-list::part(atomic-skeleton-desktop-line-status) {
                    width: 60px;
                    height: 14px;
                  }

                  @keyframes skeleton-shimmer {
                    0% {
                      background-position: 200% 0;
                    }
                    100% {
                      background-position: -200% 0;
                    }
                  }

                </style>
`;
let isListenerAdded = false;
export default function atomicResultHandler(block, placeholders) {
  const baseElement = block.querySelector('atomic-folded-result-list');
  const searchLayout = block.querySelector('atomic-search-layout');
  if (!searchLayout.classList.contains('no-results')) {
    baseElement.classList.add('list-wrap-skeleton');
  }
  const shadow = baseElement.shadowRoot;
  const container = shadow?.querySelector('[part="result-list"]');

  if (!container) {
    waitFor(() => {
      atomicResultHandler(block, placeholders);
    }, 50);
    return;
  }
  container.parentElement.part.add('list-wrap');
  // Make result section hidden and start adding skeleton.
  container.style.cssText = 'display: none;';
  container.dataset.view = isMobile() ? 'mobile' : 'desktop';
  const skeletonWrapper = htmlToElement(`<div class="skeleton-wrapper" part="skeleton"></div>`);
  skeletonWrapper.innerHTML = renderAtomicSekeletonUI();
  container.parentElement.appendChild(skeletonWrapper);

  function onClearBtnClick() {
    const atomicBreadBox = document.querySelector('atomic-breadbox');
    const coveoClearBtn = atomicBreadBox?.shadowRoot?.querySelector('[part="clear"]');
    if (coveoClearBtn) {
      const event = new CustomEvent(CUSTOM_EVENTS.SEARCH_CLEARED);
      document.dispatchEvent(event);
      coveoClearBtn.click();
    }
  }

  function decorateExternalLink(link) {
    const href = link?.getAttribute('href');
    if (!href) return;
    const url = new URL(href, window.location.origin);
    if (url?.hostname && !url?.hostname.startsWith('experienceleague')) {
      link.setAttribute('target', '_blank');
      const iconEl = document.createElement('span');
      iconEl.classList.add('icon', 'icon-external-link');
      link.appendChild(iconEl);
    }
  }

  function removeChildSkeletom(element) {
    setTimeout(() => {
      const shimmer = element.shadowRoot.querySelector('.loading-skeleton');
      if (shimmer) {
        element.shadowRoot.removeChild(shimmer);
      }
    }, 200);
  }

  function removeBlockSkeleton() {
    const skeleton = container.parentElement.querySelector('.skeleton-wrapper');
    if (skeleton) {
      container.style.cssText = '';
      baseElement.classList.remove('list-wrap-skeleton');
      container.parentElement.removeChild(skeleton);
    }
  }

  function decorateChildrenSection({ btn, element }) {
    const isCollapsed = btn.dataset.state === 'collapsed';
    btn.innerHTML = `
      <span part="btn-text" class="atomic-child-btn-text">${
        isCollapsed
          ? `${placeholders.searchExpandAllReplies || 'Expand all replies'}`
          : `${placeholders.searchCollapseAllReplies || 'Collapse all replies'}`
      }
      </span>
      <span part="chevron-icon ${isCollapsed ? '' : 'chevron-up'}" class="icon icon-atomic-search-chevron-blue">
      </span>
    `;
    if (!isCollapsed && element.dataset.shimmer !== 'true' && !element.shadowRoot.querySelector('.loading-skeleton')) {
      element.dataset.shimmer = 'true';
      const shimmer = htmlToElement(`<div class="atomic-load-skeleton-result loading-skeleton" part="loading-skeleton">
        ${renderAtomicSekeletonUI(INITIAL_ATOMIC_RESULT_CHILDREN_COUNT, true)}</div>`);
      element.shadowRoot.appendChild(shimmer);
    }

    setTimeout(() => {
      if (btn.dataset.state !== 'collapsed') {
        removeChildSkeletom(element);
      }
    }, 250);
    decorateIcons(btn);
  }

  function decorateAtomicChildResult(node) {
    if (node?.className?.includes('result-component') && node.dataset.icon !== 'true') {
      const baseEl = node.shadowRoot.querySelector('.result-title');
      decorateIcons(baseEl);
      node.dataset.icon = 'true';
      return true;
    }
    return false;
  }

  function handleChildrenSectionUI({ btn, element, dataHolder }) {
    decorateChildrenSection({ btn, element });

    dataHolder.elementObs = observeShadowRoot(element, {
      waitForElement: true,
      onPopulate() {
        const childrenRoot = element.shadowRoot.querySelector(`[part="children-root"]`);
        if (!childrenRoot) {
          return;
        }
        const elements = childrenRoot.querySelectorAll('.result-component');
        elements.forEach(decorateAtomicChildResult);
        const countString = element.parentElement?.parentElement
          ?.querySelector('.child-result-count')
          ?.textContent?.trim();
        const childrenCount = countString && !Number.isNaN(countString) ? +countString : 0;

        if (childrenCount <= INITIAL_ATOMIC_RESULT_CHILDREN_COUNT) {
          btn.part.add('hide-btn');
          childrenRoot.part.remove('children-root-with-button');
        } else {
          childrenRoot.part.add('children-root-with-button');
        }
      },
      onMutation: (mutations) => {
        let rendered = false;
        mutations.forEach((mutation) => {
          const [node] = mutation.addedNodes || [];
          const updated = decorateAtomicChildResult(node);
          if (updated) {
            rendered = true;
          }
        });
        if (rendered) {
          removeChildSkeletom(element);
        }
      },
    });
  }

  function handleAtomicResultChildrenUI(element) {
    if (!element?.shadowRoot?.firstElementChild) {
      waitFor(() => {
        handleAtomicResultChildrenUI(element);
      });
      return;
    }
    const dataHolder = {};
    const btn = element.shadowRoot.querySelector('.show-hide-button');
    if (btn) {
      btn.dataset.state = 'collapsed';
      handleChildrenSectionUI({ btn, element, dataHolder });
      btn.addEventListener('click', () => {
        const newState = btn.dataset.state === 'collapsed' ? 'open' : 'collapsed';
        if (dataHolder.elementObs) {
          disconnectShadowObserver(dataHolder.elementObs);
        }
        btn.dataset.state = newState;
        handleChildrenSectionUI({ btn, element, dataHolder });
      });
    }
  }

  const clearAllBtn = document.querySelector('.clear-label');
  if (!isListenerAdded) {
    clearAllBtn.addEventListener('click', onClearBtnClick);
    isListenerAdded = true;
  }

  function openVideoModal(videoUrl) {
    document.body.style.overflow = 'hidden';

    const parentBlock = document.querySelector('.atomic-search');
    if (!parentBlock) return;
    let modal = parentBlock.querySelector('.video-modal-wrapper');
    let iframeContainer;

    if (!modal) {
      modal = document.createElement('div');
      modal.classList.add('video-modal-wrapper');

      const modalContent = document.createElement('div');
      modalContent.classList.add('video-modal-container');

      const closeBtn = document.createElement('span');
      closeBtn.classList.add('icon', 'icon-close-light');
      closeBtn.addEventListener('click', () => {
        document.body.style.overflow = '';
        modal.style.display = 'none';
        if (iframeContainer) iframeContainer.innerHTML = '';
      });

      iframeContainer = document.createElement('div');
      iframeContainer.classList.add('video-modal');

      modalContent.appendChild(closeBtn);
      modalContent.appendChild(iframeContainer);
      modal.appendChild(modalContent);
      decorateIcons(modal);
      parentBlock.appendChild(modal);
    } else {
      iframeContainer = modal.querySelector('.video-modal');
      modal.style.display = 'flex';
    }

    if (iframeContainer && videoUrl) {
      iframeContainer.innerHTML = `<iframe src="${videoUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    }
  }

  const updateAtomicResultUI = () => {
    const results = container.querySelectorAll('atomic-result');
    const isMobileView = isMobile();
    container.dataset.view = isMobileView ? 'mobile' : 'desktop';
    results.forEach((resultElement) => {
      const hydrateResult = (resultEl) => {
        const resultShadow = resultEl.shadowRoot;
        if (!resultShadow) {
          waitForChildElement(
            resultEl,
            () => {
              hydrateResult(resultEl);
            },
            25,
          );
          return;
        }

        const resultItem = resultShadow.querySelector(`.result-item.${isMobileView ? 'mobile-only' : 'desktop-only'}`);
        const resultContentType = resultItem?.querySelector('.result-content-type');
        const contentTypeElWrap = resultContentType?.firstElementChild?.shadowRoot;

        if (!resultItem) {
          waitFor(() => {
            hydrateResult(resultEl);
          }, 50);
          return;
        }

        const blockLevelSkeleton = block.querySelector('.atomic-search-load-skeleton');
        if (blockLevelSkeleton) {
          block.removeChild(blockLevelSkeleton);
        }

        const resultFieldMulti = resultItem?.querySelector('.result-product .result-field-multi');
        const resultFieldValue = resultItem?.querySelector('.result-product .result-field-value');
        const productList = resultFieldValue?.firstElementChild?.shadowRoot?.querySelectorAll('li');
        const productCount = productList ? productList.length : 0;
        if (productCount > 1) {
          resultFieldMulti?.classList.remove('hidden');
          resultFieldValue?.classList.add('hidden');
        } else {
          resultFieldMulti?.classList.add('hidden');
          resultFieldValue?.classList.remove('hidden');
        }

        const recommendationBadgeExists = !!resultItem.querySelector('.atomic-recommendation-badge');
        if (recommendationBadgeExists) {
          const resultRoot = resultShadow.querySelector('.result-root');
          resultRoot.classList.add('recommendation-badge');
        }
        const currentHydrationCount = +(resultEl.dataset.hydration || '0');
        if (currentHydrationCount >= MAX_HYDRATION_ATTEMPTS) {
          removeBlockSkeleton();
          return; // Return to avoid repeated hydrations endlessly.
        }
        resultEl.dataset.hydration = `${currentHydrationCount + 1}`;

        if (!contentTypeElWrap) {
          waitFor(() => {
            hydrateResult(resultEl);
          }, 50);
          return;
        }

        const contentTypeElParent = contentTypeElWrap?.querySelector('ul');
        if (!contentTypeElParent) {
          waitFor(() => {
            hydrateResult(resultEl);
          }, 20);
          return;
        }
        if (!resultItem.dataset.decorated) {
          decorateIcons(resultItem);
          resultItem.dataset.decorated = 'true';
        }

        // Remove skeleton
        removeBlockSkeleton();

        const atomicResultChildren = resultItem.querySelector('atomic-result-children');
        handleAtomicResultChildrenUI(atomicResultChildren);

        const productElWrap = resultItem?.querySelector('.result-product')?.firstElementChild?.shadowRoot;
        const productElements = productElWrap?.querySelectorAll('li') || [];
        const contentTypeElements = contentTypeElParent?.querySelectorAll('li') || [];

        const topicElements =
          resultItem
            ?.querySelector('.result-description atomic-result-multi-value-text')
            ?.shadowRoot?.querySelectorAll('li') || [];
        topicElements.forEach((li) => {
          if (li.classList.contains('separator')) {
            li.remove();
            return;
          }

          const slot = li.querySelector('slot');
          if (!slot || li.querySelector('a')) return;

          const label = slot.textContent.trim();
          if (!label) return;

          const link = document.createElement('a');
          link.href = `${communityTopicsUrl}${encodeURIComponent(label)}`;
          link.textContent = label;
          link.target = '_blank';
          link.style.textDecoration = 'none';
          link.style.color = 'inherit';

          li.innerHTML = '';
          li.appendChild(link);
        });

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

        const anchorTag = resultItem?.querySelector('atomic-result-link > a');
        const hasSpan = anchorTag?.querySelector('span');
        if (anchorTag && !hasSpan) {
          decorateExternalLink(anchorTag);
          decorateIcons(anchorTag);
        }

        const videoUrlEl = resultShadow?.querySelector('atomic-result-text[field="video_url"]');
        const titleEl = resultShadow?.querySelector('atomic-result-link[field="title"]');

        const VIDEO_THUMBNAIL_FORMAT = /^https:\/\/video\.tv\.adobe\.com\/v\/\w+/;

        if (videoUrlEl) {
          const videoUrl = videoUrlEl?.textContent?.trim() || '';
          if (!videoUrl) return;
          const thumbnailAlt = titleEl?.textContent || '';
          const cleanUrl = videoUrl.split('?')[0];

          if (!VIDEO_THUMBNAIL_FORMAT.test(cleanUrl)) {
            const thumbnail = resultShadow.querySelector('.result-thumbnail');
            if (thumbnail) thumbnail.style.display = 'none';
            return;
          }

          const imgUrl = `${cleanUrl}?format=jpeg`;
          const thumbnailWrapper = isMobileView
            ? resultShadow?.querySelector('.atomic-search-result-item.mobile-only .result-field.result-thumbnail')
            : resultShadow?.querySelector('.atomic-search-result-item.desktop-only .result-field.result-thumbnail');
          if (thumbnailWrapper) {
            let img = thumbnailWrapper.querySelector('img');
            if (!img) {
              img = document.createElement('img');
              img.classList.add('thumbnail-img');
              img.alt = thumbnailAlt;
              img.loading = 'lazy';
              const wrapper = document.createElement('span');
              wrapper.classList.add('thumbnail-wrapper');
              const playButton = document.createElement('span');
              playButton.classList.add('icon', 'icon-play-outline-white');
              wrapper.appendChild(img);
              wrapper.appendChild(playButton);
              decorateIcons(wrapper);
              thumbnailWrapper.appendChild(wrapper);
              wrapper.addEventListener('click', () => {
                openVideoModal(cleanUrl);
              });
            }
            img.src = imgUrl || '';
          }
        }
      };

      resultElement.dataset.hydration = '0';
      hydrateResult(resultElement);
    });

    const layoutSectionEl = block.querySelector('atomic-layout-section[section="results"]');
    const resultHeader = layoutSectionEl ? layoutSectionEl.querySelector('.result-header-section') : null;
    if (resultHeader) {
      resultHeader.classList.remove('result-header-inactive');
    }
    const searchLayoutEl = block.querySelector('atomic-search-layout');
    searchLayoutEl.dataset.result = 'found';
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
  updateAtomicResultUI();
}
