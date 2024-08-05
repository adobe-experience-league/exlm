import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { createPlaceholderSpan, getPathDetails, htmlToElement } from '../../scripts/scripts.js';
import { newMultiSelect, newPagination, newShowHidePanel } from './dom-helpers.js';

async function fetchPlaylists() {
  const { lang } = getPathDetails();
  const resp = await fetch(`/${lang}/playlists.json`);
  return resp.json();
}

const playlistsPromise = fetchPlaylists();
const filterOptions = [
  { legend: 'Product', filterName: 'solution' },
  { legend: 'Role', filterName: 'role' },
  { legend: 'Experience Level', filterName: 'level' },
];

/**
 * Creates the marquee for the playlist browse page.
 * @param {HTMLElement} block
 */
function decoratePlaylistBrowseMarquee(block) {
  const [firstRow] = block.children;
  const [firstCell] = firstRow.children;

  const picture = createOptimizedPicture('/images/playlists-marquee-background.png', '');

  const marquee = htmlToElement(`
    <div class="playlist-browse-marquee">
        <div class="playlist-browse-marquee-background"></div>
        <div class="playlist-browse-marquee-content">
        <h1>${firstCell.innerHTML}</h1>
        </div>
    </div>`);

  marquee.querySelector('.playlist-browse-marquee-background').append(picture);

  firstCell.remove();
  block.parentElement.before(marquee);
}

/**
 * get all possible values for a filter from the playlists
 * @param {string} filterName
 * @returns {string[]}
 */
async function getAllPossibleFilterValues(filterName) {
  const playlists = await playlistsPromise;
  const solutions = playlists.data
    .map((p) => p[filterName])
    .map((s) => s.split(',').map((p) => p.trim()))
    .flat()
    .filter((s) => s !== '');
  return [...new Set(solutions)];
}

/**
 * @typedef {Object} PlaylistCard
 * @property {string} title
 * @property {string} description
 * @property {string} image
 * @property {string} path
 * @property {boolean} loading
 */

/**
 * Playlist Card UI
 * @param {PlaylistCard} cardOptions
 * @returns {HTMLElement}
 */
function newPlaylistCard({ title = '', description = '', image, path = '', loading = false }) {
  const picture = image ? createOptimizedPicture(image, title) : '';
  const truncatedDescription = description.length > 150 ? `${description.slice(0, 150)}...` : description;
  return htmlToElement(`
    <a class="playlist-browse-card ${loading ? 'playlist-browse-card-loading' : ''}" href="${path}">
        <div class="playlist-browse-card-image" ${loading ? 'data-placeholder' : ''}>
            ${picture?.outerHTML || ''}
        </div>
        <div class="playlist-browse-card-content">
            <h2 class="playlist-browse-card-title" ${loading ? 'data-placeholder' : ''}>${title}</h2>
            <p class="playlist-browse-card-description" ${loading ? 'data-placeholder' : ''}>
                ${truncatedDescription}
            </p>
        </div>
    </a>`);
}

/**
 * @typedef {Object} Playlist
 * @property {string} solution
 * @property {string} role
 * @property {string} level
 * @property {string} title
 * @property {string} description
 * @property {string} image
 * @property {string} path
 */

/**
 * @typedef {Object} Filters
 * @property {string[]} solution
 * @property {string[]} role
 * @property {string[]} level
 */

/**
 * Filter playlists based on the provided filters
 * @param {Playlist[]} playlists
 * @param {Filters} filters
 * @returns
 */
const filterPlaylists = (playlists, filters) => {
  const { solution, role, level } = filters.filters;
  return playlists.filter((playlist) => {
    const playlistSolutions = playlist.solution.split(',').map((s) => s.trim());
    const solutionMatch = !solution.length || solution.some((s) => playlistSolutions.includes(s));
    const playlistRoles = playlist.role.split(',').map((r) => r.trim());
    const roleMatch = !role.length || role.some((r) => playlistRoles.includes(r));
    const playlistLevel = playlist.level.split(',').map((l) => l.trim());
    const levelMatch = !level.length || level.some((l) => playlistLevel.includes(l));
    return solutionMatch && roleMatch && levelMatch;
  });
};

/**
 * @returns {Filters}
 */
function readFiltersFromUrl() {
  const url = new URL(window.location.href);
  const solution = url.searchParams.getAll('solution');
  const role = url.searchParams.getAll('role') || [];
  const level = url.searchParams.getAll('level') || [];
  return { solution, role, level } || [];
}

/**
 * @param {Filters} filters
 * @returns {void}
 */
function writeFiltersToUrl(filters) {
  const url = new URL(window.location.href);
  url.searchParams.delete('solution');
  url.searchParams.delete('role');
  url.searchParams.delete('level');
  filters.filters.solution.forEach((s) => url.searchParams.append('solution', s));
  filters.filters.role.forEach((r) => url.searchParams.append('role', r));
  filters.filters.level.forEach((l) => url.searchParams.append('level', l));
  window.history.pushState({}, '', url);
}

