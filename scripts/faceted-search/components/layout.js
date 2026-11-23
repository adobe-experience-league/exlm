import { createTag } from '../../scripts.js';
import { decorateIcons } from '../../lib-franklin.js';

export default function createSidebarLayout({
  ui,
  heading = '',
  headingType = 'h2',
  collapsibleOnMobile = true,
  withFilters = true,
  cardColumns = true, // Retain the variant class for existing custom layouts.
}) {
  const layout = createTag('div', {
    class: `fs-layout${cardColumns ? ' fs-layout-cards' : ''}${withFilters ? '' : ' fs-layout-no-filters'}`,
  });
  const filtersColumn = createTag('div', { class: 'fs-filters-column' });
  const panelId = `fs-filters-panel-${crypto.randomUUID()}`;
  const panel = createTag('div', { class: 'fs-filters-panel', id: panelId });
  panel.append(ui.filtersEl);

  if (withFilters && collapsibleOnMobile) {
    // On narrow screens the panel is collapsed behind this button (CSS hides the button on desktop).
    const toggle = createTag('button', {
      class: 'fs-mobile-filter-toggle',
      type: 'button',
      'aria-label': ui.filtersEl.querySelector('.fs-filters-heading')?.textContent || 'Filters',
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

    filtersColumn.append(toggle);
  }

  filtersColumn.append(panel);
  const results = createTag('div', { class: 'fs-results-column' });
  if (heading) {
    const title = createTag(/^h[2-6]$/.test(headingType) ? headingType : 'h2', {
      class: 'fs-heading',
    });
    title.textContent = heading;
    results.append(title);
  }
  // toolbar: results count on the left, `controls` (sort, view switcher, ...) on the right
  const toolbar = createTag('div', { class: 'fs-toolbar' });
  const controls = createTag('div', { class: 'fs-toolbar-controls' });
  toolbar.append(ui.countEl, controls);
  results.append(...[ui.keywordEl, ui.activeEl, toolbar].filter(Boolean));
  if (withFilters) layout.append(filtersColumn);
  layout.append(results);
  return { layout, results, toolbar, controls };
}
