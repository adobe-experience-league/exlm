import { fetchLanguagePlaceholders, getPathDetails } from '../scripts.js';
import { loadCSS } from '../lib-franklin.js';
import Dropdown, { DROPDOWN_VARIANTS } from '../dropdown/dropdown.js';

export default class ResponsiveList {
  /**
   * Initializes the ResponsiveList with provided options.
   * @param {Object} options - Configuration options for the ResponsiveList.
   * @param {HTMLElement} options.wrapper - The wrapper element for the responsive list.
   * @param {Array} options.items - The items to be displayed in the list.
   * @param {string} options.defaultSelected - The default selected item.
   * @param {Function} options.onInitCallback - Callback function to be called on initialization.
   * @param {Function} options.onSelectCallback - Callback function to be called on item selection.
   */
  constructor({ wrapper, items, defaultSelected, onInitCallback, onSelectCallback }) {
    this.wrapper = wrapper;
    this.items = items;
    this.selectedItem = defaultSelected;
    this.onInitCallback = onInitCallback;
    this.onSelectCallback = onSelectCallback;
    this.isSelectedFromUser = false;
    this.initialize();
    this.main = document.querySelector('main');
  }

  /**
   * Initializes the component, fetching language placeholders and loading CSS.
   * @returns {Promise<void>}
   */
  async initialize() {
    const { lang } = getPathDetails();
    try {
      const [placeholders] = await Promise.all([
        fetchLanguagePlaceholders(lang),
        loadCSS(`${window.hlx.codeBasePath}/scripts/responsive-list/responsive-list.css`),
      ]);
      this.placeholders = placeholders;
      this.registerWrapperResizeHandler(() => {
        this.render();
      });
      this.onInitCallback?.();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error initializing: ', error);
    }
  }

  /**
   * Debounces a function call to limit its execution rate.
   * @param {number} ms - The debounce delay in milliseconds.
   * @param {Function} fn - The function to debounce.
   * @returns {Function} - The debounced function.
   */
  // eslint-disable-next-line class-methods-use-this
  debounce(func, delay) {
    let timeoutId;

    return function debounced(...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  /**
   * Registers a resize observer for the wrapper, executing the callback on resize events.
   * @param {Function} callback - The callback to execute on resize.
   */
  registerWrapperResizeHandler(callback) {
    const debouncedCallback = this.debounce(callback, 200);
    const wrapperResizeObserver = new ResizeObserver(debouncedCallback);
    wrapperResizeObserver.observe(this.wrapper);
  }

  /**
   * Evaluates the width of the list and its wrapper to determine layout suitability.
   * @returns {Object} - An object containing the wrapper and list widths.
   */
  evaluateWidth() {
    const main = document.querySelector('main');
    const tempWrapper = document.createElement('div');
    tempWrapper.classList.add('section', 'responsive-list');
    const tempUl = document.createElement('ul');
    this.items.forEach((item) => {
      const tempLi = document.createElement('li');
      tempLi.textContent = item.title;
      tempUl.appendChild(tempLi);
    });
    tempWrapper.appendChild(tempUl);
    tempWrapper.style.visibility = 'hidden';
    main.appendChild(tempWrapper);
    const wrapperWidth = tempWrapper.getBoundingClientRect().width;
    const listWidth = tempUl.getBoundingClientRect().width;
    const widthInfo = {
      wrapperWidth,
      listWidth,
    };
    main.removeChild(tempWrapper);
    return widthInfo;
  }

  /**
   * Selects a tab and triggers the corresponding selection callback.
   * @param {HTMLElement} selectedElement - The element representing the selected tab.
   */
  selectTab(selectedElement) {
    const currentActive = this.wrapper.querySelector('.responsive-list ul li.active');
    if (currentActive === selectedElement) return;

    this.wrapper.querySelectorAll('.responsive-list ul li').forEach((label) => label.classList.remove('active'));

    selectedElement.classList.add('active');
    this.selectedItem = selectedElement.dataset.tabId;

    if (this.isSelectedFromUser) {
      const value = selectedElement.dataset.tabId;
      this.onSelectCallback?.(value);
    }
  }

  /**
   * Renders the tabbed layout based on the provided items.
   */
  renderTabbedLayout() {
    const tabWrapper = document.createElement('div');
    tabWrapper.classList.add('responsive-list');

    const tabList = document.createElement('ul');
    this.items.forEach((item) => {
      const tabItem = document.createElement('li');
      tabItem.dataset.tabId = item.value;
      tabItem.textContent = item.title;
      tabItem.addEventListener('click', () => {
        this.isSelectedFromUser = true;
        this.selectTab(tabItem);
      });
      tabList.appendChild(tabItem);
    });

    tabWrapper.appendChild(tabList);
    this.wrapper.appendChild(tabWrapper);

    if (this.selectedItem) {
      const defaultTabItem = tabList.querySelector(`[data-tab-id="${this.selectedItem}"]`);
      if (defaultTabItem) {
        this.selectTab(defaultTabItem);
      }
    }
  }

  /**
   * Renders the dropdown layout based on the provided items.
   */
  renderDropdown() {
    const uniqueId = `responsive-list-item-${parseInt(Math.random() * 10 ** 8, 10)}`;
    const dropdown = new Dropdown(this.wrapper, this.selectedItem, this.items, DROPDOWN_VARIANTS.DEFAULT, uniqueId);

    dropdown.handleOnChange((selectedOptionValue) => {
      const option = this.items.find((opt) => opt.value === selectedOptionValue);
      this.selectedItem = option?.value;
      if (option?.value && this.onSelectCallback) {
        this.isSelectedFromUser = true;
        this.onSelectCallback(option.value);
      }
    });
  }

  /**
   * Renders the appropriate layout (tabbed or dropdown) based on the screen width.
   */
  render() {
    const isDesktop = window.matchMedia('(min-width:1024px)').matches;
    const CARDS_MAX_WIDTH = 1096;
    this.wrapper.textContent = '';
    if (isDesktop) {
      const { wrapperWidth, listWidth } = this.evaluateWidth();
      if (listWidth <= wrapperWidth && listWidth <= CARDS_MAX_WIDTH) {
        this.renderTabbedLayout();
      } else {
        this.renderDropdown();
      }
    } else {
      this.renderDropdown();
    }
  }
}
