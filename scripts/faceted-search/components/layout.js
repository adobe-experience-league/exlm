import { createTag } from '../../scripts.js';
import { decorateIcons } from '../../lib-franklin.js';

export default function createSidebarLayout({
  ui,
  prefix = 'fs',
  collapsibleOnMobile = true,
  cardColumns = true, // false: don't apply the 3-per-row card grid (blocks with their own results layout)
}) {
  const layout = createTag('div', {
    class: `${prefix}-layout${cardColumns ? ` ${prefix}-layout-cards` : ''}`,
  });
  const aside = createTag('aside', { class: `${prefix}-filters-column` });
  const panelId = `${prefix}-filters-panel-${crypto.randomUUID()}`;
  const panel = createTag('div', { class: `${prefix}-filters-panel`, id: panelId });
  panel.append(ui.filtersEl);

  if (collapsibleOnMobile) {
    // On narrow screens the panel is collapsed behind this button (CSS hides the button on desktop).
    const toggle = createTag('button', {
      class: `${prefix}-mobile-filter-toggle`,
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': panelId,
    });
    const toggleLabel = createTag('span', { class: `${prefix}-mobile-filter-toggle-label` });
    toggleLabel.textContent = ui.filtersEl.querySelector(`.${prefix}-filters-heading`)?.textContent || 'Filters';
    toggle.append(
      createTag('span', { class: 'icon icon-atomic-search-filter' }),
      toggleLabel,
      createTag('span', { class: `${prefix}-mobile-filter-toggle-count` }),
      createTag('span', { class: 'icon icon-chevron' }),
    );
    decorateIcons(toggle);
    const countBadge = toggle.querySelector(`.${prefix}-mobile-filter-toggle-count`);

    const setOpen = (open) => {
      layout.classList.toggle('is-filters-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!layout.classList.contains('is-filters-open')));
    layout.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Escape' || !layout.classList.contains('is-filters-open')) return;
        setOpen(false);
        toggle.focus();
      },
      true,
    );

    // show how many filters are active, so it's visible while the panel is collapsed
    ui.onRefresh(() => {
      const n = ui.store.get().tags.length;
      countBadge.textContent = n ? `(${n})` : '';
    });
    aside.append(toggle);
  }

  aside.append(panel);
  const results = createTag('section', { class: `${prefix}-results-column` });
  // toolbar: results count on the left, `controls` (sort, view switcher, ...) on the right
  const toolbar = createTag('div', { class: `${prefix}-toolbar` });
  const controls = createTag('div', { class: `${prefix}-toolbar-controls` });
  toolbar.append(ui.countEl, controls);
  results.append(...[ui.keywordEl, ui.activeEl, toolbar].filter(Boolean));
  layout.append(aside, results);
  return { layout, results, toolbar, controls };
}
