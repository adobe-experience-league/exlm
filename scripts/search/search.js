import { getMetadata } from '../lib-franklin.js';
import { htmlToElement, loadIms, getLanguageCode, getConfig } from '../scripts.js';
import SearchDelegate from './search-delegate.js';

const { searchUrl } = getConfig();

// Get language code from URL
const languageCode = await getLanguageCode();
// Get solution from metadata
const solution = getMetadata('solution')?.split(',')[0].trim();

// Redirects to the search page based on the provided search input and filters
export const redirectToSearchPage = (searchInput, filters = '') => {
  const baseTargetUrl = searchUrl;
  let targetUrlWithLanguage = `${baseTargetUrl}?lang=${languageCode}`;
  const filterValue = filters && filters.toLowerCase() === 'all' ? '' : filters;
  if (searchInput) {
    const trimmedSearchInput = encodeURIComponent(searchInput.trim());
    targetUrlWithLanguage += `#q=${trimmedSearchInput}`;
  } else {
    targetUrlWithLanguage += '#sort=relevancy';
  }
  if (filterValue) {
    const filterValueEncoded = encodeURIComponent(`[${filterValue}]`);
    targetUrlWithLanguage += `&f:@el_contenttype=${filterValueEncoded}`;
  }

  if (solution) {
    const solutionEncoded = encodeURIComponent(`[${solution}]`);
    targetUrlWithLanguage += `&f:el_product=${solutionEncoded}`;
  }

  window.location.href = targetUrlWithLanguage;
};

export default class Search {
  constructor({ searchBlock }) {
    this.searchBlock = searchBlock;
    this.callbackFn = null;
    this.searchQuery = '';
    this.initTokens();
  }

  async initTokens() {
    try {
      await loadIms();
    } catch {
      // eslint-disable-next-line no-console
      console.warn('Adobe IMS not available.');
    }

    if (this.callbackFn) {
      this.callbackFn.call(this);
    }
  }

  configureAutoComplete({ searchOptions, showSearchSuggestions = true }) {
    this.searchOptions = searchOptions || [];
    this.showSearchSuggestions = showSearchSuggestions;
    const [firstOption = ''] = this.searchOptions;
    this.selectedSearchOption = firstOption;
    this.canHideSearchOptions = false;
    this.searchPickerLabelEl = null;
    this.searchPickerLabelEl = this.searchBlock.querySelector('.search-picker-button .search-picker-label');
    this.searchPickerPopover = this.searchBlock.querySelector('.search-picker-popover');
    this.selectedCheckmarkEl = this.searchPickerPopover.querySelector('.icon');
    this.searchSuggestionsPopover = this.searchBlock.querySelector('.search-suggestions-popover');
    this.searchInput = this.searchBlock.querySelector('.search-input');
    this.clearSearchIcon = this.searchBlock.querySelector('.search-clear-icon');

    this.searchPopoverEnter = this.onSearchPopoverEnter.bind(this);
    this.searchPopoverLeave = this.onSearchPopoverLeave.bind(this);
    this.searchPopoverClick = this.onSearchPopoverClick.bind(this);
    this.searchPopoverKeydown = this.onSearchPopoverKeydown.bind(this);
    this.searchSuggestionsKeydown = this.onSearchSuggestionsKeydown.bind(this);
    this.searchSuggestionsClick = this.onSearchSuggestionsClick.bind(this);
    this.handleSearchInputClick = this.onSearchInputClick.bind(this);
    this.handleSearchInputKeyup = this.onSearchInputKeyup.bind(this);
    this.searchKeydown = this.onSearchInputKeydown.bind(this);
    this.hideSearchSuggestions = this.onHideSearchSuggestions.bind(this);
    this.selectSearchSuggestion = this.handleSearchSuggestion.bind(this);
    this.handleGlobalKeydown = this.onGlobalKeydown.bind(this);
    this.savedDefaultSuggestions = null;
    this.setupAutoCompleteEvents();
    this.callbackFn = this.showSearchSuggestions ? this.fetchInitialSuggestions : null;
  }

