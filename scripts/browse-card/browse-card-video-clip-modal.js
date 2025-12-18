import { decorateIcons, loadCSS } from '../lib-franklin.js';
import { createTag, htmlToElement, fetchLanguagePlaceholders, getPathDetails } from '../scripts.js';
import { pushVideoEvent } from '../analytics/lib-analytics.js';
import { getLocalizedVideoUrl } from '../utils/video-utils.js';

export const isCompactUIMode = () => window.matchMedia('(max-width: 1023px)').matches;

export class BrowseCardVideoClipModal {
  static activeInstance = null;

  static placeholders = {};

  static placeholdersInitialized = false;

  static async initPlaceholders() {
    if (!this.placeholdersInitialized) {
      try {
        this.placeholders = await fetchLanguagePlaceholders();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        this.placeholdersInitialized = true;
      }
    }
    return this.placeholders;
  }

  static async create(options) {
    await BrowseCardVideoClipModal.initPlaceholders();
    return new BrowseCardVideoClipModal(options);
  }

  constructor(options) {
    this.model = options?.model || {};

    if (BrowseCardVideoClipModal.activeInstance) {
      // If the same video clip is clicked (check by id), ensure it's visible and return the existing instance
      if (BrowseCardVideoClipModal.activeInstance.model.parentURL === this.model.parentURL) {
        BrowseCardVideoClipModal.activeInstance.open();
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

    BrowseCardVideoClipModal.activeInstance = this;

    this.eventListeners = [];
    this.isInitialized = false;
    this.eventsBound = false;

    this.modal = null;
    this.backdrop = null;
    this.videoContainer = null;
    this.contentCard = null;
    this.miniPlayerMode = false;
    this.miniPlayerButton = null;
    this.miniPlayerLabel = null;

    this.isCompactMode = isCompactUIMode();

    this.initPromise = this.init();
  }

  async init() {
    await this.loadStyles();
    await this.createModal();
    this.isInitialized = true;
  }

  // eslint-disable-next-line class-methods-use-this
  async loadStyles() {
    await loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-video-clip-modal.css`);
  }

  async createModal() {
    const { title, videoURL, parentName, parentURL, product, failedToLoad = false } = this.model;

    const { lang = 'en' } = getPathDetails() || {};
    const videoSrc = videoURL ? await getLocalizedVideoUrl(videoURL, lang) : '';

    let tagTextHTML = '';
    if (product?.length > 0 || failedToLoad) {
      const tagText = product?.join(', ') || '';
      const isMulti = product?.length > 1;

      tagTextHTML = isMulti
        ? `
        <div class="video-modal-tag-text">
          <h4>${BrowseCardVideoClipModal.placeholders?.multiSolutionText || ''}</h4>
          <div class="video-modal-tooltip-placeholder">
            <div class="video-modal-tooltip video-modal-tooltip-top video-modal-tooltip-grey">
              <span class="icon icon-info"></span>
              <span class="video-modal-tooltip-text">${tagText}</span>
            </div>
          </div>
        </div>`
        : `
        <div class="video-modal-tag-text">
          <h4>${tagText}</h4>
        </div>`;
    }

    this.backdrop = htmlToElement(`
      <div class="browse-card-video-clip-modal-backdrop">
        <div class="browse-card-video-clip-modal-actions backdrop-actions">
          <button class="browse-card-video-clip-modal-miniplayer">
            <span class="icon icon-activate-mini-player"></span>
            <span class="miniplayer-label">
              ${BrowseCardVideoClipModal.placeholders?.activateMiniplayerText || ''}
            </span>
          </button>
          <button class="browse-card-video-clip-modal-close">
            <span class="close-label">
              ${BrowseCardVideoClipModal.placeholders?.closePlayerText || ''}
            </span>
            <span class="icon icon-close-white"></span>
          </button>
        </div>

        <div class="browse-card-video-clip-modal">
          <div class="browse-card-video-clip-modal-content">
            <div class="browse-card-video-clip-modal-actions modal-actions">
              <button class="browse-card-video-clip-modal-miniplayer">
                <span class="icon icon-expand-player"></span>
                <span class="miniplayer-label">
                  ${BrowseCardVideoClipModal.placeholders?.expandVideoPlayerText || ''}
                </span>
              </button>
              <button class="browse-card-video-clip-modal-close">
                <span class="close-label">
                  ${BrowseCardVideoClipModal.placeholders?.closePlayerText || ''}
                </span>
                <span class="icon icon-close-white"></span>
              </button>
            </div>

            <div class="browse-card-video-clip-modal-body">
              <div class="browse-card-video-clip-container"></div>

              <div class="browse-card-video-clip-info">
                ${tagTextHTML}
                <div class="browse-card-video-clip-info-header">
                  <h4 class="browse-card-video-clip-info-title">${title || ''}</h4>
                </div>
                <div class="browse-card-source-row">
                  <div class="browse-card-source">
                    <span>${BrowseCardVideoClipModal.placeholders?.clippedFrom || ''}</span>
                    <a target="_blank" href="${parentURL || '#'}">
                      ${parentName || ''}
                    </a>
                  </div>
                  <div class="browse-card-actions">
                    <button class="browse-card-button">
                      <a href="${parentURL}" class="browse-card-full-link" target="_blank">
                        ${BrowseCardVideoClipModal.placeholders?.watchFullVideo || ''}
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
    this.videoContainer = this.backdrop.querySelector('.browse-card-video-clip-container');
    this.contentCard = this.backdrop.querySelector('.browse-card-video-clip-info');

    if (videoSrc) {
      const iframe = createTag('iframe', {
        src: videoSrc,
        allowfullscreen: true,
      });
      this.videoContainer.appendChild(iframe);
    }

    this.backdropMiniPlayerButton = this.backdrop.querySelector('.browse-card-video-clip-modal-miniplayer');
    this.backdropCloseButton = this.backdrop.querySelector('.browse-card-video-clip-modal-close');
    this.modalMiniPlayerButton = this.modal.querySelector('.browse-card-video-clip-modal-miniplayer');
    this.modalCloseButton = this.modal.querySelector('.browse-card-video-clip-modal-close');

    decorateIcons(this.backdrop);
  }

  setupEventListeners() {
    const closeHandler = () => this.close();
    const miniHandler = () => this.toggleMiniPlayer();

    [this.backdropCloseButton, this.modalCloseButton].forEach((btn) => {
      btn.addEventListener('click', closeHandler);
      this.eventListeners.push({ element: btn, type: 'click', handler: closeHandler });
    });

    [this.backdropMiniPlayerButton, this.modalMiniPlayerButton].forEach((btn) => {
      btn.addEventListener('click', miniHandler);
      this.eventListeners.push({ element: btn, type: 'click', handler: miniHandler });
    });

    const messageHandler = (event) => {
      if (event.data?.type === 'mpcStatus' && event.data.state === 'play') {
        pushVideoEvent({
          title: this.model.title || '',
          description: this.model.description || '',
          url: this.model.videoURL || '',
          duration: this.model.duration || '',
        });
      }
    };

    window.addEventListener('message', messageHandler);
    this.eventListeners.push({
      element: window,
      type: 'message',
      handler: messageHandler,
    });

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.backdrop);
  }

  handleResize() {
    const currentState = isCompactUIMode();
    if (this.isCompactMode !== currentState) {
      this.isCompactMode = currentState;

      if (currentState && this.miniPlayerMode) {
        this.toggleMiniPlayer();
      }

      this.backdrop.classList.toggle('compact-mode', currentState);
      this.modal.classList.toggle('compact-mode', currentState);
    }
    this.updateModalDimensions();
  }

  async open() {
    await this.initPromise;

    if (document.body.contains(this.backdrop)) return;

    document.body.appendChild(this.backdrop);

    if (!this.eventsBound) {
      this.setupEventListeners();
      this.eventsBound = true;
    }

    // eslint-disable-next-line no-unused-expressions
    this.backdrop.offsetHeight;
    // eslint-disable-next-line no-unused-expressions
    this.modal.offsetHeight;

    this.backdrop.classList.add('visible', 'expanded-mode');
    this.modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.backdrop.classList.remove('visible');
    this.modal.classList.remove('visible');

    setTimeout(() => {
      this.backdrop.remove();
      document.body.style.overflow = '';
      this.removeEventListeners();
      this.eventsBound = false;
      BrowseCardVideoClipModal.activeInstance = null;
    }, 300);
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ element, type, handler }) => element?.removeEventListener(type, handler));
    this.eventListeners = [];
    this.resizeObserver?.disconnect();
  }

  toggleMiniPlayer() {
    if (isCompactUIMode() && !this.miniPlayerMode) return;

    this.miniPlayerMode = !this.miniPlayerMode;
    this.modal.classList.toggle('mini-player-mode', this.miniPlayerMode);
    this.backdrop.classList.toggle('mini-player-mode', this.miniPlayerMode);
    this.backdrop.classList.toggle('expanded-mode', !this.miniPlayerMode);

    document.body.style.overflow = this.miniPlayerMode ? '' : 'hidden';
    this.updateModalDimensions();
  }

  updateModalDimensions() {
    const width = this.modal.offsetWidth;
    if (width) {
      const actions = this.backdrop.querySelector('.backdrop-actions');
      actions.style.maxWidth = this.miniPlayerMode ? '' : `${width}px`;
    }
  }

  async updateContent(model) {
    this.model = model;
  }
}
