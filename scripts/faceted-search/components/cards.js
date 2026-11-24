import { loadCSS } from '../../lib-franklin.js';
import { createTag, htmlToElement } from '../../scripts.js';
import BrowseCardShimmer from '../../browse-card/browse-card-shimmer.js';
import isFeatureEnabled from '../../utils/feature-flag-utils.js';
import { groupUpcomingThenOnDemand, shouldGroupEvents } from './sort-control.js';
import { filterCourseCardsByStatus } from './filters.js';

export function createResults({ resultsPrefix = 'fs', labels = {}, createLoading, onClear, classes = {} }) {
  const body = htmlToElement(`
    <div class="fs-results-body">
      <div class="fs-no-results" hidden role="status" aria-live="polite"></div>
      <div class="fs-results-grid"></div>
      <div class="fs-search-error" hidden role="alert"></div>
    </div>`);
  const empty = body.querySelector('.fs-no-results');
  const grid = body.querySelector('.fs-results-grid');
  const error = body.querySelector('.fs-search-error');
  body.classList.add(`${resultsPrefix}-results-body`);
  empty.classList.add(`${resultsPrefix}-no-results`);
  grid.classList.add(`${resultsPrefix}-results-grid`);
  if (classes.body) body.classList.add(...classes.body.split(/\s+/).filter(Boolean));
  if (classes.grid) grid.classList.add(...classes.grid.split(/\s+/).filter(Boolean));
  const loading = createLoading?.();
  let isLoading = false;
  return {
    body,
    grid,
    setLoading(value) {
      if (isLoading === value) return;
      isLoading = value;
      body.setAttribute('aria-busy', String(value));
      grid.style.display = value ? 'none' : '';
      if (value) {
        empty.hidden = true;
        error.hidden = true;
        loading?.addShimmer(body);
        const shimmer = body.querySelector(':scope > .browse-card-shimmer');
        if (shimmer) body.insertBefore(shimmer, grid);
      } else {
        loading?.removeShimmer();
      }
    },
    showEmpty(keyword) {
      empty.replaceChildren();
      const message = createTag('p', { class: `fs-no-results-message ${resultsPrefix}-no-results-message` });
      if (keyword) {
        const term = createTag('strong');
        term.textContent = `"${keyword}"`;
        message.append(`${labels.noResultsPrefix || 'Sorry, no results were found for'} `, term);
      } else {
        message.textContent = labels.noResults || 'Sorry, no results were found.';
      }
      const clear = createTag('a', { href: '#', class: `fs-no-results-clear ${resultsPrefix}-no-results-clear` });
      clear.textContent = labels.clearSearch || 'Clear search';
      clear.addEventListener('click', (e) => {
        e.preventDefault();
        onClear();
      });
      empty.append(message, clear);
      empty.hidden = isLoading;
      grid.hidden = true;
    },
    showItems(fragment) {
      grid.replaceChildren(fragment);
      grid.hidden = false;
      empty.hidden = true;
      error.hidden = true;
      if (classes.grid) grid.classList.add(...classes.grid.split(' '));
    },
    hideEmpty() {
      empty.hidden = true;
      grid.hidden = false;
    },
    showError() {
      this.setLoading(false);
      empty.hidden = true;
      grid.hidden = true;
      error.textContent = labels.error || 'Search could not be loaded. Please try again.';
      error.hidden = false;
    },
    destroy() {
      loading?.removeShimmer();
    },
  };
}

export function createCardLoading(pageSize, contentType) {
  return new BrowseCardShimmer(Number.isFinite(pageSize) ? pageSize : undefined, contentType);
}

export async function prepareCardItems(results, state, { type, dataFormat = 'coveo' }, snapshot) {
  let cards = results;
  if (dataFormat === 'coveo') {
    const { default: adaptor } = await import('../../browse-card/browse-cards-coveo-data-adaptor.js');
    cards = await adaptor.mapResultsToCardsData(results, snapshot.responseId);
  } else if (dataFormat !== 'models') {
    throw new Error(`Unsupported card data format: ${dataFormat}`);
  }
  if (type !== 'events') return cards;
  const [{ normalizeUpcomingEventModel, normalizeOnDemandEventModel }, { CONTENT_TYPES }] = await Promise.all([
    import('../../browse-card/browse-cards-delegate.js'),
    import('../../data-service/coveo/coveo-exl-pipeline-constants.js'),
  ]);
  const normalized = cards.map((model) => normalizeOnDemandEventModel(normalizeUpcomingEventModel(model)));
  return shouldGroupEvents(state, CONTENT_TYPES) ? groupUpcomingThenOnDemand(normalized, CONTENT_TYPES) : normalized;
}

function hasModuleCount(card) {
  return card.el_course_module_count != null && card.el_course_module_count !== '';
}

