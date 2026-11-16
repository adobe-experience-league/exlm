import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';

const UPCOMING = CONTENT_TYPES.UPCOMING_EVENT_V2.MAPPING_KEY;
const ON_DEMAND = CONTENT_TYPES.ON_DEMAND_EVENT.MAPPING_KEY;

export function readEventSort(criterion) {
  if (criterion === '@el_view_count descending') return 'popularity';
  if (criterion === 'date descending' || criterion === '@el_event_start_time ascending') return 'date';
  if (criterion === 'relevancy') return 'relevance';
  return null;
}

export function getEventSortContext({ filters, keyword }) {
  const types = filters.el_contenttype || [];
  const upcomingOnly = types.includes(UPCOMING) && !types.includes(ON_DEMAND);
  const onDemandOnly = types.includes(ON_DEMAND) && !types.includes(UPCOMING);
  return { upcomingOnly, onDemandOnly, mixed: !upcomingOnly && !onDemandOnly, hasQuery: Boolean(keyword) };
}

export function shouldGroupEvents(state) {
  const { mixed, hasQuery } = getEventSortContext(state);
  return mixed && (!hasQuery || state.sort === 'date');
}

export function groupUpcomingThenOnDemand(cards) {
  const isUpcoming = (card) => card.contentType?.toLowerCase() === UPCOMING.toLowerCase();
  const eventDate = (card) => new Date(card.event?.date ?? NaN);
  const upcoming = cards.filter(isUpcoming).sort((a, b) => eventDate(a) - eventDate(b));
  const onDemand = cards.filter((card) => !isUpcoming(card)).sort((a, b) => eventDate(b) - eventDate(a));
  return [...upcoming, ...onDemand];
}

export default function createEventSortPolicy(placeholders, hash = window.location.hash) {
  const criterion = new URLSearchParams(hash.slice(1)).get('sortCriteria');
  const initial = readEventSort(criterion) || 'relevance';
  const labels = {
    relevance: placeholders.filterSortRelevanceLabel || 'Relevance',
    date: placeholders.eventSearchFilterSortDateLabel || 'Date',
    popularity: placeholders.filterSortPopularityLabel || 'Popularity',
  };
  return {
    initial,
    default: 'relevance',
    resolve(state, action) {
      const { hasQuery, upcomingOnly, onDemandOnly, mixed } = getEventSortContext(state);
      const options = [];
      if (hasQuery || !mixed) {
        if (hasQuery) options.push('relevance');
        options.push('date');
        if (onDemandOnly) options.push('popularity');
      }
      let value = state.sort;
      if (!options.length) value = 'relevance';
      else if (action === 'keyword' && hasQuery) value = 'relevance';
      else if (!options.includes(value)) value = options.includes('date') ? 'date' : options[0];
      return {
        value,
        options: options.map((option) => ({ value: option, label: labels[option] })),
        key: `${value}:${upcomingOnly}:${onDemandOnly}`,
        criterion(criteria) {
          if (value === 'popularity') return criteria.field('el_view_count', 'descending');
          if (value === 'date' && upcomingOnly) return criteria.field('el_event_start_time', 'ascending');
          if (value === 'date' && onDemandOnly) return criteria.date('descending');
          return criteria.relevance();
        },
      };
    },
  };
}
