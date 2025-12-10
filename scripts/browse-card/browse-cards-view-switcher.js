import { decorateIcons, loadCSS } from '../lib-franklin.js';
import { createTag, htmlToElement, fetchLanguagePlaceholders } from '../scripts.js';
import { pushGridToggleEvent, pushListToggleEvent } from '../analytics/lib-analytics.js';

export default class BrowseCardViewSwitcher {
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
   * @param {Object} options - Options for the view switcher
   * @param {HTMLElement} options.block - The block element to attach the view switcher to
   * @param {HTMLElement} [options.container] - Optional container element for the view switcher
   * @param {Function} [options.onViewSwitch] - Optional callback function executed when view switches. Receives 'grid' or 'list' as parameter.
   * @returns {Promise<BrowseCardViewSwitcher>} A new instance with placeholders loaded
   */
  static async create(options) {
    await BrowseCardViewSwitcher.initPlaceholders();
    return new BrowseCardViewSwitcher(options);
  }

  /**
   * Constructor - prefer using the static create() method instead
   * @param {Object} options - Options for the view switcher
   * @param {HTMLElement} options.block - The block element to attach the view switcher to
   * @param {HTMLElement} [options.container] - Optional container element for the view switcher
   * @param {Function} [options.onViewSwitch] - Optional callback function executed when view switches. Receives 'grid' or 'list' as parameter.
   */
  constructor(options) {
    this.block = options?.block;
    this.container = options?.container || null;
    this.onViewSwitch = options?.onViewSwitch || null;
    this.viewSwitcher = null;
    this.gridViewBtn = null;
    this.listViewBtn = null;
    this.eventListeners = [];
    this.isListView = false;
    this.resizeObserver = null;

    if (!this.block) {
      throw new Error('Block element is required');
    }

    this.loadStyles();
    this.createViewSwitcher();
    this.setupEventListeners();
    this.initResizeHandler();
  }