async function enrichModuleCount(wrapper, card) {
  const [{ getCurrentCourseMeta }, { buildCard }] = await Promise.all([
    import('../../courses/course-utils.js'),
    import('../../browse-card/browse-card.js'),
  ]);
  const courseMeta = await getCurrentCourseMeta(card.viewLink);
  if (!wrapper.isConnected || !Array.isArray(courseMeta?.modules) || hasModuleCount(card)) return;

  // Cache the count on the model so later renders do not fetch metadata again.
  // eslint-disable-next-line no-param-reassign -- cache module count on the shared card object
  card.el_course_module_count = String(courseMeta.modules.length);
  const statusRow = wrapper.querySelector('.browse-card-status-row');
  if (!statusRow || statusRow.querySelector('.browse-card-module-count')) return;

  const scratch = createTag('div');
  await buildCard(scratch, card);
  if (!wrapper.isConnected) return;
  const moduleCount = scratch.querySelector('.browse-card-module-count');
  if (moduleCount && !statusRow.querySelector('.browse-card-module-count')) statusRow.append(moduleCount);
}

async function enrichWithCourseStatus(cards) {
  try {
    const [{ getCurrentCourses }, { default: BrowseCardsCourseEnricher }] = await Promise.all([
      import('../../courses/course-profile.js'),
      import('../../browse-card/browse-cards-course-enricher.js'),
    ]);
    return BrowseCardsCourseEnricher.enrichCardsWithCourseStatus(cards, await getCurrentCourses());
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('faceted-search course: course progress enrichment failed', error);
    return cards;
  }
}

export function createCourseCardHandlers({ signedIn, originLevel2, pageSize }) {
  let pendingModuleCounts = [];
  return {
    createLoading() {
      const shimmer = createCardLoading(pageSize, 'course');
      const addShimmer = shimmer.addShimmer.bind(shimmer);
      const removeShimmer = shimmer.removeShimmer.bind(shimmer);
      let host;
      shimmer.addShimmer = (target) => {
        host = target?.closest('.browse-courses');
        host?.classList.add('browse-courses-loading');
        return addShimmer(target);
      };
      shimmer.removeShimmer = () => {
        const result = removeShimmer();
        host?.classList.remove('browse-courses-loading');
        return result;
      };
      return shimmer;
    },
    async prepareItems(results, state, snapshot) {
      let cards = await prepareCardItems(results, state, { type: 'course' }, snapshot);
      cards = cards.map((card) => ({ ...card, originLevel2 }));
      if (signedIn) cards = await enrichWithCourseStatus(cards);
      return cards;
    },
    async renderItem(wrapper, card) {
      const { buildCard } = await import('../../browse-card/browse-card.js');
      await buildCard(wrapper, card);
      const status = card.meta?.courseInfo?.courseStatus;
      if (status) wrapper.setAttribute('data-course-status', status);
      if (!hasModuleCount(card) && card.viewLink) pendingModuleCounts.push({ wrapper, card });
    },
    afterRender() {
      const enrichments = pendingModuleCounts;
      pendingModuleCounts = [];
      enrichments.forEach(({ wrapper, card }) => {
        enrichModuleCount(wrapper, card).catch((error) => {
          // eslint-disable-next-line no-console
          console.warn('faceted-search course: module count enrichment failed', error);
        });
      });
    },
  };
}

export async function loadCardStyles({ type }) {
  if (type !== 'events') return;
  await Promise.all([
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-upcoming-events.css`),
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-on-demand-events.css`),
  ]);
}

export async function createCardView({ block, body, controls, resultsPrefix, type, viewSwitcher }) {
  let view;
  if (viewSwitcher) {
    const { default: BrowseCardViewSwitcher } = await import('../../browse-card/browse-cards-view-switcher.js');
    const container = createTag('div', { class: `fs-view-switcher ${resultsPrefix}-view-switcher` });
    controls.prepend(container);
    view = await BrowseCardViewSwitcher.create({ block: body });
    view.appendTo(container);
  }
  return {
    afterRender() {
      if (
        type === 'events' &&
        isFeatureEnabled('isEventsV2') &&
        body.querySelector('.upcoming-event-card, .event-upcoming-event-card')
      ) {
        block.classList.add('events-v2');
      }
      if (body.classList.contains('list')) view?.enhanceCardsForListView();
    },
    destroy: () => view?.destroy(),
  };
}

