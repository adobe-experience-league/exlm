import { loadCSS } from '../../lib-franklin.js';
import { createTag } from '../../scripts.js';
import BrowseCardViewSwitcher from '../../browse-card/browse-cards-view-switcher.js';
import BrowseCardShimmer from '../../browse-card/browse-card-shimmer.js';
import { buildCard } from '../../browse-card/browse-card.js';
import isFeatureEnabled from '../../utils/feature-flag-utils.js';

export function createCardLoading(pageSize) {
  return new BrowseCardShimmer(pageSize);
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
  const [
    { normalizeUpcomingEventModel, normalizeOnDemandEventModel },
    { groupUpcomingThenOnDemand, shouldGroupEvents },
  ] = await Promise.all([import('../../browse-card/browse-cards-delegate.js'), import('../policies/events.js')]);
  const normalized = cards.map((model) => normalizeOnDemandEventModel(normalizeUpcomingEventModel(model)));
  return shouldGroupEvents(state) ? groupUpcomingThenOnDemand(normalized) : normalized;
}

export async function createCardView({ block, body, controls, prefix, type, viewSwitcher }) {
  let view;
  if (viewSwitcher) {
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

export async function renderCards(items, prefix, renderItem = buildCard, context = {}) {
  const fragment = document.createDocumentFragment();
  await Promise.all(
    items.map(async (item, index) => {
      const wrapper = createTag('div', { class: `${prefix}-card-item` });
      fragment.append(wrapper);
      await renderItem(wrapper, item, index, context);
    }),
  );
  return fragment;
}
