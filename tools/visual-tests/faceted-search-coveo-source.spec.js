import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

const har = JSON.parse(readFileSync(new URL('./blocks/events-search/events-search.har', import.meta.url), 'utf8'));
const entry = har.log.entries.find(
  ({ request }) => request.method === 'POST' && new URL(request.url).pathname.endsWith('/rest/search/v2'),
);
const searchResponse = JSON.parse(entry.response.content.text);

async function setup(page) {
  const requests = [];
  const errors = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text());
  });
  await page.route('**/en/__faceted-search-coveo-test*', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html lang="en"><head></head><body><main></main></body></html>',
    }),
  );
  await page.route('**/placeholders.json', (route) => route.fulfill({ json: { data: [] } }));
  await page.route('**/scripts/scripts.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `export async function fetchLanguagePlaceholders() { return {}; }
        export function getPathDetails() { return { lang: 'en' }; }
        export function createTag(tag, attributes = {}, content) {
          const element = document.createElement(tag);
          Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
          if (typeof content === 'string') element.innerHTML = content;
          else if (content) element.append(content);
          return element;
        }`,
    }),
  );
  await page.route('**/scripts/coveo-headless/engine.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `export default function buildEngine(module) {
        return module.buildSearchEngine({
          configuration: {
            organizationId: 'testorg',
            accessToken: 'test-token',
            analytics: { enabled: false, analyticsMode: 'legacy' },
          },
        });
      }`,
    }),
  );
  await page.route('**/rest/search/v2*', (route) => {
    const request = route.request().postDataJSON();
    requests.push(request);
    const response = structuredClone(searchResponse);
    response.searchUid = randomUUID();
    response.facets = request.facets.map((facet) => {
      const original = searchResponse.facets.find(({ field }) => field === facet.field);
      const selected = facet.currentValues.filter(({ state }) => state === 'selected').map(({ value }) => value);
      const values = (original?.values || []).map((value) => ({
        ...value,
        state: selected.includes(value.value) ? 'selected' : 'idle',
      }));
      selected.forEach((value) => {
        if (!values.some((item) => item.value === value)) values.push({ value, state: 'selected', numberOfResults: 1 });
      });
      return { facetId: facet.facetId, field: facet.field, moreValuesAvailable: false, values };
    });
    return route.fulfill({ json: response });
  });
  return { requests, errors };
}

async function initialize(page, options = {}) {
  await page.evaluate(async (sourceOptions) => {
    const modulePath = '/scripts/faceted-search/sources/coveo-source.js';
    const { default: createSource } = await import(modulePath);
    window.coveoSource = createSource({
      groups: [{ id: 'el_product' }],
      initialSort: 'relevance',
      numberOfResults: 16,
      ...sourceOptions,
    });
    await window.coveoSource.init();
  }, options);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const snapshot = window.coveoSource.getSnapshot();
        return { ready: snapshot.ready, pending: snapshot.pending, error: snapshot.error?.message };
      }),
    )
    .toMatchObject({ ready: true, pending: false });
}

async function apply(page, action, state, sort = 'relevance') {
  const previous = await page.evaluate(() => window.coveoSource.getSnapshot().responseId);
  await page.evaluate(
    ({ searchAction, next, sortValue }) => {
      const criterion = (criteria) => (sortValue === 'date' ? criteria.date('descending') : criteria.relevance());
      window.coveoSource.apply(next, searchAction, { key: sortValue, criterion });
    },
    { searchAction: action, next: state, sortValue: sort },
  );
  await expect
    .poll(() =>
      page.evaluate((old) => {
        const snapshot = window.coveoSource.getSnapshot();
        return snapshot.responseId !== old && !snapshot.loading && !snapshot.pending;
      }, previous),
    )
    .toBe(true);
}

[
  { type: 'course' },
  { type: 'perspective' },
  { type: 'event' },
  { type: 'course', restoreSort: true },
  { type: 'perspective', restoreSort: true },
].forEach(({ type, restoreSort = false }) => {
  test(`${type} initializes once ${
    restoreSort ? 'with URL sorting ' : ''
  }and restores searches with Back/Forward`, async ({ page }) => {
    const { requests, errors } = await setup(page);
    const hash = restoreSort ? '#q=initial&sortCriteria=%40el_view_count%20descending' : '';
    await page.goto(`/en/__faceted-search-coveo-test${hash}`);
    await page.evaluate(async (contentType) => {
      window.hlx = { codeBasePath: '' };
      const controllerPath = '/scripts/faceted-search/core/controller.js';
      const sortPath = '/scripts/faceted-search/components/sort-control.js';
      const constantsPath = '/scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
      const [{ default: createSearch }, policies, { CONTENT_TYPES }] = await Promise.all([
        import(controllerPath),
        import(sortPath),
        import(constantsPath),
      ]);
      const definitions = {
        course: [policies.createCourseSortPolicy({}), policies.readCourseSort],
        perspective: [policies.createPerspectiveSortPolicy({}), policies.readPerspectiveSort],
        event: [policies.createEventSortPolicy({}, CONTENT_TYPES), policies.readEventSort],
      };
      const [sort, readSort] = definitions[contentType];
      const block = document.createElement('div');
      document.querySelector('main').append(block);
      window.controllerSearch = await createSearch(block, {
        groups: [{ id: 'el_product', name: 'Product' }],
        pageSize: 16,
        sort,
        source: {
          readSort,
          hideAqFromUrl: true,
          baseAdvancedQuery: '@el_contenttype=="Course"',
          lockedFacets: { el_contenttype: ['Course'] },
          tabId: 'Courses',
        },
        renderItem(wrapper, item) {
          wrapper.textContent = item.title;
        },
      });
    }, type);
    const grid = page.locator('.fs-results-grid');
    const ready = async (previous = null) => {
      await expect
        .poll(async () => ({
          changed:
            Boolean(await grid.getAttribute('data-searchresponseid')) &&
            (await grid.getAttribute('data-searchresponseid')) !== previous,
          busy: await page.locator('.fs-results-body').getAttribute('aria-busy'),
        }))
        .toEqual({ changed: true, busy: 'false' });
    };
    await ready();
    expect(requests).toHaveLength(1);
    const defaultCriterion = type === 'perspective' ? 'date descending' : 'relevancy';
    expect(requests[0].sortCriteria).toBe(restoreSort ? '@el_view_count descending' : defaultCriterion);
    expect(requests[0].q).toBe(restoreSort ? 'initial' : '');

    let previous = await grid.getAttribute('data-searchresponseid');
    await page.evaluate(() => window.controllerSearch.store.setGroup('el_product', ['Analytics']));
    await ready(previous);
    previous = await grid.getAttribute('data-searchresponseid');
    await page.evaluate(() => window.controllerSearch.store.setKeyword('analytics'));
    await ready(previous);
    previous = await grid.getAttribute('data-searchresponseid');
    await page.evaluate(() => window.controllerSearch.store.setPage(2));
    await ready(previous);
    const before = await page.evaluate(() => ({
      hash: window.location.hash,
      history: window.history.length,
      state: window.controllerSearch.store.get(),
    }));
    previous = await grid.getAttribute('data-searchresponseid');
    let requestCount = requests.length;
    await page.evaluate(() => window.controllerSearch.store.clear());
    await ready(previous);
    expect(requests.length - requestCount).toBe(1);
    expect(await page.evaluate(() => window.history.length)).toBe(before.history + 1);

    previous = await grid.getAttribute('data-searchresponseid');
    requestCount = requests.length;
    await page.goBack();
    await ready(previous);
    expect(requests.length - requestCount).toBe(1);
    expect(await page.evaluate(() => window.location.hash)).toBe(before.hash);
    expect(await page.evaluate(() => window.controllerSearch.store.get())).toEqual(before.state);
    expect(requests.at(-1).aq).toBe('@el_contenttype=="Course"');
    expect(
      requests
        .at(-1)
        .facets.find(({ field }) => field === 'el_contenttype')
        .currentValues.filter(({ state }) => state === 'selected'),
    ).toEqual([expect.objectContaining({ value: 'Course', state: 'selected' })]);

    previous = await grid.getAttribute('data-searchresponseid');
    requestCount = requests.length;
    await page.goForward();
    await ready(previous);
    expect(requests.length - requestCount).toBe(1);
    expect(await page.evaluate(() => window.controllerSearch.store.get().keyword)).toBe('');
    expect(errors).toEqual([]);
  });
});

test('course preparation retains the response UID for card click analytics', async ({ page }) => {
  await setup(page);
  await page.goto('/en/__faceted-search-coveo-test');
  const cards = await page.evaluate(async (result) => {
    const cardsPath = '/scripts/faceted-search/components/cards.js';
    const { createCourseCardHandlers } = await import(cardsPath);
    return createCourseCardHandlers({ signedIn: false, originLevel2: 'Courses' }).prepareItems(
      [result],
      {},
      { responseId: 'course-search-response' },
    );
  }, searchResponse.results[0]);
  expect(cards).toEqual([expect.objectContaining({ searchUid: 'course-search-response', originLevel2: 'Courses' })]);
});

test('one search per filter, keyword, sort, page and clear action without cancellation errors', async ({ page }) => {
  const { requests, errors } = await setup(page);
  await page.goto('/en/__faceted-search-coveo-test');
  await initialize(page);
  expect(requests).toHaveLength(1);
  let before = requests.length;
  const filtered = { filters: { el_product: ['Analytics'] }, keyword: '', sort: 'relevance', page: 1 };
  await apply(page, 'filter', filtered);
  expect(requests.length - before).toBe(1);
  expect(requests.at(-1).facets[0].currentValues.filter(({ state }) => state === 'selected')).toMatchObject([
    { value: 'Analytics' },
  ]);

  before = requests.length;
  const searched = { ...filtered, keyword: 'analytics' };
  await apply(page, 'keyword', searched);
  expect(requests.length - before).toBe(1);
  expect(requests.at(-1).q).toBe('analytics');

  before = requests.length;
  const sorted = { ...searched, sort: 'date' };
  await apply(page, 'sort', sorted, 'date');
  expect(requests.length - before).toBe(1);
  expect(requests.at(-1).sortCriteria).toBe('date descending');

  before = requests.length;
  await apply(page, 'page', { ...sorted, page: 2 }, 'date');
  expect(requests.length - before).toBe(1);
  expect(requests.at(-1).firstResult).toBe(16);

  before = requests.length;
  await apply(page, 'clear', { filters: { el_product: [] }, keyword: '', sort: 'relevance', page: 1 });
  expect(requests.length - before).toBe(1);
  expect(requests.at(-1).q).toBe('');
  expect(requests.at(-1).firstResult).toBe(0);
  expect(requests.at(-1).sortCriteria).toBe('relevancy');
  expect(requests.at(-1).facets[0].currentValues.filter(({ state }) => state === 'selected')).toEqual([]);
  expect(errors).toEqual([]);
});

test('restores URL filters before the first search and retains course scope when clearing', async ({ page }) => {
  const { requests, errors } = await setup(page);
  await page.goto('/en/__faceted-search-coveo-test#q=restored&f-el_product=Analytics');
  await initialize(page, {
    baseAdvancedQuery: '@el_contenttype=="Course"',
    hideAqFromUrl: true,
    tabId: 'Courses',
    lockedFacets: { el_contenttype: ['Course'] },
  });
  expect(requests).toHaveLength(1);
  expect(requests[0].q).toBe('restored');
  expect(await page.evaluate(() => window.coveoSource.getSnapshot().state.filters.el_product)).toEqual(['Analytics']);
  await apply(page, 'clear', { filters: { el_product: [] }, keyword: '', sort: 'relevance', page: 1 });
  expect(requests).toHaveLength(2);
  const request = requests.at(-1);
  expect(request.aq).toBe('@el_contenttype=="Course"');
  expect(request.tab).toBe('Courses');
  expect(
    request.facets
      .find(({ field }) => field === 'el_contenttype')
      .currentValues.filter(({ state }) => state === 'selected'),
  ).toMatchObject([{ value: 'Course' }]);
  expect(errors).toEqual([]);
});
