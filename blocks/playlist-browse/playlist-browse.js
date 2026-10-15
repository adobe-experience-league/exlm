import { createOptimizedPicture, loadCSS } from '../../scripts/lib-franklin.js';
import {
  createPlaceholderSpan,
  decoratePlaceholders,
  getPathDetails,
  htmlToElement,
  fetchWithFallback,
  fetchLanguagePlaceholders,
  xssSanitizeQueryParamValue,
} from '../../scripts/scripts.js';
import { newPagination } from './dom-helpers.js';
import { pushBrowseCardClickEvent } from '../../scripts/analytics/lib-analytics.js';
import {
  createFilterStore,
  createSearchFilterUI,
  createSidebarLayout,
  readFiltersFromUrl,
  readKeywordFromUrl,
  bindFiltersToUrl,
  createStoreSort,
  getDefaultSortOptions,
  sortItems,
} from '../../scripts/search-filter/search-filter.js';

const EXPERIENCE_LEVEL_PLACEHOLDERS = [
  {
    label: 'Beginner',
    placeholder: 'filterExpLevelBeginnerTitle',
    description: 'filterExpLevelBeginnerDescription',
  },
  {
    label: 'Intermediate',
    placeholder: 'filterExpLevelIntermediateTitle',
    description: 'filterExpLevelIntermediateDescription',
  },
  {
    label: 'Experienced',
    placeholder: 'filterExpLevelExperiencedTitle',
    description: 'filterExpLevelExperiencedDescription',
  },
];

const ROLE_PLACEHOLDERS = [
  {
    label: 'Developer',
    placeholder: 'filterRoleDeveloperTitle',
    description: 'filterRoleDeveloperDescription',
  },
  {
    label: 'User',
    placeholder: 'filterRoleUserTitle',
    description: 'filterRoleUserDescription',
  },
  {
    label: 'Leader',
    placeholder: 'filterRoleLeaderTitle',
    description: 'filterRoleLeaderDescription',
  },
  {
    label: 'Admin',
    placeholder: 'filterRoleAdminTitle',
    description: 'filterRoleAdminDescription',
  },
];

const PLACEHOLDERS = {
  previous: 'playlistPreviousLabel',
  next: 'playlistNextLabel',
  of: 'playlistOfLabel',
};

async function fetchPlaylists() {
  const { lang } = getPathDetails();
  const path = `${window.hlx.codeBasePath}/${lang}/playlists.json`;
  const fallback = `${window.hlx.codeBasePath}/en/playlists.json`;
  const resp = await fetchWithFallback(path, fallback);
  return resp.json();
}

const sortAlphanumerically = (a, b) => a.localeCompare(b);

const playlistsPromise = fetchPlaylists();

// filterName doubles as the filter group id and the playlists.json column name
const filterOptions = [
  { legend: 'Product', filterName: 'solution', placeholderKey: 'filterProductLabel', sort: sortAlphanumerically },
  {
    legend: 'Role',
    filterName: 'role',
    placeholderKey: 'filterRoleLabel',
    optionPlaceholders: ROLE_PLACEHOLDERS,
    sort: sortAlphanumerically,
  },
  {
    legend: 'Experience Level',
    filterName: 'level',
    placeholderKey: 'filterExperienceLevelLabel',
    optionPlaceholders: EXPERIENCE_LEVEL_PLACEHOLDERS,
    sort: (a, b) => {
      const levels = ['Beginner', 'Intermediate', 'Experienced'];
      return levels.indexOf(a) - levels.indexOf(b);
    },
  },
];
const GROUP_IDS = filterOptions.map((f) => f.filterName);

/**
 * get all possible values for a filter from the playlists
 * @param {string} filterName
 * @returns {Promise<string[]>}
 */
async function getAllPossibleFilterValues(filterName) {
  const playlists = await playlistsPromise;
  const values = playlists.data
    .map((p) => p[filterName] || '')
    .map((s) => s.split(',').map((p) => p.trim()))
    .flat()
    .filter((s) => s !== '');
  return [...new Set(values)];
}

/**
 * Playlist Card UI
 * @param {{title?: string, description?: string, image?: string, path?: string, loading?: boolean}} cardOptions
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
 * Filter playlists based on the selected values ({ solution, role, level })
 */
