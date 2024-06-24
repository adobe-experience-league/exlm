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

async function toFlatDedupedArray(prop) {
  const playlists = await playlistsPromise;
  const solutions = playlists.data
    .map((p) => p[prop])
    .map((s) => s.split(',').map((p) => p.trim()))
    .flat()
    .filter((s) => s !== '');
  return [...new Set(solutions)];
}

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

function readFiltersFromUrl() {
  const url = new URL(window.location.href);
  const solution = url.searchParams.getAll('solution');
  const role = url.searchParams.getAll('role') || [];
  const level = url.searchParams.getAll('level') || [];
  return { solution, role, level } || [];
}

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

  const panelContent = htmlToElement('<div></div>');
  const cards = htmlToElement('<div class="playlist-browse-cards"></div>');

  const filters = readFiltersFromUrl();

  let pagination;
  const update = () => {
    if (pagination) {
      pagination.remove();
    }
    cards.innerHTML = '';

    // array with 16 elements as placeholders
    for (let i = 0; i < 16; i += 1) {
      cards.append(newPlaylistCard({ loading: true }));
    }

    playlistsPromise.then((playlists) => {
      writeFiltersToUrl(filters);
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

  const { fieldset: productFieldset, addOption: addProductOption } = newMultiSelect({
    legend: 'Products',
    onSelect: (selectedValues) => {
      filters.solution = selectedValues;
      update();
    },
  });
  panelContent.append(productFieldset);
  toFlatDedupedArray('solution').then((solutions) => {
    solutions.forEach((solution) => {
      addProductOption({ label: solution, value: solution, checked: filters.solution.includes(solution) });
    });
  });

  const { fieldset: roleFieldset, addOption: addRoleOption } = newMultiSelect({
    legend: 'Roles',
    onSelect: (selectedValues) => {
      filters.role = selectedValues;
      update();
    },
  });
  panelContent.append(roleFieldset);
  toFlatDedupedArray('role').then((roles) => {
    roles.forEach((role) => {
      addRoleOption({ label: role, value: role, checked: filters.role.includes(role) });
    });
  });

  const { fieldset: levelFieldset, addOption: addLevelOption } = newMultiSelect({
    legend: 'Experience Level',
    onSelect: (selectedValues) => {
      filters.level = selectedValues;
      update();
    },
  });
  panelContent.append(levelFieldset);
  toFlatDedupedArray('level').then((levels) => {
    levels.forEach((level) => {
      addLevelOption({ label: level, value: level, checked: filters.level.includes(level) });
    });
  });

  const showHidePanel = newShowHidePanel({
    buttonLabel: 'Filter',
    buttonClass: 'playlist-browse-filter-button',
    hiddenPanelClass: 'playlist-browse-filter-hidden',
    panelContent,
    panelClass: 'playlist-browse-filter-panel',
    expanded: false,
  });
  showHidePanel.classList.add('playlist-browse-filter');

  block.append(showHidePanel);
  block.append(htmlToElement('<br style="clear:both" />'));
  block.append(cards);
  update();
}
