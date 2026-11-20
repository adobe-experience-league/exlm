import { createTag } from '../../scripts.js';
import { decorateIcons } from '../../lib-franklin.js';

export default function createSidebarLayout({
  ui,
  prefix = 'fs',
  heading = '',
  collapsibleOnMobile = true,
  withFilters = true,
  cardColumns = true, // false: don't apply the 3-per-row card grid (blocks with their own results layout)
}) {
  const layout = createTag('div', {
    class: `${prefix}-layout${cardColumns ? ` ${prefix}-layout-cards` : ''}${
      withFilters ? '' : ` ${prefix}-layout-no-filters`
    }`,
  });
  const aside = createTag('aside', { class: `${prefix}-filters-column` });
  const panelId = `${prefix}-filters-panel-${crypto.randomUUID()}`;
  const panel = createTag('div', { class: `${prefix}-filters-panel`, id: panelId });
  panel.append(ui.filtersEl);

  if (withFilters && collapsibleOnMobile) {
    // On narrow screens the panel is collapsed behind this button (CSS hides the button on desktop).
    const toggle = createTag('button', {
      class: `${prefix}-mobile-filter-toggle`,
      type: 'button',
      'aria-label': ui.filtersEl.querySelector(`.${prefix}-filters-heading`)?.textContent || 'Filters',
      'aria-expanded': 'false',
      'aria-controls': panelId,
    });
    toggle.append(
      createTag('span', { class: 'icon icon-atomic-search-filter' }),
      createTag('span', { class: 'icon icon-chevron' }),
    );
    decorateIcons(toggle);

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

    aside.append(toggle);
  }

  aside.append(panel);
  const results = createTag('section', { class: `${prefix}-results-column` });
  if (heading) {
    const title = createTag('h2', { class: `${prefix}-heading` });
    title.textContent = heading;
    results.append(title);
  }
  // toolbar: results count on the left, `controls` (sort, view switcher, ...) on the right
  const toolbar = createTag('div', { class: `${prefix}-toolbar` });
  const controls = createTag('div', { class: `${prefix}-toolbar-controls` });
  toolbar.append(ui.countEl, controls);
  results.append(...[ui.keywordEl, ui.activeEl, toolbar].filter(Boolean));
  if (withFilters) layout.append(aside);
  layout.append(results);
  return { layout, results, toolbar, controls };
}
