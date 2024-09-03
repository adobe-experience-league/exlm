import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/tabbed-card/tabbed-card.css`);

const convertToTitleCaseAndRemove = (str) => str.replace(/[-\s]/g, '').replace(/\b\w/g, (match) => match.toUpperCase());

export default class TabbedCard {
  constructor({
    parentFormElement,
    defaultValue,
    optionsArray,
    placeholders,
    decorateExternalLinks,
    fetchDataAndRenderBlock,
    urlMap,
    showViewAll = true,
    onTabFormReady,
  }) {
    const [firstOption] = optionsArray;
    this.parentFormElement = parentFormElement;
    this.defaultValue = defaultValue || firstOption;
    this.optionsArray = optionsArray;
    this.placeholders = placeholders;
    this.decorateExternalLinks = decorateExternalLinks;
    this.fetchDataAndRenderBlock = fetchDataAndRenderBlock;
    this.onTabFormReady = onTabFormReady || this.renderTabContent;
    this.urlMap = urlMap || {};
    this.showViewAll = showViewAll;
    this.id = document.querySelectorAll('.custom-filter-tabbedcard').length;

    this.initTabStructure();
  }

  initTabStructure() {
    // Create view link element
    const viewLink = this.showViewAll ? document.createElement('div') : null;
    let viewLinkURLElement;
    if (this.showViewAll) {
      viewLink.classList.add('browse-cards-block-view');
      viewLinkURLElement = document.createElement('a');
      viewLink.appendChild(viewLinkURLElement);
    }

    // Create tab list for different content types
    const tabList = document.createElement('div');
    tabList.classList.add('tabbed-cards-label');
    const tabListUlElement = document.createElement('ul');
    this.optionsArray.forEach((contentType) => {
      const contentTypeLowerCase = contentType.toLowerCase();
      const contentTypeTitleCase = convertToTitleCaseAndRemove(contentType);
      const tabLabel = document.createElement('li');
      tabLabel.textContent = this.placeholders[`tabbedCard${contentTypeTitleCase}TabLabel`] || contentType;
      // Create individual tab labels and attach click event listener
      tabLabel.addEventListener('click', () => {
        // Clear Existing Label
        const tabLabelsListElements = this.parentFormElement.querySelectorAll('.tabbed-cards-label ul li');
        tabLabelsListElements.forEach((label) => {
          label.classList.remove('active');
        });
        // Clear existing cards
        const tabbedContent = this.parentFormElement.querySelector('.tabbed-cards-block');
        tabLabel.classList.add('active');
        if (tabbedContent) {
          tabbedContent.innerHTML = '';
        }

        // Clear No Results Content if avaliabel
        const noResultsContent = this.parentFormElement.querySelector('.browse-card-no-results');
        if (noResultsContent) {
          noResultsContent.remove();
        }
        if (viewLinkURLElement) {
          // Update view link and fetch/render data for the selected tab
          viewLinkURLElement.innerHTML =
            this.placeholders[`tabbedCard${contentTypeTitleCase}ViewAllLabel`] || 'View All';
          viewLinkURLElement.setAttribute('href', this.urlMap[contentTypeLowerCase]);
          tabList.appendChild(viewLinkURLElement);
        }
        // buildCardsShimmer.add(block);
        if (this.fetchDataAndRenderBlock) {
          this.fetchDataAndRenderBlock(contentTypeLowerCase);
        }
      });
      tabListUlElement.appendChild(tabLabel);
      // Append tab label to the tab list
      tabList.appendChild(tabListUlElement);
      if (contentType === this.defaultValue) {
        tabLabel.classList.add('active');
      }
      if (this.decorateExternalLinks) {
        this.decorateExternalLinks(this.parentFormElement);
      }
    });
    this.parentFormElement.appendChild(tabList);
    this.onTabFormReady(this.parentFormElement);

    if (this.fetchDataAndRenderBlock) {
      this.fetchDataAndRenderBlock(this.defaultValue);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  renderTabContent(block) {
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('browse-cards-block-content', 'tabbed-cards-block');
    block.appendChild(contentDiv);
  }
}
