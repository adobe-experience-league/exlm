export const INITIAL_ATOMIC_RESULT_CHILDREN_COUNT = 2;

export const atomicResultChildrenStyles = `
    <style>
        atomic-result-children {
          position: relative;
        }
        atomic-result-children::part(children-root) {
            padding: 4px 0 0;
            position: relative;
        }
        atomic-result-children::part(children-root-with-button) {
          padding-bottom: 20px;
        }
        atomic-result-children::part(root-active) {
            display: block;
        }
        atomic-result-children::part(show-hide-button) {
            font-size: var(--spectrum-font-size-50);
            color: #1E76E3;
            display: flex;
            gap: 2px;
            align-items: center;
            margin: 6px 0 4px;
            position: absolute;
            bottom: -12px;
            z-index: 1;
        }
        atomic-result-children::part(hide-btn) {
          display: none;
        }
        atomic-result-children::part(no-result-root) {
            display: none;
        }
        atomic-result-children::part(chevron-icon) {
            height: 14px;
            width: 14px;
            margin-top: 2px;
        }
        atomic-result-children::part(chevron-up) {
            transform: rotate(180deg);
        }

        atomic-result-children::part(loading-skeleton) {
          position: absolute;
          top: 0;
          display: flex;
          flex-direction: column;
          min-height: 140px;
          width: 100%;
        }
                atomic-result-children::part(skeleton) {
                    display: flex;
                    flex-direction: column;
                  }
                  atomic-result-children::part(atomic-skeleton),
                  atomic-result-children::part(atomic-mobile-view) {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin: 12px 0 0 0;
                  }

                  atomic-result-children::part(atomic-skeleton-line) {
                    background: linear-gradient(-90deg, var(--shimmer-image-slide-start) 0%, var(--shimmer-image-slide-end) 50%, var(--shimmer-image-slide-start) 100%);
                    background-size: 400% 400%;
                    animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px;
                  }

                  atomic-result-children::part(atomic-skeleton-line-title) {
                    height: 12px;
                    width: 100%;
                    margin-bottom: 2px;
                  }

                  atomic-result-children::part(atomic-skeleton-line-content) {
                    height: 28px;
                    width: 100%;
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

export const atomicResultChildrenTemplateStyles = `
    <style>
        .child-item {
            padding: 2px 0 0;
            position: relative;
            margin-left: 8px;
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
                      font-size: var(--spectrum-font-size-50);
                      line-height: 12px;
                      display: -webkit-box;
                      -webkit-line-clamp: 4; 
                      -webkit-box-orient: vertical;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      margin: 2px 0;
                      max-width: 90vw;
                    }
                    atomic-result-section-excerpt atomic-result-text {
                      color: #959595;
                      font-size: var(--spectrum-font-size-50);
                      line-height: 12px;
                    }
                    .result-title atomic-result-text, .mobile-result-title atomic-result-text {
                      color: var(--non-spectrum-dark-charcoal);
                      font-weight: bold;
                      overflow: hidden;
                      max-width: 90vw;
                      display: -webkit-box;
                      -webkit-line-clamp: 1; 
                      -webkit-box-orient: vertical;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      font-size: var(--spectrum-font-size-100);
                      line-height: 16px;
                      position: relative;
                      margin-left: 16px;
                    }
                    .result-title span.icon {
                      position: absolute;
                      top: 4px;
                    }
                    .result-title atomic-result-text atomic-result-link, .mobile-result-title atomic-result-text atomic-result-link {
                      width: 100%;
                      display: block;
                      height: 16px;
                      position: absolute;
                    }
                    .result-title atomic-result-link atomic-result-text {
                      display: none;
                    }
                    atomic-result-link > a:not([slot="label"]) {
                      position: absolute;
                      left: 0;
                      width: 100%;
                      height: 16px;
                    }      
    </style>
`;