/** Compose signed-in course controls with the shared card view and empty state. */
export function createCourseStatusView(placeholders) {
  const selectedStatuses = new Set();
  return async (viewOptions) => {
    const { controls, store, results, ui, labels } = viewOptions;
    const [{ default: Dropdown }, { COURSE_STATUS }] = await Promise.all([
      import('../../dropdown/dropdown.js'),
      import('../../browse-card/browse-cards-constants.js'),
    ]);
    const cardView = await createCardView(viewOptions);
    const label = placeholders.filterCourseStatusLabel || 'Status';
    const container = createTag('div', { class: 'browse-courses-status' });
    controls.prepend(container);

    let dropdown = null;
    let optionsKey = '';
    let coveoTotal = null;
    const items = () => [...results.grid.querySelectorAll('.browse-courses-card-item')];

    function applyStatus() {
      const cardsInGrid = items();
      const visible = new Set(filterCourseCardsByStatus(cardsInGrid, selectedStatuses));
      cardsInGrid.forEach((card) => {
        card.hidden = !visible.has(card);
      });
      if (cardsInGrid.length) {
        if (visible.size) results.hideEmpty();
        else results.showEmpty(store.get().keyword);
      }
      ui.setAdditionalFiltersActive(selectedStatuses.size > 0);
      if (coveoTotal != null) {
        ui.setResultCount(selectedStatuses.size ? visible.size : coveoTotal, labels.resultsSuffix);
      }
    }

    function resetStatus() {
      selectedStatuses.clear();
      dropdown?.reset();
      applyStatus();
    }

    function syncOptions() {
      const present = new Set(
        items()
          .map((card) => card.dataset.courseStatus)
          .filter(Boolean),
      );
      const all = [
        { value: COURSE_STATUS.NOT_STARTED, title: placeholders.courseStatusNotStarted || 'Not Started' },
        { value: COURSE_STATUS.IN_PROGRESS, title: placeholders.courseStatusInProgress || 'In Progress' },
        { value: COURSE_STATUS.COMPLETED, title: placeholders.courseStatusCompleted || 'Completed' },
      ];
      const options = all.filter(({ value }) => present.has(value));
      [...selectedStatuses].forEach((value) => {
        if (!present.has(value)) selectedStatuses.delete(value);
      });
      const key = options.map(({ value }) => value).join();
      if (key === optionsKey) return;
      optionsKey = key;
      dropdown?.remove();
      dropdown = null;
      if (!options.length) return;
      dropdown = new Dropdown(container, label, options, 'multi-select', 'status-dropdown');
      dropdown.updateDropdownValues(Object.fromEntries([...selectedStatuses].map((value) => [value, true])));
      dropdown.handleOnChange((selected) => {
        selectedStatuses.clear();
        String(selected || '')
          .split(',')
          .filter(Boolean)
          .forEach((value) => selectedStatuses.add(value));
        applyStatus();
      });
    }

    const unsubscribe = store.subscribe((_state, action) => {
      if (action === 'clear') resetStatus();
    });
    return {
      afterRender({ snapshot } = {}) {
        cardView.afterRender?.({ snapshot });
        if (typeof snapshot?.total === 'number') coveoTotal = snapshot.total;
        syncOptions();
        applyStatus();
      },
      destroy() {
        unsubscribe();
        dropdown?.remove();
        container.remove();
        cardView.destroy?.();
      },
    };
  };
}

export async function renderPlaylistCard(wrapper, item, placeholders = {}) {
  const [{ buildCard }, { CONTENT_TYPES }] = await Promise.all([
    import('../../browse-card/browse-card.js'),
    import('../../data-service/coveo/coveo-exl-pipeline-constants.js'),
  ]);
  const { title = '', description = '', image = '', path = '', solution = '', role = '', id = '' } = item;
  const summary = description.length > 150 ? `${description.slice(0, 150)}...` : description;
  const product = solution
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const text = document.createElement('span');
  const encodeText = (value) => {
    text.textContent = value;
    return text.innerHTML;
  };
  const linkBase = window.location.origin === 'null' ? window.hlx.codeBasePath : window.location.origin;
  // The shared renderer accepts HTML; collection fields must remain plain text.
  const model = {
    id,
    contentType: CONTENT_TYPES.PLAYLIST.MAPPING_KEY,
    badgeTitle: CONTENT_TYPES.PLAYLIST.LABEL,
    title: encodeText(title),
    description: encodeText(summary),
    thumbnail: image,
    product: product.map(encodeText),
    tags: [{ icon: 'user', text: role }],
    viewLink: path ? new URL(path, linkBase).href : '',
    copyLink: path ? new URL(path, linkBase).href : '',
    viewLinkText: placeholders.browseCardPlaylistViewLabel || 'View playlist',
  };
  await buildCard(wrapper, model, { trackCoveoClick: false });
  Object.assign(model, { title, description: summary, product });
  wrapper.querySelectorAll('.browse-card-figure img').forEach((img) => {
    img.alt = title;
  });
}

export async function renderCards(items, resultsPrefix, renderItem, context = {}) {
  const paint = renderItem || (await import('../../browse-card/browse-card.js')).buildCard;
  const fragment = document.createDocumentFragment();
  await Promise.all(
    items.map(async (item, index) => {
      const wrapper = createTag('div', { class: `fs-card-item ${resultsPrefix}-card-item` });
      fragment.append(wrapper);
      await paint(wrapper, item, index, context);
    }),
  );
  return fragment;
}
