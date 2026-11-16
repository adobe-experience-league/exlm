import { loadCSS } from '../../scripts/lib-franklin.js';
import { createTag } from '../../scripts/scripts.js';
import BrowseCardsCoveoDataAdaptor from '../../scripts/browse-card/browse-cards-coveo-data-adaptor.js';
import {
  normalizeOnDemandEventModel,
  normalizeUpcomingEventModel,
} from '../../scripts/browse-card/browse-cards-delegate.js';
import BrowseCardViewSwitcher from '../../scripts/browse-card/browse-cards-view-switcher.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import isFeatureEnabled from '../../scripts/utils/feature-flag-utils.js';
import { groupUpcomingThenOnDemand, shouldGroupEvents } from './events-search-sort.js';

export async function loadEventsCardStyles() {
  await Promise.all([
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-upcoming-events.css`),
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-on-demand-events.css`),
  ]);
}

export async function prepareEventItems(results, state) {
  const cards = await BrowseCardsCoveoDataAdaptor.mapResultsToCardsData(results);
  const normalized = cards.map((model) => {
    if (model.contentType?.toLowerCase() === CONTENT_TYPES.UPCOMING_EVENT_V2.MAPPING_KEY.toLowerCase()) {
      return normalizeUpcomingEventModel(model);
    }
    if (model.contentType?.toLowerCase() === CONTENT_TYPES.ON_DEMAND_EVENT.MAPPING_KEY.toLowerCase()) {
      return normalizeOnDemandEventModel(model);
    }
    return model;
  });
  return shouldGroupEvents(state) ? groupUpcomingThenOnDemand(normalized) : normalized;
}

export async function createEventView({ block, body, controls }) {
  const container = createTag('div', { class: 'events-search-view-switcher' });
  controls.prepend(container);
  const view = await BrowseCardViewSwitcher.create({ block: body });
  view.appendTo(container);
  return {
    afterRender() {
      if (isFeatureEnabled('isEventsV2') && body.querySelector('.upcoming-event-card, .event-upcoming-event-card')) {
        block.classList.add('events-v2');
      }
      if (body.classList.contains('list')) view.enhanceCardsForListView();
    },
    destroy: () => view.destroy(),
  };
}

export const renderEventItem = buildCard;
