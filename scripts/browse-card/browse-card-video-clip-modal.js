import { decorateIcons, loadCSS } from '../lib-franklin.js';
import { createTag, htmlToElement, fetchLanguagePlaceholders } from '../scripts.js';

export const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

export class BrowseCardVideoClipModal {
  static activeInstance = null;

  constructor(options) {
    this.model = options?.model || {};

    if (BrowseCardVideoClipModal.activeInstance) {
      // If the same video clip is clicked (check by id), just return the existing instance
      if (BrowseCardVideoClipModal.activeInstance.model.id === this.model.id) {
        // eslint-disable-next-line no-constructor-return
        return BrowseCardVideoClipModal.activeInstance;
      }

      // If different video clip and in mini-player mode, update the existing instance
      if (BrowseCardVideoClipModal.activeInstance.miniPlayerMode) {
        BrowseCardVideoClipModal.activeInstance.updateContent(options?.model || {});
        // eslint-disable-next-line no-constructor-return
        return BrowseCardVideoClipModal.activeInstance;
      }

      // If different video clip and not in mini-player mode, close the existing instance
      BrowseCardVideoClipModal.activeInstance.close();
    }

    // Set this as the active instance
    BrowseCardVideoClipModal.activeInstance = this;

    this.eventListeners = [];

    this.modal = null;
    this.backdrop = null;
    this.header = null;
    this.videoContainer = null;
    this.contentCard = null;
    this.miniPlayerMode = false;
    this.miniPlayerButton = null;
    this.miniPlayerLabel = null;

    this.isMobileView = isMobile();
    this.loadStyles();
    this.createModal();
    this.setupEventListeners();
  }

