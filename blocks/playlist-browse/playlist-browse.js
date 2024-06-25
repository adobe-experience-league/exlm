import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { getPathDetails, htmlToElement } from '../../scripts/scripts.js';
import { newMultiSelect, newPagination, newShowHidePanel } from './dom-helpers.js';

async function fetchPlaylists() {
  const { lang } = getPathDetails();
  const resp = await fetch(`/${lang}/playlists.json`);
  return resp.json();
}

const playlistsPromise = fetchPlaylists();

/**
 * Creates the marquee for the playlist browse page.
 * @param {HTMLElement} block
 */
function decoratePlaylistBrowseMarquee(block) {
  const [firstRow] = block.children;
  const [firstCell] = firstRow.children;
  const [p, header, description] = firstCell.children;

  const marquee = htmlToElement(`
    <div class="playlist-browse-marquee">
        <div class="playlist-browse-marquee-background">${p.innerHTML}</div>
        <div class="playlist-browse-marquee-content">
        <h1>${header.outerHTML}</h1>
        <p>${description.outerHTML}</p>
        </div>
    </div>`);

  firstCell.remove();
  block.before(marquee);
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
  const { solution, role, level } = filters;
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
  filters.solution.forEach((s) => url.searchParams.append('solution', s));
  filters.role.forEach((r) => url.searchParams.append('role', r));
  filters.level.forEach((l) => url.searchParams.append('level', l));
  window.history.pushState({}, '', url);
}

/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  decoratePlaylistBrowseMarquee(block);

  // Filter
  const filters = readFiltersFromUrl();
  const filterPanelContet = htmlToElement('<div></div>');
  const filterPanel = newShowHidePanel({
    buttonLabel: 'Filter',
    buttonClass: 'playlist-browse-filter-button',
    hiddenPanelClass: 'playlist-browse-filter-hidden',
    panelContent: filterPanelContet,
    panelClass: 'playlist-browse-filter-panel',
    expanded: false,
  });
  filterPanel.classList.add('playlist-browse-filter');

  // Playlist Cards
  const cards = htmlToElement('<div class="playlist-browse-cards"></div>');

  let pagination;

  // called when filters change
  const updateCards = () => {
    // set filter count to show on filter UI
    const filterButton = filterPanel.querySelector('.playlist-browse-filter-button');
    const filterCount = Object.values(filters).flat().length;
    if (filterCount) {
      filterButton.dataset.filterCount = filterCount;
    } else {
      delete filterButton.dataset.filterCount;
    }

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
      // store filters
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

  // load filter options
  [
    { legend: 'Products', filterName: 'solution' },
    { legend: 'Roles', filterName: 'role' },
    { legend: 'Experience Level', filterName: 'level' },
  ].forEach(({ legend, filterName }) => {
    const { fieldset, addOption } = newMultiSelect({
      legend,
      onSelect: (selectedValues) => {
        filters[filterName] = selectedValues;
        updateCards();
      },
    });

    filterPanelContet.append(fieldset);
    getAllPossibleFilterValues(filterName).then((filterValues) => {
      filterValues.forEach((filterValue) => {
        addOption({ label: filterValue, value: filterValue, checked: filters[filterName].includes(filterValue) });
      });
    });
  });

  block.append(filterPanel);
  block.append(htmlToElement('<br style="clear:both" />'));
  block.append(cards);
  updateCards();
}
