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

function newPlaylistCard({ title, description, image, path }) {
  const picture = createOptimizedPicture(image, title);
  return htmlToElement(`
      <a class="playlist-browse-card" href="${path}">
          <div class="playlist-browse-card-image">
              ${picture.outerHTML}
          </div>
          <div class="playlist-browse-card-content">
              <h3 class="playlist-browse-card-title">${title}</h3>
              <p class="playlist-browse-card-description">
                  ${description}
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

/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  decoratePlaylistBrowseMarquee(block);

  const panelContent = htmlToElement('<div></div>');
  const cards = htmlToElement('<div class="playlist-browse-cards"></div>');
  const filters = {
    solution: [],
    role: [],
    level: [],
  };
  let pagination;
  const update = () => {
    if (pagination) {
      pagination.remove();
    }
    cards.innerHTML = '';

    playlistsPromise.then((playlists) => {
      const filteredPlaylists = filterPlaylists(playlists.data, filters);
      const onPageChange = (page, ps) => {
        cards.innerHTML = '';
        ps.forEach((playlist) => cards.append(newPlaylistCard(playlist)));
      };

      pagination = newPagination({
        previousLabel: 'Previous',
        nextLabel: 'Next',
        ofLabel: 'of',
        currentPage: 1,
        items: filteredPlaylists,
        onPageChange,
      });

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
      addProductOption({ label: solution, value: solution, checked: false });
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
      addRoleOption({ label: role, value: role, checked: false });
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
      addLevelOption({ label: level, value: level, checked: false });
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
