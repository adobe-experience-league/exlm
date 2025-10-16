import { decorateIcons, loadCSS } from '../lib-franklin.js';
import { createTag, htmlToElement, fetchLanguagePlaceholders } from '../scripts.js';
import { pushVideoEvent } from '../analytics/lib-analytics.js';

export const isCompactUIMode = () => window.matchMedia('(max-width: 1023px)').matches;

export class BrowseCardVideoClipModal {
  static activeInstance = null;

  static placeholders = {};

  static placeholdersInitialized = false;

  /**
   * Initialize placeholders if not already done
   * @returns {Promise<Object>} The placeholders object
   */
  static async initPlaceholders() {
    if (!this.placeholdersInitialized) {
      try {
        this.placeholders = await fetchLanguagePlaceholders();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching placeholders:', err);
      } finally {
        this.placeholdersInitialized = true;
      }
    }
    return this.placeholders;
  }

  /**
   * Static factory method to create an instance after ensuring placeholders are loaded
   * @param {Object} options - Options for the modal
   * @returns {Promise<BrowseCardVideoClipModal>} A new instance with placeholders loaded
   */
  static async create(options) {
    await BrowseCardVideoClipModal.initPlaceholders();
    return new BrowseCardVideoClipModal(options);
  }

  /**
   * Constructor - prefer using the static create() method instead
   * @param {Object} options - Options for the modal
   */
  constructor(options) {
    this.model = options?.model || {};

    if (BrowseCardVideoClipModal.activeInstance) {
      // If the same video clip is clicked (check by id), just return the existing instance
      if (BrowseCardVideoClipModal.activeInstance.model.parentURL === this.model.parentURL) {
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
    this.videoContainer = null;
    this.contentCard = null;
    this.miniPlayerMode = false;
    this.miniPlayerButton = null;
    this.miniPlayerLabel = null;

    this.isCompactMode = isCompactUIMode();
    this.loadStyles();
    this.createModal();
    this.setupEventListeners();
  }

  // eslint-disable-next-line class-methods-use-this
  async loadStyles() {
    await loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-video-clip-modal.css`);
  }

  handleResize() {
    const currentState = isCompactUIMode();
    if (this.isCompactMode !== currentState) {
      this.isCompactMode = currentState;
      if (currentState && this.miniPlayerMode) {
        this.toggleMiniPlayer(); // If switching to mobile view while in mini-player mode, switch to expanded view
      }

      if (currentState) {
        this.backdrop.classList.add('compact-mode');
        this.modal.classList.add('compact-mode');
      } else {
        this.backdrop.classList.remove('compact-mode');
        this.modal.classList.remove('compact-mode');
      }
    }
    this.updateModalDimensions();
  }

  createModal() {
    const { title, videoURL, parentName, parentURL, product, failedToLoad = false } = this.model;

    let videoSrc = videoURL;
    if (this.miniPlayerMode) {
      const hasParams = videoSrc?.includes('?');
      if (videoSrc) {
        videoSrc = `${videoSrc}${hasParams ? '&' : '?'}autoplay=1`;
      }
    }

    const isCompactMode = isCompactUIMode();

    let tagTextHTML = '';
    if (product?.length > 0 || failedToLoad) {
      const tagText = product?.join(', ') || '';
      const isMultiSolution = product?.length > 1;

      if (isMultiSolution) {
        tagTextHTML = `
          <div class="video-modal-tag-text">
            <h4>${BrowseCardVideoClipModal.placeholders?.multiSolutionText || 'multisolution'}</h4>
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
      <div class="browse-card-video-clip-modal-backdrop">
        <div class="browse-card-video-clip-modal-actions backdrop-actions">
          <button class="browse-card-video-clip-modal-miniplayer" aria-label="${
            BrowseCardVideoClipModal.placeholders?.activateMiniplayerText || 'Activate miniplayer'
          }">
            <span class="icon icon-activate-mini-player"></span>
            <span class="miniplayer-label">${
              BrowseCardVideoClipModal.placeholders?.activateMiniplayerText || 'Activate miniplayer'
            }</span>
          </button>
          <button class="browse-card-video-clip-modal-close" aria-label="${
            BrowseCardVideoClipModal.placeholders?.closePlayerText || 'Close player'
          }">
            <span class="close-label">${BrowseCardVideoClipModal.placeholders?.closePlayerText || 'Close player'}</span>
            <span class="icon icon-close-white"></span>
          </button>
        </div>
        <div class="browse-card-video-clip-modal">
          <div class="browse-card-video-clip-modal-content">
            <div class="browse-card-video-clip-modal-actions modal-actions">
              <button class="browse-card-video-clip-modal-miniplayer" aria-label="${
                BrowseCardVideoClipModal.placeholders?.expandVideoPlayerText || 'Expand video player'
              }">
                <span class="icon icon-expand-player"></span>
                <span class="miniplayer-label">${
                  BrowseCardVideoClipModal.placeholders?.expandVideoPlayerText || 'Expand video player'
                }</span>
              </button>
              <button class="browse-card-video-clip-modal-close" aria-label="${
                BrowseCardVideoClipModal.placeholders?.closePlayerText || 'Close player'
              }">
                <span class="close-label">${
                  BrowseCardVideoClipModal.placeholders?.closePlayerText || 'Close player'
                }</span>
                <span class="icon icon-close-white"></span>
              </button>
            </div>
            <div class="browse-card-video-clip-modal-body">
              <div class="browse-card-video-clip-container">
                ${videoURL ? `<iframe src="${videoSrc}" allowfullscreen></iframe>` : ''}
              </div>
              <div class="browse-card-video-clip-info">
                ${tagTextHTML}
                <div class="browse-card-video-clip-info-header">
                  <h4 class="browse-card-video-clip-info-title">${title || ''}</h4>
                </div>
                <div class="browse-card-source-row">
                  <div class="browse-card-source">
                    <span>${BrowseCardVideoClipModal.placeholders?.clippedFrom || 'Clipped from:'} </span>
                    <a target="_blank" href="${parentURL || '#'}">${parentName || ''}</a>
                  </div>
                  <div class="browse-card-actions">
                    <button class="browse-card-button">
                      <a href="${parentURL}" class="browse-card-full-link" target="_blank">
                        ${BrowseCardVideoClipModal.placeholders?.watchFullVideo || 'Watch full video'}
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

    this.modal = this.backdrop.querySelector('.browse-card-video-clip-modal');

    this.videoContainer = this.modal.querySelector('.browse-card-video-clip-container');
    this.contentCard = this.modal.querySelector('.browse-card-video-clip-info');
    this.watchFullVideoBtn = this.backdrop.querySelector('.browse-card-button');
    this.videoSourceContainer = this.backdrop.querySelector('.browse-card-source');

    this.backdropMiniPlayerButton = this.backdrop.querySelector('.browse-card-video-clip-modal-miniplayer');
    this.backdropMiniPlayerLabel = this.backdrop.querySelector('.miniplayer-label');
    this.backdropCloseButton = this.backdrop.querySelector('.browse-card-video-clip-modal-close');

    this.modalMiniPlayerButton = this.modal.querySelector('.browse-card-video-clip-modal-miniplayer');
    this.modalMiniPlayerLabel = this.modal.querySelector('.miniplayer-label');
    this.modalCloseButton = this.modal.querySelector('.browse-card-video-clip-modal-close');

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

    if (isCompactMode) {
      this.backdrop.classList.add('compact-mode');
      this.modal.classList.add('compact-mode');
    }

    this.updateVideoDetailsVisibility();

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

    const messageHandler = (event) => {
      if (event.data?.type === 'mpcStatus') {
        if (event.data.state === 'play') {
          pushVideoEvent({
            title: this.model.title || '',
            description: this.model.description || '',
            url: this.model.videoURL || '',
            duration: this.model.duration || '',
          });
        }
      }
    };

    window.addEventListener('message', messageHandler, false);
    this.eventListeners.push({ element: window, type: 'message', handler: messageHandler });

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.backdrop);
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
      setTimeout(() => {
        this.updateModalDimensions();
      }, 100);
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

  updateModalDimensions() {
    const modalWidth = this.modal.offsetWidth;
    if (modalWidth > 0) {
      const actionsContainer = this.backdrop.querySelector('.backdrop-actions');
      actionsContainer.style.maxWidth = this.miniPlayerMode ? '' : `${modalWidth}px`;
    }
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, type, handler }) => {
      if (element) {
        element.removeEventListener(type, handler);
      }
    });
    this.eventListeners.length = 0;

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  updateContent(model) {
    this.model = model;

    const {
      title,
      videoURL,
      parentName,
      parentURL,
      viewLinkText = BrowseCardVideoClipModal.placeholders?.watchFullVideo || 'Watch full video',
    } = this.model;

    const titleElement = this.modal.querySelector('.browse-card-video-clip-info-title');
    if (titleElement) {
      titleElement.textContent = title || '';
    }

    const videoContainer = this.modal.querySelector('.browse-card-video-clip-container');
    if (videoContainer && videoURL) {
      const existingIframe = videoContainer.querySelector('iframe');
      if (existingIframe) {
        existingIframe.remove();
      }

      let videoSrc = videoURL;
      if (this.miniPlayerMode) {
        const hasParams = videoSrc.includes('?');
        videoSrc = `${videoSrc}${hasParams ? '&' : '?'}autoplay=1`;
      }

      const iframe = createTag('iframe', {
        src: videoSrc,
        allowfullscreen: true,
      });
      videoContainer.appendChild(iframe);
    }
    const parentLink = this.modal.querySelector('.browse-card-source a');
    if (parentLink) {
      parentLink.href = parentURL || '#';
      parentLink.textContent = parentName || '';
    }

    const fullVideoLink = this.modal.querySelector('.browse-card-full-link');
    if (fullVideoLink) {
      fullVideoLink.href = videoURL;
      fullVideoLink.textContent =
        viewLinkText || BrowseCardVideoClipModal.placeholders?.watchFullVideo || 'Watch full video';
    }
    this.updateVideoDetailsVisibility();
    this.updateMiniPlayerCtaVisibility();
  }

  toggleMiniPlayer() {
    if (isCompactUIMode() && !this.miniPlayerMode) {
      this.updateModalDimensions();
      return; // Don't toggle to mini-player on mobile
    }

    this.miniPlayerMode = !this.miniPlayerMode;
    if (this.miniPlayerMode) {
      // Enter mini player mode
      this.modal.classList.add('mini-player-mode');
      this.backdrop.classList.add('mini-player-mode');
      this.backdrop.classList.remove('expanded-mode');

      const actionsElement = this.modal.querySelector('.browse-card-actions');
      const infoHeader = this.modal.querySelector('.browse-card-video-clip-info-header');

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

      const clonedActions = this.modal.querySelector('.miniplayer-actions');
      if (clonedActions && clonedActions.parentNode) {
        clonedActions.parentNode.removeChild(clonedActions);
      }
      this.miniPlayerButton = this.backdropMiniPlayerButton;
      this.miniPlayerLabel = this.backdropMiniPlayerLabel;
      this.closeButton = this.backdropCloseButton;
      document.body.style.overflow = 'hidden';
    }
    this.updateMiniPlayerCtaVisibility();
    setTimeout(() => {
      this.updateModalDimensions();
    }, 100);
  }

  updateVideoDetailsVisibility() {
    const fullVideoExists = !!this.model.parentURL;
    const classOp = fullVideoExists ? 'remove' : 'add';
    if (this.watchFullVideoBtn) {
      this.watchFullVideoBtn.classList[classOp]('video-modal-hide');
    }
    if (this.videoSourceContainer) {
      this.videoSourceContainer.classList[classOp]('video-modal-hide');
    }
  }

  updateMiniPlayerCtaVisibility() {
    const miniPlayerActions = this.modal.querySelector('.miniplayer-actions');
    if (miniPlayerActions) {
      const fullVideoExists = !!this.model.parentURL;
      const classOp = fullVideoExists ? 'remove' : 'add';
      miniPlayerActions.classList[classOp]('video-modal-actions-hide');
    }
  }
}