  setupAutoCompleteEvents() {
    // Redirects the Search Icon to Required Search Page with Params
    const searchContainer = this.searchBlock.querySelector('.search-full .search-container');
    if (searchContainer) {
      const iconSearchElement = searchContainer.querySelector('.icon-search');
      if (iconSearchElement) {
        iconSearchElement.addEventListener('click', () => {
          const searchInputValue = this.searchInput.value.trim();
          const { filterValue } = this.searchPickerLabelEl.dataset;
          redirectToSearchPage(searchInputValue, filterValue);
        });
      }
    }

    const searchButton = this.searchBlock.querySelector('.search-picker-button');
    if (searchButton && this.searchPickerPopover) {
      searchButton.addEventListener('click', () => {
        this.searchPickerPopover.classList.add('search-picker-popover-visible');
        searchButton.classList.add('search-picker-open');
        this.searchPickerPopover.addEventListener('mouseenter', this.searchPopoverEnter);
        this.searchPickerPopover.addEventListener('mouseleave', this.searchPopoverLeave);
        this.searchPickerPopover.addEventListener('click', this.searchPopoverClick);
        this.searchPickerPopover.addEventListener('keydown', this.searchPopoverKeydown);
      });

      searchButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          if (this.searchPickerPopover.classList.contains('search-picker-popover-visible')) {
            this.searchPickerPopover.removeEventListener('keydown', this.searchPopoverKeydown);
            this.searchPickerPopover.classList.remove('search-picker-popover-visible');
            searchButton.classList.remove('search-picker-open');
          } else {
            this.searchPickerPopover.addEventListener('keydown', this.searchPopoverKeydown);
            this.searchPickerPopover.classList.add('search-picker-popover-visible');
            searchButton.classList.add('search-picker-open');
            this.searchPickerPopover.querySelector('li')?.focus();
          }
        }
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('keyup', this.handleSearchInputKeyup);
      this.searchInput.addEventListener('click', this.handleSearchInputClick);
      this.searchInput.addEventListener('focus', () => {
        this.searchInput.addEventListener('keydown', this.searchKeydown);
      });
      this.searchInput.addEventListener('blur', () => {
        this.searchInput.removeEventListener('keydown', this.searchKeydown);
      });
      this.searchInput.addEventListener('keydown', (e) => this.handleEnterKey(e));
    }

    if (this.clearSearchIcon) {
      this.clearSearchIcon.addEventListener('click', (e) => {
        this.searchInput.value = '';
        this.searchQuery = '';
        this.clearSearchIcon.classList.remove('search-icon-show');
        this.handleSearchInputClick(e);
        this.searchInput.focus();
      });
    }

