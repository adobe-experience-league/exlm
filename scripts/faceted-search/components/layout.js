import { createTag, htmlToElement } from '../../scripts.js';
import { decorateIcons } from '../../lib-franklin.js';

export default function createSidebarLayout({
  ui,
  heading = '',
  headingType = 'h2',
  collapsibleOnMobile = true,
  withFilters = true,
  cardColumns = true, // Retain the variant class for existing custom layouts.
}) {
  const layout = htmlToElement(`
    <div class="fs-layout">
      <div class="fs-filters-column">
        <div class="fs-filters-panel"></div>
      </div>
      <div class="fs-results-column">
        <div class="fs-toolbar">
          <div class="fs-toolbar-controls"></div>
        </div>
      </div>
    </div>`);
  layout.classList.toggle('fs-layout-cards', cardColumns);
  layout.classList.toggle('fs-layout-no-filters', !withFilters);
  const filtersColumn = layout.querySelector('.fs-filters-column');
  const panelId = `fs-filters-panel-${crypto.randomUUID()}`;
  const panel = layout.querySelector('.fs-filters-panel');
  panel.id = panelId;
  panel.append(ui.filtersEl);

  if (withFilters && collapsibleOnMobile) {
    // On narrow screens the panel is collapsed behind this button (CSS hides the button on desktop).
    const toggle = htmlToElement(`
      <button class="fs-mobile-filter-toggle" type="button" aria-expanded="false">
        <span class="icon icon-atomic-search-filter"></span>
        <span class="icon icon-chevron"></span>
      </button>`);
    toggle.setAttribute('aria-label', ui.filtersEl.querySelector('.fs-filters-heading')?.textContent || 'Filters');
    toggle.setAttribute('aria-controls', panelId);
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

    filtersColumn.prepend(toggle);
  }

  const results = layout.querySelector('.fs-results-column');
  if (heading) {
    const title = createTag(/^h[2-6]$/.test(headingType) ? headingType : 'h2', {
      class: 'fs-heading',
    });
    title.textContent = heading;
    results.prepend(title);
  }
  // toolbar: results count on the left, `controls` (sort, view switcher, ...) on the right
  const toolbar = layout.querySelector('.fs-toolbar');
  const controls = layout.querySelector('.fs-toolbar-controls');
  toolbar.prepend(ui.countEl);
  [ui.keywordEl, ui.activeEl].filter(Boolean).forEach((element) => results.insertBefore(element, toolbar));
  if (!withFilters) filtersColumn.remove();
  return { layout, results, toolbar, controls };
}
