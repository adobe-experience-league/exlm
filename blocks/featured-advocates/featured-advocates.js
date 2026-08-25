import { getPathDetails, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { getFeaturedChampions, getRotatedChampions, getDesignationColor } from '../../scripts/utils/champion-utils.js';
import {
  applyChampionSectionTheme,
  appendMoreFromSection,
  renderChampionDetailProfileHTML,
  renderPaginationHTML,
} from '../champion-detail/champion-detail.js';
import { renderChampionContentHTML } from '../champion-content/champion-content.js';

function buildAssociatedContentCard(item, championName, colorClass, placeholders) {
  const card = document.createElement('div');
  card.classList.add('champion-content', 'block');
  if (colorClass) card.classList.add(`champion-content-${colorClass}`);
  card.innerHTML = renderChampionContentHTML(item, championName, placeholders);
  return card;
}

function buildAdvocatePanel(champion, total, placeholders) {
  const { detail, associatedContent } = champion;
  const colorClass = getDesignationColor(detail.colorSelection);

  const panel = document.createElement('div');
  panel.classList.add('champion-detail', 'block', 'featured-advocates-panel');

  panel.innerHTML = renderChampionDetailProfileHTML(detail, colorClass, {
    paginationHTML: total > 1 ? renderPaginationHTML(`1/${total}`, 'advocate') : '',
    loading: 'lazy',
  });

  const cards = associatedContent.map((item) =>
    buildAssociatedContentCard(item, detail.name, colorClass, placeholders),
  );
  appendMoreFromSection(panel, detail.name, cards, placeholders);

  return panel;
}

export default async function decorate(block) {
  block.textContent = '';

  const { lang } = getPathDetails();
  const placeholders = await fetchLanguagePlaceholders(lang);
  let champions = [];
  try {
    champions = await getFeaturedChampions(lang);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching featured advocates:', error);
  }
  if (!champions.length) return;

  const orderedChampions = getRotatedChampions(champions);
  const total = orderedChampions.length;

  const panelContainer = document.createElement('div');
  panelContainer.classList.add('panel-container');

  // shared container class (used for the section's own padding), same as the standalone champion page
  applyChampionSectionTheme(block.closest('.section'));

  let currentIndex = 0;

  function goTo(index) {
    currentIndex = (index + total) % total;
    [...panelContainer.children].forEach((panel, i) => panel.classList.toggle('active', i === currentIndex));
    panelContainer.querySelectorAll('.champion-detail-pagination-count').forEach((el) => {
      el.textContent = `${currentIndex + 1}/${total}`;
    });
  }

  orderedChampions.forEach((champion, i) => {
    const panel = buildAdvocatePanel(champion, total, placeholders);
    if (i === 0) panel.classList.add('active');
    panelContainer.append(panel);
  });

  if (total > 1) {
    panelContainer.addEventListener('click', (event) => {
      if (event.target.closest('.champion-detail-prev')) goTo(currentIndex - 1);
      else if (event.target.closest('.champion-detail-next')) goTo(currentIndex + 1);
    });
  }

  block.append(panelContainer);

  decorateIcons(block);
}
