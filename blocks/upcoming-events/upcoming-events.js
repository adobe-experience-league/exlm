import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { fetchLanguagePlaceholders, htmlToElement, getConfig } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * Retrieves a list of unique product focus items from live events data.
 */
async function getListofProducts() {
  try {
    let data;
    const { liveEventsUrl } = getConfig();
    const response = await fetch(liveEventsUrl, {
      method: 'GET',
    });

    if (response.ok) {
      data = await response.json();
    }

    const events = data?.eventList?.events || [];

    // Extract unique productFocus items and sort alphabetically
    const products = Array.from(new Set(events.flatMap((event) => event.productFocus || []))).sort();

    return products;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching data', error);
    return [];
  }
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const [headingElement, descriptionElement, filterLabelElement] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  block.innerHTML = '';
  block.classList.add('upcoming-events-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
        <div class="browse-cards-block-title">
          ${headingElement?.innerHTML || ''}
        </div>
        <div class="browse-card-description-text">
          ${descriptionElement?.innerHTML || ''}
        </div>
      <form class="browse-card-dropdown">
      <label>${filterLabelElement?.innerHTML}</label>
      </form>
    </div>
  `);

  const tagsContainer = document.createElement('div');
  tagsContainer.classList.add('browse-card-tags');
  headerDiv.appendChild(tagsContainer);

  block.appendChild(headerDiv);

  const products = await getListofProducts();
  const productsList = [];
  products.forEach((product) => {
    productsList.push({
      title: product,
    });
  });

  // Initialize the dropdown with product options
  const productDropdown = new Dropdown(
    block.querySelector('.browse-card-dropdown'),
    `${placeholders?.filterProductLabel || 'Product'}`,
    productsList,
    'multi-select',
  );

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  const parameters = {
    contentType: CONTENT_TYPES.LIVE_EVENT.MAPPING_KEY,
  };

  const buildCardsShimmer = new BrowseCardShimmer();
  buildCardsShimmer.addShimmer(block);
  let browseCardsContent;
  try {
    browseCardsContent = await BrowseCardsDelegate.fetchCardData(parameters);
    // eslint-disable-next-line no-use-before-define
    const filteredLiveEventsData = fetchFilteredCardData(browseCardsContent, []);

    buildCardsShimmer.removeShimmer();

    if (filteredLiveEventsData?.length) {
      filteredLiveEventsData.forEach((cardData) => {
        const cardDiv = document.createElement('div');
        buildCard(contentDiv, cardDiv, cardData);
        contentDiv.appendChild(cardDiv);
      });
      block.appendChild(contentDiv);
    }
  } catch (err) {
    buildCardsShimmer.removeShimmer();
    // eslint-disable-next-line no-console
    console.error('Error loading upcoming event cards:', err);
  }

  productDropdown.handleOnChange((selectedValues) => {
    const selectedFilters = Array.isArray(selectedValues)
      ? selectedValues.filter((item) => item.trim() !== '')
      : selectedValues
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item !== '');

    const tags = [...tagsContainer.querySelectorAll('.browse-tags')].map((tag) => tag.value);

    tags.filter((tag)=> !selectedFilters.includes(tag)).forEach((tag)=>{
      [...tagsContainer.querySelectorAll('.browse-tags')].forEach((existingTag) =>{ if(existingTag.value === tag) existingTag.remove()});
    })

    selectedFilters
      .filter((filter) => !tags.includes(filter))
      .forEach((filter) => {
        const tagElement = document.createElement('button');
        tagElement.classList.add('browse-tags');
        tagElement.value = filter;
        tagElement.innerHTML = `<span>${
          placeholders?.filterProductLabel || 'Product'
        }: ${filter}</span><span class="icon icon-close"></span>`;
        tagsContainer.appendChild(tagElement);
        decorateIcons(tagElement);
        tagElement.addEventListener('click', (event) => {
          const { value } = event.target.closest('.browse-tags');
          tagElement.remove();
          [...block.querySelectorAll('.browse-card-dropdown .custom-checkbox input')].forEach((checkbox) => {
            if (checkbox.value === value) checkbox.click();
          });
        });
      });

    // eslint-disable-next-line no-use-before-define
    const updatedData = fetchFilteredCardData(browseCardsContent, selectedFilters);

    contentDiv.innerHTML = ''; // Clear previous cards
    updatedData.forEach((cardData) => {
      const cardDiv = document.createElement('div');
      buildCard(contentDiv, cardDiv, cardData);
      contentDiv.appendChild(cardDiv);
    });
  });

  /**
   * Fetches filtered card data based on selected parameters.
   * @param {Array} data - List of card data objects.
   * @param {Array} params - Selected filter parameters.
   * @returns {Array} - Filtered and sorted card data.
   */
  function fetchFilteredCardData(data, params) {
    if (!data) return [];
    const solutionsList = Array.isArray(params) ? params : [params];

    // If no filters are selected, return all data sorted by event time
    if (solutionsList.length === 0) {
      return data.filter((card) => card.event?.time).sort((a, b) => new Date(a.event.time) - new Date(b.event.time));
    }

    // Filter events that match any of the selected filters
    return data
      .filter((event) => {
        const productArray = Array.isArray(event.product) ? event.product : [event.product];
        return solutionsList.some((filter) => productArray.includes(filter));
      })
      .filter((card) => card.event?.time) // Ensure valid event time
      .sort((a, b) => new Date(a.event.time) - new Date(b.event.time));
  }
}