  // eslint-disable-next-line class-methods-use-this
  async loadStyles() {
    await loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-video-clip-modal.css`);
  }

  handleResize() {
    const currentMobileState = isMobile();

    if (this.isMobileView !== currentMobileState) {
      this.isMobileView = currentMobileState;
      if (currentMobileState && this.miniPlayerMode) {
        this.toggleMiniPlayer(); // If switching to mobile view while in mini-player mode, switch to expanded view
      }

      if (currentMobileState) {
        this.backdrop.classList.add('mobile-view');
        this.modal.classList.add('mobile-view');
      } else {
        this.backdrop.classList.remove('mobile-view');
        this.modal.classList.remove('mobile-view');
      }
    }
  }

  createModal() {
    const { title, videoURL, parentName, parentURL, product, failedToLoad = false } = this.model;

    const isMobileView = isMobile();

    let tagTextHTML = '';
    if (product?.length > 0 || failedToLoad) {
      const tagText = product?.join(', ') || '';
      const isMultiSolution = product?.length > 1;

      if (isMultiSolution) {
        tagTextHTML = `
          <div class="video-modal-tag-text">
            <h4>${placeholders?.multiSolutionText || 'multisolution'}</h4>
            <div class="video-modal-tooltip-placeholder">
              <div class="video-modal-tooltip video-modal-tooltip-top video-modal-tooltip-grey">
                <span class="icon icon-info"></span>
                <span class="video-modal-tooltip-text">${tagText}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        tagTextHTML = `
          <div class="video-modal-tag-text">
            <h4>${tagText}</h4>
          </div>
        `;
      }
    }

    this.backdrop = htmlToElement(`
      <div class="browse-card-video-modal-backdrop">
        <div class="browse-card-video-modal-actions backdrop-actions">
          <button class="browse-card-video-modal-miniplayer" aria-label="${
            placeholders?.activateMiniplayerText || 'Activate miniplayer'
          }">
            <span class="icon icon-activate-mini-player"></span>
            <span class="miniplayer-label">${placeholders?.activateMiniplayerText || 'Activate miniplayer'}</span>
          </button>
          <button class="browse-card-video-modal-close" aria-label="${placeholders?.closePlayerText || 'Close player'}">
            <span class="close-label">${placeholders?.closePlayerText || 'Close player'}</span>
            <span class="icon icon-close-white"></span>
          </button>
        </div>
        <div class="browse-card-video-modal">
          <div class="browse-card-video-modal-content">
            <div class="browse-card-video-modal-actions modal-actions" style="display: none;">
              <button class="browse-card-video-modal-miniplayer" aria-label="${
                placeholders?.expandVideoPlayerText || 'Expand video player'
              }">
                <span class="icon icon-expand-player"></span>
                <span class="miniplayer-label">${placeholders?.expandVideoPlayerText || 'Expand video player'}</span>
              </button>
              <button class="browse-card-video-modal-close" aria-label="${
                placeholders?.closePlayerText || 'Close player'
              }">
                <span class="close-label">${placeholders?.closePlayerText || 'Close player'}</span>
                <span class="icon icon-close-white"></span>
              </button>
            </div>
            <div class="browse-card-video-modal-body">
              <div class="browse-card-video-container">
                ${videoURL ? `<iframe src="${videoURL}" allowfullscreen></iframe>` : ''}
              </div>
              <div class="browse-card-video-info">
                ${tagTextHTML}
                <div class="browse-card-video-info-header">
                  <h4 class="browse-card-video-info-title">${title || ''}</h4>
                </div>
                <div class="browse-card-video-source-row">
                  <div class="browse-card-video-source">
                    <span>${placeholders?.clippedFromText || 'Clipped from:'} </span>
                    <a href="${parentURL || '#'}">${parentName || ''}</a>
                  </div>
                  <div class="browse-card-video-actions">
                    <button class="browse-card-video-button">
                      <a href="${videoURL}" class="browse-card-video-full-link" target="_blank">
                        ${placeholders?.watchFullVideoText || 'Watch full video'}
                      </a>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    this.modal = this.backdrop.querySelector('.browse-card-video-modal');

    this.videoContainer = this.modal.querySelector('.browse-card-video-container');
    this.contentCard = this.modal.querySelector('.browse-card-video-info');

    this.backdropMiniPlayerButton = this.backdrop.querySelector('.browse-card-video-modal-miniplayer');
    this.backdropMiniPlayerLabel = this.backdrop.querySelector('.miniplayer-label');
    this.backdropCloseButton = this.backdrop.querySelector('.browse-card-video-modal-close');

    this.modalMiniPlayerButton = this.modal.querySelector('.browse-card-video-modal-miniplayer');
    this.modalMiniPlayerLabel = this.modal.querySelector('.miniplayer-label');
    this.modalCloseButton = this.modal.querySelector('.browse-card-video-modal-close');

    this.miniPlayerButton = this.backdropMiniPlayerButton;
    this.miniPlayerLabel = this.backdropMiniPlayerLabel;
    this.closeButton = this.backdropCloseButton;

    const tooltip = this.backdrop.querySelector('.video-modal-tooltip-placeholder');
    if (tooltip) {
      tooltip.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    }

    if (isMobileView) {
      this.backdrop.classList.add('mobile-view');
      this.modal.classList.add('mobile-view');
    }

    decorateIcons(this.backdrop);
  }

  setupEventListeners() {
    const closeHandler = () => this.close();
    this.backdropCloseButton.addEventListener('click', closeHandler);
    this.modalCloseButton.addEventListener('click', closeHandler);
    this.eventListeners.push({ element: this.backdropCloseButton, type: 'click', handler: closeHandler });
    this.eventListeners.push({ element: this.modalCloseButton, type: 'click', handler: closeHandler });

    const miniPlayerHandler = () => this.toggleMiniPlayer();
    this.backdropMiniPlayerButton.addEventListener('click', miniPlayerHandler);
    this.modalMiniPlayerButton.addEventListener('click', miniPlayerHandler);
    this.eventListeners.push({ element: this.backdropMiniPlayerButton, type: 'click', handler: miniPlayerHandler });
    this.eventListeners.push({ element: this.modalMiniPlayerButton, type: 'click', handler: miniPlayerHandler });

    const backdropHandler = (e) => {
      if (e.target === this.backdrop && this.miniPlayerMode) {
        this.close();
      }
    };
    this.backdrop.addEventListener('click', backdropHandler);
    this.eventListeners.push({ element: this.backdrop, type: 'click', handler: backdropHandler });

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', keyHandler);
    this.eventListeners.push({ element: document, type: 'keydown', handler: keyHandler });

    const resizeHandler = () => this.handleResize();
    window.addEventListener('resize', resizeHandler);
    this.eventListeners.push({ element: window, type: 'resize', handler: resizeHandler });
  }

  open() {
    // If this instance is already in the DOM (specifically in document.body), just return
    if (document.body.contains(this.backdrop)) {
      return;
    }

    document.body.appendChild(this.backdrop);

    // Force reflow for animation
    // eslint-disable-next-line no-unused-expressions
    this.backdrop.offsetHeight;
    // eslint-disable-next-line no-unused-expressions
    this.modal.offsetHeight;

    this.backdrop.classList.add('visible');
    this.modal.classList.add('visible');

    if (!this.miniPlayerMode) {
      this.backdrop.classList.add('expanded-mode');
    }

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.backdrop.classList.remove('visible');
    this.modal.classList.remove('visible');

    const removeElements = () => {
      if (this.backdrop.parentNode) {
        this.backdrop.parentNode.removeChild(this.backdrop);
      }

      // Restore body scrolling
      document.body.style.overflow = '';

      this.removeEventListeners();
      if (BrowseCardVideoClipModal.activeInstance === this) {
        BrowseCardVideoClipModal.activeInstance = null;
      }
    };

    setTimeout(removeElements, 300); // Match animation duration
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, type, handler }) => {
      if (element) {
        element.removeEventListener(type, handler);
      }
    });
    this.eventListeners = [];
  }

  updateContent(model) {
    this.model = model;

    const {
      title,
      videoURL,
      parentName,
      parentURL,
      viewLinkText = placeholders?.watchFullVideoText || 'Watch full video',
    } = this.model;

    const titleElement = this.modal.querySelector('.browse-card-video-info-title');
    if (titleElement) {
      titleElement.textContent = title || '';
    }

    const videoContainer = this.modal.querySelector('.browse-card-video-container');
    if (videoContainer && videoURL) {
      const existingIframe = videoContainer.querySelector('iframe');
      if (existingIframe) {
        existingIframe.remove();
      }
      const iframe = createTag('iframe', {
        src: videoURL,
        allowfullscreen: true,
      });
      videoContainer.appendChild(iframe);
    }
    const parentLink = this.modal.querySelector('.browse-card-video-source a');
    if (parentLink) {
      parentLink.href = parentURL || '#';
      parentLink.textContent = parentName || '';
    }

    const fullVideoLink = this.modal.querySelector('.browse-card-video-full-link');
    if (fullVideoLink) {
      fullVideoLink.href = videoURL;
      fullVideoLink.textContent = viewLinkText || placeholders?.watchFullVideoText || 'Watch full video';
    }
  }

  toggleMiniPlayer() {
    if (isMobile() && !this.miniPlayerMode) {
      return; // Don't toggle to mini-player on mobile
    }

    this.miniPlayerMode = !this.miniPlayerMode;

    if (this.miniPlayerMode) {
      // Enter mini player mode
      this.modal.classList.add('mini-player-mode');
      this.backdrop.classList.add('mini-player-mode');
      this.backdrop.classList.remove('expanded-mode');

      this.modal.querySelector('.modal-actions').style.display = 'flex';
      this.backdrop.querySelector('.backdrop-actions').style.display = 'none';

      const actionsElement = this.modal.querySelector('.browse-card-video-actions');
      const infoHeader = this.modal.querySelector('.browse-card-video-info-header');

      if (actionsElement && infoHeader) {
        const actionsClone = actionsElement.cloneNode(true);
        actionsClone.classList.add('miniplayer-actions');
        infoHeader.appendChild(actionsClone);
      }
      this.miniPlayerButton = this.modalMiniPlayerButton;
      this.miniPlayerLabel = this.modalMiniPlayerLabel;
      this.closeButton = this.modalCloseButton;
      document.body.style.overflow = '';
    } else {
      // Exit mini player mode
      this.modal.classList.remove('mini-player-mode');
      this.backdrop.classList.remove('mini-player-mode');
      this.backdrop.classList.add('expanded-mode');
      this.modal.querySelector('.modal-actions').style.display = 'none';
      this.backdrop.querySelector('.backdrop-actions').style.display = 'flex';
      const clonedActions = this.modal.querySelector('.miniplayer-actions');
      if (clonedActions && clonedActions.parentNode) {
        clonedActions.parentNode.removeChild(clonedActions);
      }
      this.miniPlayerButton = this.backdropMiniPlayerButton;
      this.miniPlayerLabel = this.backdropMiniPlayerLabel;
      this.closeButton = this.backdropCloseButton;
      document.body.style.overflow = 'hidden';
    }
  }
}