  // eslint-disable-next-line class-methods-use-this
  async loadStyles() {
    await loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-cards-view-switcher.css`);
  }

  /**
   * Toggle class state on an element
   * @param {HTMLElement} element - The element to toggle class on
   * @param {string} className - The class name to toggle
   */
  static toggleClassState(element, className) {
    if (!element || !className) return;
    element.classList.toggle(className);
  }

  /**
   * Set active toggle state between two elements
   * @param {HTMLElement} activeEl - The element to activate
   * @param {HTMLElement} inactiveEl - The element to deactivate
   * @param {string} className - The class name to toggle
   */
  static setActiveToggle(activeEl, inactiveEl, className) {
    if (!activeEl || !inactiveEl) return;
    activeEl.classList.add(className);
    inactiveEl.classList.remove(className);
  }

  /**
   * Setup expandable description for a card
   * @param {HTMLElement} card - The card element
   */
  setupExpandableDescription(card) {
    const cardContent = card.querySelector('.browse-card-content');
    const description = card.querySelector('.browse-card-description-text');

    if (!description || !cardContent || !card.classList.contains('upcoming-event-card')) return;

    if (cardContent.querySelector('.show-more, .show-less')) return;

    // Calculate if the description has more than 2 lines
    const computedStyle = window.getComputedStyle(description);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const height = description.offsetHeight;
    const lines = Math.round(height / lineHeight);

    if (lines <= 2) return;

    description.classList.add('text-expanded');

    const placeholders = BrowseCardViewSwitcher.placeholders || {};
    const SHOW_MORE = placeholders.showMore || 'Show more';
    const SHOW_LESS = placeholders.showLess || 'Show Less';

    const toggleBtn = document.createElement('span');
    toggleBtn.className = 'show-more';
    toggleBtn.innerHTML = SHOW_MORE;

    const toggleHandler = (e) => {
      e.preventDefault();

      BrowseCardViewSwitcher.toggleClassState(card, 'expanded');

      const expanded = card.classList.contains('expanded');
      toggleBtn.innerHTML = expanded ? SHOW_LESS : SHOW_MORE;
      toggleBtn.className = expanded ? 'show-less' : 'show-more';
    };

    toggleBtn.addEventListener('click', toggleHandler);
    this.eventListeners.push({ element: toggleBtn, type: 'click', handler: toggleHandler });

    cardContent.appendChild(toggleBtn);
  }

  /**
   * Add card date info to a card
   * @param {HTMLElement} card - The card element
   */
  static addCardDateInfo(card) {
    const cardFigure = card.querySelector('.browse-card-figure');
    const eventInfo = card.querySelector('.browse-card-event-info');
    const footer = card.querySelector('.browse-card-footer');

    if (!eventInfo || !footer || cardFigure.querySelector('.card-figure-date')) return;

    const eventTimeText = eventInfo.querySelector('.browse-card-event-time h6')?.textContent;
    if (!eventTimeText || !eventTimeText.includes('|')) return;

    const [rawDate, rawTime] = eventTimeText.split('|');
    const dateParts = rawDate.trim();
    const timeAndZone = rawTime.trim();

    const dateDisplay = htmlToElement(`
      <div class="card-figure-date">
        <div class="calendar-icon">
          <span class="icon icon-calendar-white"></span>
        </div>
        <div class="date-display">
          ${dateParts}
        </div>
        <div class="time-display">
          ${timeAndZone}
        </div>
      </div>
    `);

    cardFigure.appendChild(dateDisplay);
    decorateIcons(dateDisplay);

    if (!footer.contains(eventInfo)) {
      const clonedEventInfo = eventInfo.cloneNode(true);
      footer.appendChild(clonedEventInfo);
    }
  }

  /**
   * Add location type info to a card footer
   * @param {HTMLElement} card - The card element
   */
  static addLocationTypeInfo(card) {
    const footer = card?.querySelector('.browse-card-footer');
    const locationType = card?.querySelector('.location-type');

    if (!footer || !locationType || footer?.querySelector('.location-type')) return;

    const locationTypeClone = locationType.cloneNode(true);
    const locationText = locationTypeClone?.textContent?.trim();
    const iconName = locationText?.toUpperCase() !== 'VIRTUAL' ? 'user' : 'desktop';

    locationTypeClone.innerHTML = '';
    const iconSpan = createTag('span', { class: `icon icon-${iconName}` });
    locationTypeClone.appendChild(iconSpan);

    const textSpan = createTag('span', {}, locationText);
    locationTypeClone.appendChild(textSpan);

    footer.appendChild(locationTypeClone);
    decorateIcons(locationTypeClone);
  }

  /**
   * Add speakers to card footer
   * @param {HTMLElement} card - The card element
   */
  static addSpeakersToFooter(card) {
    const cardFigure = card?.querySelector('.browse-card-figure');
    const footer = card?.querySelector('.browse-card-footer');

    if (!cardFigure || !footer) return;

    const speakersContainer = cardFigure?.querySelector('.event-speakers-container');
    if (!speakersContainer) return;

    if (footer?.querySelector('.footer-speakers-section')) return;

    const speakersSection = createTag('div', { class: 'footer-speakers-section' });
    const speakersHeading = createTag(
      'p',
      { class: 'speakers-heading' },
      BrowseCardViewSwitcher.placeholders?.speakersLabel || 'Speakers',
    );
    speakersSection.appendChild(speakersHeading);

    const speakerImages = speakersContainer?.querySelectorAll('.speaker-profile-container');
    const speakersList = createTag('div', { class: 'speakers-list' });

    speakerImages?.forEach((speakerContainer) => {
      const speakerImgElement = speakerContainer?.querySelector('img');
      if (!speakerImgElement) return;

      const speakerNameText = speakerImgElement?.alt?.trim();

      const speakerImgContainer = createTag('div', { class: 'speaker-img-container' });
      const speakerImg = createTag('img', {
        src: speakerImgElement?.src,
        alt: speakerNameText,
        class: speakerImgElement?.className,
      });
      speakerImgContainer.appendChild(speakerImg);

      const speakerName = createTag('div', { class: 'speaker-name' }, speakerNameText);
      const speakerInfo = createTag('div', { class: 'speaker-info' });
      speakerInfo.appendChild(speakerName);

      const speakerItem = createTag('div', { class: 'speaker-item' });
      speakerItem.appendChild(speakerImgContainer);
      speakerItem.appendChild(speakerInfo);

      speakersList.appendChild(speakerItem);
    });

    speakersSection.appendChild(speakersList);
    footer.appendChild(speakersSection);
  }

  /**
   * Create the view switcher HTML structure
   */
  createViewSwitcher() {
    this.viewSwitcher = htmlToElement(`
      <div class="browse-cards-view-switcher">
        <button type="button" class="browse-card-view-btn grid-view active" aria-label="Grid view">
          ${BrowseCardViewSwitcher.placeholders?.gridViewLabel || 'Grid'}
          <span class="icon icon-grid-white"></span>
          <span class="icon icon-grid-black"></span>
        </button>
        <button type="button" class="browse-card-view-btn list-view" aria-label="List view">
          ${BrowseCardViewSwitcher.placeholders?.listViewLabel || 'List'}
          <span class="icon icon-list-view-black"></span>
          <span class="icon icon-list-view-white"></span>
        </button>
      </div>
    `);

    decorateIcons(this.viewSwitcher);

    this.gridViewBtn = this.viewSwitcher.querySelector('.browse-card-view-btn.grid-view');
    this.listViewBtn = this.viewSwitcher.querySelector('.browse-card-view-btn.list-view');
  }

  /**
   * Initialize resize handler using ResizeObserver
   * When window width is less than 900px, remove list class and ensure grid view is selected
   */
  initResizeHandler() {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      if (windowWidth < 900) {
        this.block.classList.remove('list');
        if (this.isListView) {
          this.switchToGridView();
        }
      }
    };

    this.resizeObserver = new ResizeObserver(handleResize);
    this.resizeObserver.observe(this.block);
  }

  /**
   * Setup event listeners for view switcher buttons
   */
  setupEventListeners() {
    if (!this.gridViewBtn || !this.listViewBtn) return;

    const gridViewHandler = () => {
      this.switchToGridView();
    };

    const listViewHandler = () => {
      this.switchToListView();
    };

    this.gridViewBtn.addEventListener('click', gridViewHandler);
    this.listViewBtn.addEventListener('click', listViewHandler);

    this.eventListeners.push({ element: this.gridViewBtn, type: 'click', handler: gridViewHandler });
    this.eventListeners.push({ element: this.listViewBtn, type: 'click', handler: listViewHandler });
  }

  /**
   * Get the header text from the block
   * @returns {string} The header text
   */
  getBlockHeader() {
    const headerEl = this.block?.querySelector('.browse-cards-block-title');
    return (headerEl?.innerText || this.block?.getAttribute('data-block-name') || '').trim();
  }

  /**
   * Switch to grid view
   */
  switchToGridView() {
    if (this.isListView) {
      this.block.classList.remove('list');
      BrowseCardViewSwitcher.setActiveToggle(this.gridViewBtn, this.listViewBtn, 'active');
      this.isListView = false;
      // Push grid toggle event to analytics with block header
      const cardHeader = this.getBlockHeader();
      pushGridToggleEvent(cardHeader);
      if (this.onViewSwitch && typeof this.onViewSwitch === 'function') {
        this.onViewSwitch('grid');
      }
    }
  }

  /**
   * Switch to list view
   */
  switchToListView() {
    if (!this.isListView) {
      this.block.classList.add('list');
      BrowseCardViewSwitcher.setActiveToggle(this.listViewBtn, this.gridViewBtn, 'active');
      this.isListView = true;

      this.enhanceCardsForListView();

      // Push list toggle event to analytics with block header
      const cardHeader = this.getBlockHeader();
      pushListToggleEvent(cardHeader);

      if (this.onViewSwitch && typeof this.onViewSwitch === 'function') {
        this.onViewSwitch('list');
      }
    }
  }

  /**
   * Enhance cards for list view by adding additional information
   */
  enhanceCardsForListView() {
    const cards = this.block.querySelectorAll('.browse-card');
    cards.forEach((card) => {
      BrowseCardViewSwitcher.addCardDateInfo(card);
      this.setupExpandableDescription(card);
      BrowseCardViewSwitcher.addLocationTypeInfo(card);
      BrowseCardViewSwitcher.addSpeakersToFooter(card);
    });
  }

  /**
   * Get the view switcher element
   * @returns {HTMLElement} The view switcher element
   */
  getViewSwitcher() {
    return this.viewSwitcher;
  }

  /**
   * Append the view switcher to a container
   * @param {HTMLElement} container - The container element to append to
   */
  appendTo(container) {
    if (container && this.viewSwitcher) {
      container.appendChild(this.viewSwitcher);
    }
  }

  /**
   * Remove event listeners and clean up
   */
  removeEventListeners() {
    this.eventListeners.forEach(({ element, type, handler }) => {
      if (element) {
        element.removeEventListener(type, handler);
      }
    });
    this.eventListeners.length = 0;
  }

  /**
   * Destroy the view switcher instance
   */
  destroy() {
    this.removeEventListeners();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.viewSwitcher && this.viewSwitcher.parentNode) {
      this.viewSwitcher.parentNode.removeChild(this.viewSwitcher);
    }
    this.viewSwitcher = null;
    this.gridViewBtn = null;
    this.listViewBtn = null;
  }
}