const filterPlaylists = (playlists, { solution = [], role = [], level = [], keyword = '' }) => {
  const matches = (playlist, field, selected) => {
    if (!selected.length) return true;
    const values = (playlist[field] || '').split(',').map((v) => v.trim());
    return selected.some((s) => values.includes(s));
  };
  // case-insensitive, every word must appear in the title, description or product
  const terms = String(keyword).toLowerCase().split(/\s+/).filter(Boolean);
  const matchesKeyword = (playlist) => {
    if (!terms.length) return true;
    const haystack = `${playlist.title || ''} ${playlist.description || ''} ${playlist.solution || ''}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  };
  return playlists.filter(
    (playlist) =>
      matches(playlist, 'solution', solution) &&
      matches(playlist, 'role', role) &&
      matches(playlist, 'level', level) &&
      matchesKeyword(playlist),
  );
};

// Playlist Cards
const cards = htmlToElement('<div class="playlist-browse-cards"></div>');
let pagination;
let renderId = 0;
// set in decorate(); receives the filtered total (or null while loading)
let onResultCount = () => {};

// called when filters change
const updateCards = (block, filters) => {
  renderId += 1;
  const currentRender = renderId;

  // reset pagination and cards
  if (pagination) {
    pagination.remove();
    pagination = null;
  }
  cards.innerHTML = '';
  block.querySelector('.playlist-no-results')?.remove();
  onResultCount(null);

  // add loading cards
  for (let i = 0; i < 16; i += 1) {
    cards.append(newPlaylistCard({ loading: true }));
  }

  playlistsPromise.then((playlists) => {
    // a newer filter change has started; ignore this stale render
    if (currentRender !== renderId) return;

    const filteredPlaylists = sortItems(filterPlaylists(playlists.data, filters), filters.sort);
    onResultCount(filteredPlaylists.length);

    // Show message if no playlists match
    if (filteredPlaylists.length === 0) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'playlist-no-results';
      errorMsg.append(
        createPlaceholderSpan(
          'noResultsTextBrowse',
          'We are sorry, no results found matching the criteria. Try adjusting your search to view more content.',
        ),
      );
      cards.innerHTML = '';
      cards.after(errorMsg);
      return;
    }

    const onPageChange = (page, ps) => {
      cards.innerHTML = '';
      ps.forEach((playlist, index) => {
        const cardElement = newPlaylistCard(playlist);
        cards.append(cardElement);

        const cardHeader = block.getAttribute('data-block-name') || 'playlist-browse';
        const cardPosition = String(index + 1);
        const product = playlist.solution ? playlist.solution.split(',').map((s) => s.trim()) : [];

        cardElement.addEventListener('click', () => {
          pushBrowseCardClickEvent(
            'browseCardClicked',
            {
              contentType: 'playlist',
              viewLink: playlist.path,
              title: playlist.title,
              product,
            },
            cardHeader,
            cardPosition,
          );
        });
      });
      window.scrollTo({ top: 0 });
    };

    pagination = newPagination({
      previousLabel: `<span data-placeholder="${PLACEHOLDERS.previous}">Previous</span>`,
      previousClass: 'playlist-browse-pagination-previous button secondary',
      nextLabel: `<span data-placeholder="${PLACEHOLDERS.next}">Next</span>`,
      nextClass: 'playlist-browse-pagination-next button secondary',
      paginationLabelClass: 'playlist-browse-pagination-label',
      ofLabel: `<span data-placeholder="${PLACEHOLDERS.of}">of</span>`,
      currentPage: 1,
      items: filteredPlaylists,
      onPageChange,
    });

    pagination.classList.add('playlist-browse-pagination');
    decoratePlaceholders(pagination);
    cards.after(pagination);
  });
};

/**
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', e);
  }
  loadCSS(`${window.hlx.codeBasePath}/scripts/search-filter/search-filter.css`).catch(() => {});

  const groups = [
    { id: 'solution', name: placeholders.filterProductLabel || 'Product' },
    { id: 'role', name: placeholders.filterRoleLabel || 'Role' },
    { id: 'level', name: placeholders.filterExperienceLevelLabel || 'Experience Level' },
  ];

  const sortOptions = getDefaultSortOptions(placeholders);
  const urlSort = readKeywordFromUrl('sort', xssSanitizeQueryParamValue);
  const store = createFilterStore({
    groupIds: GROUP_IDS,
    initial: {
      ...readFiltersFromUrl(GROUP_IDS, { format: 'repeat', sanitize: xssSanitizeQueryParamValue }),
      keyword: readKeywordFromUrl('q', xssSanitizeQueryParamValue),
      sort: sortOptions.some((option) => option.value === urlSort) ? urlSort : '',
    },
  });
  const ui = createSearchFilterUI({
    store,
    groups,
    placeholders: {
      filtersLabel: placeholders.filterLabel,
      filterClearLabel: placeholders.filterClearLabel,
      searchPlaceholder: placeholders.playlistSearchPlaceholder || 'Search playlists',
      clearSearchLabel: placeholders.playlistClearSearchLabel || 'Clear search',
    },
    withKeyword: true,
  });
  bindFiltersToUrl(store, GROUP_IDS, { format: 'repeat', keywordParam: 'q', sortParam: 'sort' });

  block.textContent = '';
  const { layout, results, controls } = createSidebarLayout({
    ui,
    placeholders: { filtersLabel: placeholders.filterLabel },
  });
  // sort is always visible
  const sort = createStoreSort({ store, ui, options: sortOptions, label: placeholders.sortLabel || 'Sort:' });
  controls.append(sort.el);
  results.append(cards);
  block.append(layout);

  // load options for each group from playlists.json
  await Promise.all(
    filterOptions.map(async ({ filterName, sort: sortFn, optionPlaceholders }) => {
      const values = (await getAllPossibleFilterValues(filterName)).sort(sortFn);
      ui.setGroupItems(
        filterName,
        values.map((value) => {
          const ph = optionPlaceholders?.find((o) => o.label.toLowerCase() === value.toLowerCase());
          return {
            value,
            title: (ph && placeholders[ph.placeholder]) || value,
            description: ph ? placeholders[ph.description] : undefined,
          };
        }),
      );
    }),
  );

  onResultCount = (count) =>
    ui.setResultCount(
      count,
      count === 1
        ? placeholders.playlistResultsCountSingular || 'playlist'
        : placeholders.playlistResultsCountSuffix || 'playlists',
    );

  store.subscribe(({ filters, keyword, sort: sortBy }) => updateCards(block, { ...filters, keyword, sort: sortBy }));
  const initial = store.get();
  ui.refresh(); // shows a keyword restored from the URL in the input
  updateCards(block, { ...initial.filters, keyword: initial.keyword, sort: initial.sort });
}
