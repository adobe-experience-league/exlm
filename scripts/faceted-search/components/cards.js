import { loadCSS } from '../../lib-franklin.js';
import { createTag } from '../../scripts.js';
import BrowseCardShimmer from '../../browse-card/browse-card-shimmer.js';
import isFeatureEnabled from '../../utils/feature-flag-utils.js';
import { groupUpcomingThenOnDemand, shouldGroupEvents } from './sort-control.js';

export function createResults({ prefix = 'fs', labels = {}, createLoading, onClear, classes = {} }) {
  const body = createTag('div', { class: `${prefix}-results-body ${classes.body || ''}`.trim() });
  const empty = createTag('div', { class: `${prefix}-no-results`, hidden: '', role: 'status', 'aria-live': 'polite' });
  const grid = createTag('div', { class: `${prefix}-results-grid ${classes.grid || ''}`.trim() });
  const error = createTag('div', { class: 'fs-search-error', hidden: '', role: 'alert' });
  const loading = createLoading?.();
  let isLoading = false;
  body.append(empty, grid, error);
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
      const message = createTag('p', { class: `${prefix}-no-results-message` });
      if (keyword) {
        const term = createTag('strong');
        term.textContent = `"${keyword}"`;
        message.append(`${labels.noResultsPrefix || 'Sorry, no results were found for'} `, term);
      } else {
        message.textContent = labels.noResults || 'Sorry, no results were found.';
      }
      const clear = createTag('a', { href: '#', class: `${prefix}-no-results-clear` });
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

export function createCardLoading(pageSize) {
  return new BrowseCardShimmer(Number.isFinite(pageSize) ? pageSize : undefined);
}

export async function loadCardStyles({ type }) {
  if (type !== 'events') return;
  await Promise.all([
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-upcoming-events.css`),
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-on-demand-events.css`),
  ]);
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

export async function createCardView({ block, body, controls, prefix, type, viewSwitcher }) {
  let view;
  if (viewSwitcher) {
    const { default: BrowseCardViewSwitcher } = await import('../../browse-card/browse-cards-view-switcher.js');
    const container = createTag('div', { class: `${prefix}-view-switcher` });
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
    viewLink: path ? new URL(path, window.location.origin).href : '',
    copyLink: path ? new URL(path, window.location.origin).href : '',
    viewLinkText: placeholders.browseCardPlaylistViewLabel || 'View playlist',
  };
  await buildCard(wrapper, model, { trackCoveoClick: false });
  Object.assign(model, { title, description: summary, product });
  wrapper.querySelectorAll('.browse-card-figure img').forEach((img) => {
    img.alt = title;
  });
}

export async function renderCards(items, prefix, renderItem, context = {}) {
  const paint = renderItem || (await import('../../browse-card/browse-card.js')).buildCard;
  const fragment = document.createDocumentFragment();
  await Promise.all(
    items.map(async (item, index) => {
      const wrapper = createTag('div', { class: `${prefix}-card-item` });
      fragment.append(wrapper);
      await paint(wrapper, item, index, context);
    }),
  );
  return fragment;
}