// Playlist Cards
const cards = htmlToElement('<div class="playlist-browse-cards"></div>');

let pagination;
// called when filters change
const updateCards = (filters) => {
  // set filter count to show on filter UI
  // const filterButton = filterWrapper.querySelector('.playlist-browse-filter-button');
  // const filterCount = Object.values(filters).flat().length;
  // if (filterCount) {
  //   filterButton.dataset.filterCount = filterCount;
  // } else {
  //   delete filterButton.dataset.filterCount;
  // }

  // add filter pills

  // const filterPills = filterWrapper.querySelectorAll('.filter-pill');
  // filterPills.forEach((pill) => pill.remove());
  // Object.entries(filters.filters).forEach(([filterName, filterValues]) => {
  //   filterValues.forEach((value) => {
  //     const pill = htmlToElement(`
  //     <button class="filter-pill" data-value="${value}"  data-filter="${filterName}">
  //       <span>${value}</span>
  //       <span class="icon icon-close"></span>
  //     </button>`);
  //     decorateIcons(pill);
  //     filterWrapper.append(pill);
  //     pill.addEventListener('click', (event) => {
  //       const { filter, value } = event.target.dataset;
  //       filters.filters[filter] = filters.filters[filter].filter((v) => v !== value);
  //       filters.onFilterChange();
  //     });
  //   });
  // });

  // reset pagination and cards
  if (pagination) {
    pagination.remove();
  }
  cards.innerHTML = '';

  // add loading cards
  for (let i = 0; i < 16; i += 1) {
    cards.append(newPlaylistCard({ loading: true }));
  }

  playlistsPromise.then((playlists) => {
    // store filters when switching pages
    writeFiltersToUrl(filters);

    // add filtered cards and pagination for them.
    const filteredPlaylists = filterPlaylists(playlists.data, filters);
    const onPageChange = (page, ps) => {
      cards.innerHTML = '';
      ps.forEach((playlist) => cards.append(newPlaylistCard(playlist)));
      window.scrollTo({ top: 0 });
    };

    pagination = newPagination({
      previousLabel: 'Previous',
      previousClass: 'playlist-browse-pagination-previous button secondary',
      nextLabel: 'Next',
      nextClass: 'playlist-browse-pagination-next button secondary',
      paginationLabelClass: 'playlist-browse-pagination-label',
      ofLabel: 'of',
      currentPage: 1,
      items: filteredPlaylists,
      onPageChange,
    });

    pagination.classList.add('playlist-browse-pagination');
    cards.after(pagination);
  });
};

/**
 * @typedef {Object} Filter Option
 * @property {string} value
 * @property {string} label
 * @property {string} selected
 */

/**
 * @typedef {Object} Filter
 * @property {string} name
 * @property {string} label
 * @property {Array.<Filter>} options
 */

class Filter {
  constructor({ filters, onFilterChange, onClearAll, labels: { clearAll, filter }, filterWrapper }) {
    this.filters = filters;
    this.onFilterChange = onFilterChange;
    this.onClearAll = onClearAll;
    this.labels = { clearAll, filter };
    this.filterWrapper = filterWrapper;
    this.updateUI();
  }

  updateUI = () => {
    this.filters = readFiltersFromUrl();
    filterOptions.forEach(({ legend, filterName }) => {
      const panelContent = htmlToElement(`<div></div>`);
      // load filter options
      const filterPanel = newShowHidePanel({
        buttonLabel: createPlaceholderSpan(filterName, legend),
        buttonClass: 'playlist-browse-filter-button',
        hiddenPanelClass: 'playlist-browse-filter-hidden',
        panelContent,
        panelClass: 'playlist-browse-filter-panel',
        expanded: false,
      });
      filterPanel.classList.add('playlist-browse-filter');

      const { fieldset, addOption } = newMultiSelect({
        legend,
        onSelect: (selectedValues) => {
          this.filters[filterName] = selectedValues;
          this.onFilterChange();
        },
      });
      this.filterWrapper.append(filterPanel);

      getAllPossibleFilterValues(filterName).then((filterValues) => {
        filterValues.forEach((filterValue) => {
          addOption({
            label: filterValue,
            value: filterValue,
            checked: this.filters[filterName].includes(filterValue),
          });
        });
        panelContent.append(fieldset);
      });
    });
  };
}

/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  decoratePlaylistBrowseMarquee(block);

  const filterWrapper = htmlToElement('<div class="playlist-browse-cards"></div>');
  const filters = new Filter({
    filters: {},
    onFilterChange: () => updateCards(filters),
    onClearAll: () => {
      this.filters = {};
    },
    labels: {
      clearAll: 'Clear All',
      filter: 'Filter',
    },
    filterWrapper,
  });

  block.append(filterWrapper);
  block.append(htmlToElement('<br style="clear:both" />'));
  block.append(cards);
  updateCards(filters);
}
