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
import { pushComponentClick, generateComponentID } from '../../scripts/analytics/lib-analytics.js';

function buildAssociatedContentCard(item, championName, colorClass, placeholders, glassyEffect) {
  const card = document.createElement('div');
  card.classList.add('champion-content', 'block');
  if (colorClass) card.classList.add(`champion-content-${colorClass}`);
  if (glassyEffect) card.classList.add('glass-bg');
  card.innerHTML = renderChampionContentHTML(item, championName, placeholders);
  return card;
}

function buildAdvocatePanel(champion, total, placeholders, glassyEffect) {
  const { detail, associatedContent } = champion;
  const colorClass = getDesignationColor(detail.colorSelection);

  const panel = document.createElement('div');
  panel.classList.add('champion-detail', 'block', 'featured-advocates-panel');

  panel.innerHTML = renderChampionDetailProfileHTML(detail, colorClass, {
    paginationHTML: total > 1 ? renderPaginationHTML(`1/${total}`, 'advocate') : '',
    loading: 'lazy',
  });

  const cards = associatedContent.map((item) =>
    buildAssociatedContentCard(item, detail.name, colorClass, placeholders, glassyEffect),
  );
  appendMoreFromSection(panel, detail.name, cards, placeholders);

  return panel;
}

export default async function decorate(block) {
  // read authoring fields before clearing — this block is otherwise zero-config and
  // rebuilt entirely from fetched champion data, so glassyEffect must be the last field.
  const glassyEffect = block.children[block.children.length - 1]?.textContent.trim() === 'true';
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
    const panel = buildAdvocatePanel(champion, total, placeholders, glassyEffect);
    if (i === 0) panel.classList.add('active');
    panelContainer.append(panel);
  });

  if (total > 1) {
    panelContainer.addEventListener('click', (event) => {
      if (!event.target.closest('.champion-detail-prev, .champion-detail-next')) return;

      const isPrev = !!event.target.closest('.champion-detail-prev');
      const targetIndex = (currentIndex + (isPrev ? -1 : 1) + total) % total;

      pushComponentClick({
        component: 'Featured advocates carousel arrow',
        componentID: generateComponentID(block, 'featured-advocates'),
        sectionID: block.closest('.section')?.dataset?.sectionId || '',
        linkTitle: 'carousel arrow',
        linkType: 'carousel',
        position: targetIndex + 1,
      });

      goTo(targetIndex);
    });
  }

  block.append(panelContainer);

  decorateIcons(block);
}