    // Redirects the Search Icon to Required Search Page with Params
    const searchIcon = this.searchBlock.querySelector('.search-icon');
    if (searchIcon) {
      searchIcon.addEventListener('click', () => {
        const searchInputValue = this.searchInput.value.trim();
        const { filterValue } = this.searchPickerLabelEl.dataset;
        redirectToSearchPage(searchInputValue, filterValue);
      });
    }
  }

  // Redirects to Required Search Page with Params on Click on Enter Key
  handleEnterKey(e) {
    if (e.key === 'Enter') {
      const searchInputValue = this.searchInput.value.trim();
      const { filterValue } = this.searchPickerLabelEl.dataset;
      redirectToSearchPage(searchInputValue, filterValue);
    }
  }

  onSearchPopoverLeave() {
    if (this.canHideSearchOptions) {
      this.searchPickerPopover.classList.remove('search-picker-popover-visible');
      this.searchBlock.querySelector('.search-picker-button')?.classList.remove('search-picker-open');
      this.canHideSearchOptions = false;
      this.searchPickerPopover.removeEventListener('mouseenter', this.searchPopoverEnter);
      this.searchPickerPopover.removeEventListener('mouseleave', this.searchPopoverLeave);
      this.searchPickerPopover.removeEventListener('click', this.searchPopoverClick);
      this.searchPickerPopover.removeEventListener('keydown', this.searchPopoverKeydown);
    }
  }

  onSearchPopoverEnter() {
    this.canHideSearchOptions = true;
  }

  onGlobalKeydown(e) {
    if (e.key === 'Escape') {
      this.onHideSearchSuggestions(null, true);
    }
  }

  onSearchPopoverClick(e) {
    if (e.target) this.setSelectedSearchOption(e.target.dataset.filterValue);
  }

  onSearchPopoverKeydown(e) {
    if (e.key === 'Enter' && e.target && this.searchOptions.includes(e.target.textContent.trim())) {
      this.searchPickerPopover.querySelector('.icon').remove();
      this.setSelectedSearchOption(e.target.dataset.filterValue);
      e.target.append(this.selectedCheckmarkEl);
    }
  }

  onSearchSuggestionsKeydown(e) {
    const isArrowUp = e.key === 'ArrowUp';
    const isArrowDown = e.key === 'ArrowDown';
    if (!e.target || !e.target.classList.contains('search-picker-label')) {
      return;
    }
    if (!isArrowUp && !isArrowDown) {
      if (e.key === 'Enter') {
        this.selectSearchSuggestion(e);
      }
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const targetElement = isArrowDown
      ? e.target.nextElementSibling || e.target.parentElement.firstElementChild
      : e.target.previousElementSibling || e.target.parentElement.lastElementChild;
    if (targetElement) {
      targetElement.focus();
      const query = targetElement.textContent;
      this.searchInput.value = query;
      this.searchQuery = query;
    }
  }

  onSearchSuggestionsClick(e) {
    this.selectSearchSuggestion(e);
  }

  onSearchInputClick(e) {
    if (!this.searchInput.value && this.savedDefaultSuggestions) {
      this.renderSearchSuggestions(this.savedDefaultSuggestions);
      this.onShowSearchSuggestions(e);
    }
  }

  onShowSearchSuggestions(e) {
    this.searchSuggestionsPopover.classList.add('search-suggestions-popover-visible');
    this.searchSuggestionsPopover.addEventListener('keydown', this.searchSuggestionsKeydown);
    this.searchSuggestionsPopover.addEventListener('click', this.searchSuggestionsClick);
    e?.stopPropagation();
    document.addEventListener('click', this.hideSearchSuggestions, {
      once: true,
    });
    document.addEventListener('keydown', this.handleGlobalKeydown);
  }

  onHideSearchSuggestions(e, forceHide = false) {
    if (
      !e?.target ||
      (e.target && !this.searchInput.contains(e.target) && !this.searchSuggestionsPopover.contains(e.target)) ||
      forceHide
    ) {
      this.searchSuggestionsPopover.classList.remove('search-suggestions-popover-visible');
      this.searchSuggestionsPopover.removeEventListener('keydown', this.searchSuggestionsKeydown);
      this.searchSuggestionsPopover.removeEventListener('click', this.searchSuggestionsClick);
      document.removeEventListener('keydown', this.handleGlobalKeydown);
    }
  }

  async onSearchInputKeyup(e) {
    const searchText = e.target.value;
    const textIsEmptied = this.searchQuery.length && searchText.length === 0;
    this.searchQuery = e.target.value;
    const containsText = this.searchQuery.length > 0;

    if (!containsText) {
      this.clearSearchIcon.classList.remove('search-icon-show');
      if (textIsEmptied) {
        this.handleSearchInputClick(e);
      }
      return;
    }
    this.clearSearchIcon.classList.add('search-icon-show');

    if (!this.showSearchSuggestions || e.key === 'Escape') {
      return;
    }
    const suggestions = await this.fetchSearchSuggestions(this.searchQuery);
    const { completions = [] } = suggestions;
    if (completions.length > 0) {
      this.renderSearchSuggestions(suggestions);
      if (!this.searchSuggestionsPopover.classList.contains('search-suggestions-popover-visible')) {
        this.onShowSearchSuggestions();
      }
    }
  }

  onSearchInputKeydown(e) {
    const isArrowUp = e.key === 'ArrowUp';
    const isArrowDown = e.key === 'ArrowDown';
    if (!isArrowDown && !isArrowUp) {
      return;
    }
    document.removeEventListener('click', this.hideSearchSuggestions);
    e.preventDefault();
    e.stopPropagation();
    const targetElement = isArrowUp
      ? this.searchSuggestionsPopover.querySelector('li:last-child')
      : this.searchSuggestionsPopover.querySelector('li');
    if (targetElement) {
      targetElement.focus();
      const query = targetElement.textContent;
      this.searchInput.value = query;
      this.searchQuery = query;
      if (this.searchQuery) {
        this.clearSearchIcon.classList.add('search-icon-show');
      } else {
        this.clearSearchIcon.classList.remove('search-icon-show');
      }
      document.addEventListener('click', this.hideSearchSuggestions, {
        once: true,
      });
    }
  }

  // Redirects to Suggestions to quired Search Page with Params
  handleSearchSuggestion(e) {
    const suggestion = e.target?.textContent || '';
    this.searchInput.value = suggestion;
    if (this.searchInput.value) {
      this.clearSearchIcon.classList.add('search-icon-show');
    }
    this.hideSearchSuggestions(e, true);
    redirectToSearchPage(suggestion, this.searchPickerLabelEl.dataset.filterValue);
  }

  setSelectedSearchOption(filterValue) {
    const selectedEl = this.searchPickerPopover.querySelector(`.search-picker-label[data-filter-value=${filterValue}]`);
    const optionLabel = selectedEl.textContent;

    const searchParams = this.searchOptions.map((o) => o.split(':')[0]);
    if (searchParams.includes(optionLabel)) {
      this.searchPickerPopover.querySelector('.icon').remove();
      selectedEl.append(this.selectedCheckmarkEl);
    }

    this.selectedSearchOption = optionLabel;
    this.searchPickerLabelEl.textContent = this.selectedSearchOption;
    this.searchPickerLabelEl.setAttribute('data-filter-value', filterValue);
  }

  async fetchSearchSuggestions(query = '') {
    this.searchQuery = query;
    return SearchDelegate.fetchSearchSuggestions(query);
  }

  async fetchInitialSuggestions() {
    const suggestions = await this.fetchSearchSuggestions('');
    this.savedDefaultSuggestions = suggestions;
  }

  renderSearchSuggestions(suggestions) {
    const { completions = [] } = suggestions;
    const searchSuggestions = htmlToElement(`
            <ul>
            ${completions
              .map((data) => {
                const { expression } = data;
                let text;
                if (this.searchQuery) {
                  const regex = new RegExp(`${this.searchQuery}`, 'g');
                  text = expression.replace(regex, `<span class="search-highlight-text">${this.searchQuery}</span>`);
                } else {
                  text = expression;
                }
                return `<li role="option" tabindex="0" class="search-picker-label">${text}</li>`;
              })
              .join('')}
            </ul>
        `);
    const wrapper = this.searchSuggestionsPopover.firstElementChild;
    wrapper.replaceWith(searchSuggestions);
  }
}
