import { renderAtomicSekeletonUI } from './atomic-search-skeleton.js';
import {
  waitForChildElement,
  waitFor,
  debounce,
  CUSTOM_EVENTS,
  isMobile,
  handleHeaderSearchVisibility,
  disconnectShadowObserver,
  observeShadowRoot,
} from './atomic-search-utils.js';
import { ContentTypeIcons } from './atomic-search-icons.js';
import { decorateIcons } from '../../../scripts/lib-franklin.js';
import { htmlToElement } from '../../../scripts/scripts.js';
import { INITIAL_ATOMIC_RESULT_CHILDREN_COUNT } from './atomic-result-children.js';

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
                      --content-type-default-color: #000000
                    }
                    .result-root {
                      @media(max-width: 1024px) {
                        max-width: calc(100% - 40px);
                      }
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
                    .result-root.recommendation-badge {
                          margin: 40px 0px 0px;
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
                      color: #959595;
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
                    }
                    
                    .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-separator) {
                      display: none;
                    }
                    .result-product atomic-result-multi-value-text::part(result-multi-value-text-value) {
                      font-size: var(--spectrum-font-size-100);
                      color: var(--non-spectrum-web-gray);
                      display: block;
                    }
                    .result-product atomic-result-multi-value-text::part(result-multi-value-text-list) {
                      flex-wrap: wrap;
                      gap: 4px;
                    }
                    .result-product atomic-result-multi-value-text::part(result-multi-value-text-separator) {
                      display: none;
                    }
                    .result-updated {
                      font-size: var(--spectrum-font-size-100);
                      color: var(--non-spectrum-web-gray);
                      text-align: left;
                    }
                    atomic-result-link {
                      position: relative;
                      color: #1E76E3;
                      font-size: var(--spectrum-font-size-50);
                      cursor: pointer;
                    }
                    atomic-result-link > a:not([slot="label"]) {
                      position: absolute;
                      left: 0;
                    }
                    atomic-result-link > a img {
                      display: inline-block;
                      margin-bottom: 6px;
                      margin-left: 4px;
                      height: 14px;
                      width: 14px;
                    }
                    atomic-result-link > a > atomic-result-text {
                      visibility: hidden
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
                    }
                    .mobile-result-title {
                        position: relative;
                     }
                    .result-item.mobile-only .mobile-result-title atomic-result-text {
                      font-size: var(--spectrum-font-size-200);
                      font-weight: bold;
                      color: var(--non-spectrum-dark-gray);
                    }
                    .mobile-result-info .result-field atomic-result-multi-value-text, .mobile-result-info .atomic-result-date, .mobile-result-info .result-product atomic-result-multi-value-text::part(result-multi-value-text-value) {
                      color: var(--non-spectrum-web-gray);
                      font-size: var(--spectrum-font-size-75);
                    }
                    .mobile-result-info .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-value) {
                      padding: 0;
                    }
                    .mobile-description atomic-result-section-excerpt atomic-result-text {
                      font-size: var(--spectrum-font-size-75);
                      color: #959595;
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
    });
    return;
  }
  container.parentElement.part.add('list-wrap');
  // Make result section hidden and start adding skeleton.
  container.style.cssText = 'display: none;';
  container.dataset.view = isMobile() ? 'mobile' : 'desktop';
  const skeletonWrapper = htmlToElement(`<div class="skeleton-wrapper" part="skeleton"></div>`);
  skeletonWrapper.innerHTML = renderAtomicSekeletonUI();
  container.parentElement.appendChild(skeletonWrapper);
  handleHeaderSearchVisibility();

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
        const countString = element.parentElement?.querySelector('.child-result-count')?.textContent?.trim();
        const childrenCount = countString && !Number.isNaN(countString) ? +countString : 0;

        if (childrenCount <= INITIAL_ATOMIC_RESULT_CHILDREN_COUNT + 1) {
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

        const blockLevelSkeleton = block.querySelector('.atomic-search-load-skeleton');
        if (blockLevelSkeleton) {
          block.removeChild(blockLevelSkeleton);
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
        const skeleton = container.parentElement.querySelector('.skeleton-wrapper');
        if (skeleton) {
          container.style.cssText = '';
          baseElement.classList.remove('list-wrap-skeleton');
          container.parentElement.removeChild(skeleton);
        }

        const atomicResultChildren = resultItem.querySelector('atomic-result-children');
        handleAtomicResultChildrenUI(atomicResultChildren);

        const recommendationBadgeExists = !!resultItem.querySelector('.atomic-recommendation-badge');
        if (recommendationBadgeExists) {
          const resultRoot = resultShadow.querySelector('.result-root');
          resultRoot.classList.add('recommendation-badge');
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

        const anchorTag = resultItem?.querySelector('atomic-result-link > a');
        const hasSpan = anchorTag?.querySelector('span');
        if (anchorTag && !hasSpan) {
          decorateExternalLink(anchorTag);
          decorateIcons(anchorTag);
        }
      };
      hydrateResult();
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
