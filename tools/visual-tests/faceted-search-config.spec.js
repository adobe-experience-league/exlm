import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/en/__faceted-search-config-test', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html lang="en"><head></head><body><main></main></body></html>',
    }),
  );
  await page.route('**/placeholders.json', (route) => route.fulfill({ json: { data: [] } }));
  await page.route('**/perspective-index.json', (route) =>
    route.fulfill({ json: { data: [{ coveoSolution: 'Analytics;Commerce' }] } }),
  );
  await page.route('**/scripts/auth/profile.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `export async function isSignedInUser() {
        window.courseAuthChecks = (window.courseAuthChecks || 0) + 1;
        return window.testSignedIn === true;
      }`,
    }),
  );
  await page.goto('/en/__faceted-search-config-test');
});

test('resolves all four presets with their existing source and feature contracts', async ({ page }) => {
  const configs = await page.evaluate(async () => {
    const modulePath = '/scripts/faceted-search/core/config.js';
    const { default: createConfig } = await import(modulePath);
    return Promise.all(
      ['event', 'playlist', 'perspective', 'course'].map(async (contentType) => {
        const config = await createConfig({ contentType, filters: true, sort: true, pagination: true });
        return {
          contentType,
          groups: config.groups.map(({ id }) => id),
          resultsPrefix: config.resultsPrefix,
          sourceType: config.source.type || 'coveo',
          initialSort: config.sort.initial,
          pageSize: config.pageSize,
          paginationSize: config.pagination.pageSize,
          lockedTypes: config.source.lockedFacets?.el_contenttype,
          tab: config.source.tabId,
        };
      }),
    );
  });
  expect(configs).toMatchObject([
    {
      contentType: 'event',
      groups: ['el_product', 'el_contenttype', 'el_event_series'],
      resultsPrefix: 'events-search',
      sourceType: 'coveo',
      tab: 'Events Hub',
    },
    {
      contentType: 'playlist',
      groups: ['solution', 'role', 'level'],
      resultsPrefix: 'playlist-browse',
      sourceType: 'collection',
      pageSize: 12,
    },
    {
      contentType: 'perspective',
      groups: ['el_product', 'el_role', 'author_type'],
      resultsPrefix: 'perspectives-search',
      initialSort: 'newest',
      sourceType: 'coveo',
    },
    {
      contentType: 'course',
      groups: ['el_product', 'el_level'],
      resultsPrefix: 'browse-courses',
      pageSize: 12,
      sourceType: 'coveo',
      lockedTypes: ['Course'],
      tab: 'Courses',
    },
  ]);
  configs.forEach((config) => expect(config.pageSize).toBe(config.paginationSize));
  const unpaged = await page.evaluate(async () => {
    const modulePath = '/scripts/faceted-search/core/config.js';
    const { default: createConfig } = await import(modulePath);
    const course = await createConfig({ contentType: 'course' });
    const playlist = await createConfig({ contentType: 'playlist' });
    return {
      coursePageSize: course.pageSize,
      playlistUnbounded: playlist.pageSize === Infinity,
      coursePagination: course.pagination,
      playlistPagination: playlist.pagination,
    };
  });
  expect(unpaged).toEqual({
    coursePageSize: 1000,
    playlistUnbounded: true,
    coursePagination: false,
    playlistPagination: false,
  });
});

test('legacy course mapping waits for facets and remains isolated per search', async ({ page }) => {
  const mapped = await page.evaluate(async () => {
    const filtersPath = '/scripts/faceted-search/components/filters.js';
    const storePath = '/scripts/faceted-search/state/store.js';
    const { createCourseLegacyFilterMapper } = await import(filtersPath);
    const { createFilterStore } = await import(storePath);
    const store = createFilterStore({ groupIds: ['el_product', 'el_level'] });
    const map = createCourseLegacyFilterMapper();
    store.setGroup('el_product', ['Experience ManagerSites']);
    store.setGroup('el_level', ['Invalid level']);
    map({ store, snapshot: { facets: {} } });
    const pending = store.get().filters;
    const snapshot = {
      facets: {
        el_product: [{ value: 'Experience Manager|Sites' }],
        el_level: [{ value: 'Beginner' }],
      },
    };
    map({ store, snapshot });
    const resolved = store.get().filters;
    store.setGroup('el_product', ['Experience ManagerSites']);
    map({ store, snapshot });
    const afterCompletion = store.get().filters;
    createCourseLegacyFilterMapper()({ store, snapshot });
    return { pending, resolved, afterCompletion, independent: store.get().filters };
  });
  expect(mapped.pending).toEqual({ el_product: ['Experience ManagerSites'], el_level: ['Invalid level'] });
  expect(mapped.resolved).toEqual({ el_product: ['Experience Manager|Sites'], el_level: [] });
  expect(mapped.afterCompletion.el_product).toEqual(['Experience ManagerSites']);
  expect(mapped.independent.el_product).toEqual(['Experience Manager|Sites']);
});

test('only courses resolve authentication and migrate legacy URLs', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const modulePath = '/scripts/faceted-search/core/config.js';
    const { default: createConfig } = await import(modulePath);
    window.history.replaceState(null, '', '?martech=off&product=Analytics&level=Beginner#browse-courses');
    const original = window.location.href;
    await Promise.all(['event', 'playlist', 'perspective'].map((contentType) => createConfig({ contentType })));
    const others = { authChecks: window.courseAuthChecks || 0, urlUnchanged: window.location.href === original };
    window.testSignedIn = true;
    const course = await createConfig({ contentType: 'course' });
    const signedInStatus = typeof course.createView === 'function';
    const filters = Object.fromEntries(new URLSearchParams(window.location.hash.slice(1)));
    window.testSignedIn = false;
    const signedOut = await createConfig({ contentType: 'course' });
    return {
      others,
      authChecks: window.courseAuthChecks,
      signedInStatus,
      signedOutStatus: typeof signedOut.createView === 'function',
      filters,
      search: window.location.search,
    };
  });
  expect(result).toEqual({
    others: { authChecks: 0, urlUnchanged: true },
    authChecks: 2,
    signedInStatus: true,
    signedOutStatus: false,
    filters: { 'f-el_product': 'Analytics', 'f-el_level': 'Beginner' },
    search: '?martech=off',
  });
});

test('course URL migration preserves hash precedence, sanitization and ordinary anchors', async ({ page }) => {
  const migrated = await page.evaluate(async () => {
    const modulePath = '/scripts/faceted-search/state/url-state.js';
    const { migrateLegacyCourseUrlParams } = await import(modulePath);
    const cases = [
      '?martech=off&product=Analytics,%20Commerce%21&level=Beginner#q=search&sortCriteria=relevancy',
      '?product=Analytics&level=Beginner#f-el_product=Commerce&q=search',
      '?product=&level=#browse-courses',
      '?martech=off#browse-courses',
    ];
    return cases.map((url) => {
      window.history.replaceState(null, '', url);
      const historyLength = window.history.length;
      migrateLegacyCourseUrlParams();
      const migratedUrl = window.location.href;
      migrateLegacyCourseUrlParams();
      return {
        search: window.location.search,
        hash: window.location.hash,
        filters: Object.fromEntries(new URLSearchParams(window.location.hash.slice(1))),
        idempotent: window.location.href === migratedUrl,
        historyUnchanged: window.history.length === historyLength,
      };
    });
  });
  expect(migrated[0]).toMatchObject({
    search: '?martech=off',
    filters: {
      q: 'search',
      sortCriteria: 'relevancy',
      'f-el_product': 'Analytics,Commerce',
      'f-el_level': 'Beginner',
    },
  });
  expect(migrated[1].filters).toEqual({
    'f-el_product': 'Commerce',
    q: 'search',
    'f-el_level': 'Beginner',
  });
  expect(migrated[2]).toMatchObject({ search: '', hash: '#browse-courses' });
  expect(migrated[3]).toMatchObject({ search: '?martech=off', hash: '#browse-courses' });
  migrated.forEach((result) => {
    expect(result.idempotent).toBe(true);
    expect(result.historyUnchanged).toBe(true);
  });
});
test('course level ordering retains selected zero-count values and localized labels', async ({ page }) => {
  const values = await page.evaluate(async () => {
    const modulePath = '/scripts/faceted-search/components/filters.js';
    const { getCourseFacetItems } = await import(modulePath);
    return getCourseFacetItems(
      { id: 'el_level' },
      [
        { value: 'Experienced', count: 2 },
        { value: 'Other', count: 0 },
        { value: 'Intermediate', count: 1 },
        { value: 'Beginner', count: 3 },
        { value: 'Hidden', count: 0 },
      ],
      { filters: { el_level: ['Other'] } },
      { filterExpLevelBeginnerTitle: 'Localized beginner' },
    ).map(({ value, title }) => ({ value, title }));
  });
  expect(values).toEqual([
    { value: 'Beginner', title: 'Localized beginner' },
    { value: 'Intermediate', title: 'Intermediate' },
    { value: 'Experienced', title: 'Experienced' },
    { value: 'Other', title: 'Other' },
  ]);
});

test('course status filtering updates visibility, resets and cleans up', async ({ page }) => {
  await page.addStyleTag({ url: '/styles/styles.css' });
  await page.addStyleTag({ url: '/blocks/browse-courses/browse-courses.css' });
  await page.evaluate(async () => {
    const cardsPath = '/scripts/faceted-search/components/cards.js';
    const filtersPath = '/scripts/faceted-search/components/filters.js';
    const storePath = '/scripts/faceted-search/state/store.js';
    const [{ createCourseStatusView, createResults }, { default: createUI }, { createFilterStore }] = await Promise.all(
      [import(cardsPath), import(filtersPath), import(storePath)],
    );
    const block = document.createElement('div');
    block.className = 'browse-courses fs-layout';
    const controls = document.createElement('div');
    document.querySelector('main').append(block);
    document.body.classList.add('appear');
    window.courseStatusStore = createFilterStore({ groupIds: [] });
    const ui = createUI({ store: window.courseStatusStore, groups: [] });
    const results = createResults({
      resultsPrefix: 'browse-courses',
      onClear: () => window.courseStatusStore.clear(),
    });
    results.grid.innerHTML = `
      <div class="browse-courses-card-item" data-course-status="not-started">New</div>
      <div class="browse-courses-card-item" data-course-status="in-progress">Started</div>
      <div class="browse-courses-card-item" data-course-status="completed">Done</div>`;
    block.append(ui.filtersEl, ui.countEl, controls, results.body);
    window.courseStatusView = await createCourseStatusView({})({
      block,
      body: results.body,
      controls,
      store: window.courseStatusStore,
      results,
      ui,
      labels: { resultsSuffix: 'courses' },
    });
    window.courseStatusView.afterRender({ snapshot: { total: 3 } });
  });
  await expect(page.locator('div.browse-courses-status')).toHaveCount(1);
  await page.locator('.browse-courses-status button').click();
  await page.locator('.browse-courses-status label[for="option-status-dropdown-2"]').click();
  await expect(page.locator('.browse-courses-card-item:not([hidden])')).toHaveText('Started');
  await expect(page.locator('.fs-results-count-value')).toHaveText('1');
  await expect(page.locator('.fs-clear-filters')).toBeEnabled();
  await page.locator('.fs-clear-filters').click();
  await expect(page.locator('.browse-courses-card-item:not([hidden])')).toHaveCount(3);
  await expect(page.locator('.fs-results-count-value')).toHaveText('3');
  await expect(page.locator('.browse-courses-status input[value="in-progress"]')).not.toBeChecked();
  await expect(page.locator('.fs-clear-filters')).toBeDisabled();

  // A course can change status while the dropdown's cached options are still open.
  await page.locator('.browse-courses-status button').click();
  await page.locator('[data-course-status="completed"]').evaluate((card) => {
    card.dataset.courseStatus = 'not-started';
  });
  await page.locator('.browse-courses-status label[for="option-status-dropdown-3"]').click();
  await expect(page.locator('.fs-no-results')).toBeVisible();
  await expect(page.locator('.fs-results-count-value')).toHaveText('0');
  await page.getByRole('link', { name: 'Clear search' }).click();
  await expect(page.locator('.fs-no-results')).toBeHidden();
  await expect(page.locator('.browse-courses-card-item:not([hidden])')).toHaveCount(3);
  await expect(page.locator('.fs-results-count-value')).toHaveText('3');
  await page.evaluate(() => window.courseStatusView.destroy());
  await expect(page.locator('.browse-courses-status')).toHaveCount(0);
  await expect(page.locator('.browse-courses-status-empty')).toHaveCount(0);
});

test('shared Coveo facets preserve selected zero-count values and explicit empty static groups', async ({ page }) => {
  const rendered = await page.evaluate(async () => {
    const filtersPath = '/scripts/faceted-search/components/filters.js';
    const { getCoveoFacetItems } = await import(filtersPath);
    const state = { filters: { product: ['Selected'] } };
    const values = [
      { value: 'Selected', count: 0 },
      { value: 'No matches', count: 0 },
      { value: 'Analytics|Reports', count: 2 },
    ];
    return {
      dynamic: getCoveoFacetItems({ id: 'product' }, values, state),
      empty: getCoveoFacetItems({ id: 'product', items: [] }, values, state),
      static: getCoveoFacetItems(
        { id: 'product', items: [{ value: 'Selected', title: 'Authored label' }] },
        values,
        state,
      ),
    };
  });
  expect(rendered.dynamic).toEqual([
    { value: 'Analytics|Reports', title: 'Analytics | Reports', count: 2 },
    { value: 'Selected', title: 'Selected', count: 0 },
  ]);
  expect(rendered.empty).toEqual([]);
  expect(rendered.static).toEqual([{ value: 'Selected', title: 'Authored label', count: 0 }]);
});

['events-search', 'browse-courses', 'perspectives-search', 'playlist-browse'].forEach((name) => {
  test(`${name} shares responsive result, shimmer and view-switcher layout`, async ({ page }) => {
    await page.addStyleTag({ url: '/styles/styles.css' });
    await page.addStyleTag({ url: `/blocks/${name}/${name}.css` });
    await page.evaluate(async (blockName) => {
      const controllerPath = '/scripts/faceted-search/core/controller.js';
      const cardsPath = '/scripts/faceted-search/components/cards.js';
      const [{ default: createSearch }, { createCardLoading }] = await Promise.all([
        import(controllerPath),
        import(cardsPath),
      ]);
      const block = document.createElement('div');
      block.className = blockName;
      document.querySelector('main').append(block);
      document.body.classList.add('appear');
      let listener;
      let response = 0;
      const snapshot = (loading) => {
        response += 1;
        return {
          state: { filters: {}, keyword: '', sort: '', page: 1 },
          items: [{ title: 'First' }, { title: 'Second' }, { title: 'Third' }],
          facets: {},
          total: 3,
          page: 1,
          maxPage: 1,
          responseId: `layout-${response}`,
          ready: true,
          loading,
        };
      };
      window.setLayoutLoading = (loading) => listener(snapshot(loading));
      await createSearch(block, {
        groups: [],
        resultsPrefix: blockName,
        cards: { type: 'layout-test', dataFormat: 'models', viewSwitcher: true },
        createLoading: () => createCardLoading(3),
        createSource: () => ({
          subscribe(callback) {
            listener = callback;
            return () => {};
          },
          init() {
            listener(snapshot(false));
          },
          destroy() {},
        }),
        renderItem(wrapper, item) {
          wrapper.innerHTML = '<div class="browse-card"><div class="browse-card-content"></div></div>';
          wrapper.querySelector('.browse-card-content').textContent = item.title;
        },
      });
    }, name);
    const grid = page.locator('.fs-results-grid');
    const columnCount = (locator) =>
      locator.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    await expect(page.locator('.fs-card-item')).toHaveCount(3);
    const viewports = [
      [320, 1],
      [768, 2],
      [900, 3],
      [1024, 2],
      [1440, 3],
    ];
    for (let index = 0; index < viewports.length; index += 1) {
      const [width, columns] = viewports[index];
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => columnCount(grid)).toBe(columns);
      if (width < 900) await expect(page.getByRole('button', { name: 'List view' })).toBeHidden();
      else await expect(page.getByRole('button', { name: 'List view' })).toBeVisible();
      await page.evaluate(() => window.setLayoutLoading(true));
      const shimmer = page.locator('.browse-card-shimmer');
      await expect(shimmer).toBeVisible();
      await expect.poll(() => columnCount(shimmer)).toBe(columns);
      await page.evaluate(() => window.setLayoutLoading(false));
      await expect(shimmer).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'List view' }).click();
    await expect.poll(() => columnCount(grid)).toBe(1);
    await page.evaluate(() => window.setLayoutLoading(true));
    await expect.poll(() => columnCount(page.locator('.browse-card-shimmer'))).toBe(1);
  });
});

[false, true].forEach((signedIn) => {
  test(`course view switching works when ${signedIn ? 'signed in' : 'signed out'}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addStyleTag({ url: '/styles/styles.css' });
    await page.addStyleTag({ url: '/blocks/browse-courses/browse-courses.css' });
    await page.evaluate(async (authenticated) => {
      window.testSignedIn = authenticated;
      const configPath = '/scripts/faceted-search/core/config.js';
      const controllerPath = '/scripts/faceted-search/core/controller.js';
      const [{ default: createConfig }, { default: createSearch }] = await Promise.all([
        import(configPath),
        import(controllerPath),
      ]);
      const block = document.createElement('div');
      block.className = 'browse-courses';
      const section = document.createElement('div');
      section.className = 'section browse-courses-container';
      section.dataset.sectionStatus = 'loaded';
      section.append(block);
      document.querySelector('main').append(section);
      window.setCourseViewSwitcher = async (viewSwitcher) => {
        const config = await createConfig({ contentType: 'course', filters: true, sort: true, viewSwitcher });
        return createSearch(block, {
          ...config,
          heading: 'Browse all courses',
          source: {
            type: 'collection',
            loadItems: async () => [
              { title: 'First course', status: 'not-started' },
              { title: 'Second course', status: 'in-progress' },
              { title: 'Third course', status: 'completed' },
            ],
          },
          prepareItems: (items) => items,
          renderItem(wrapper, item) {
            wrapper.dataset.courseStatus = item.status;
            wrapper.innerHTML = `<div class="browse-card course-card">
              <div class="browse-card-figure"><div class="browse-card-icon"></div></div>
              <div class="browse-card-content">
                <h3 class="browse-card-title-text"></h3>
                <div class="browse-card-course-info"><span class="course-info-level-duration">Beginner | 1 hour</span></div>
                <p class="browse-card-description-text">Learn about Analytics features, reporting workflows, and practical examples for building reports and understanding your customer data.</p>
              </div>
              <div class="browse-card-footer">View course</div>
            </div>`;
            wrapper.querySelector('.browse-card-title-text').textContent = item.title;
          },
        });
      };
      await window.setCourseViewSwitcher(true);
    }, signedIn);
    const grid = page.locator('.browse-courses-results-grid');
    const body = page.locator('.browse-courses-results-body');
    const columns = () => grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    await expect(page.locator('.browse-courses-card-item')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Grid view' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'List view' })).toBeVisible();
    await expect(page.locator('.browse-courses-status')).toHaveCount(signedIn ? 1 : 0);
    await expect.poll(columns).toBe(3);
    await page.getByRole('button', { name: 'List view' }).click();
    await expect(body).toHaveClass(/\blist\b/);
    await expect.poll(columns).toBe(1);
    const card = page.locator('.course-card').first();
    await expect(card).toHaveCSS('flex-direction', 'row');
    await expect.poll(() => card.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(210);
    expect(
      await card.evaluate((element) => {
        const figure = element.querySelector('.browse-card-figure').getBoundingClientRect();
        const content = element.querySelector('.browse-card-content').getBoundingClientRect();
        const footer = element.querySelector('.browse-card-footer').getBoundingClientRect();
        return figure.right <= content.left && content.right <= footer.left;
      }),
    ).toBe(true);
    await page.getByRole('button', { name: 'Grid view' }).click();
    await expect(body).not.toHaveClass(/\blist\b/);
    await expect.poll(columns).toBe(3);
    await expect(card).toHaveCSS('flex-direction', 'column');

    await page.getByRole('button', { name: 'List view' }).click();
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect
      .poll(() =>
        page.locator('.fs-results-column').evaluate((column) => {
          const bounds = column.getBoundingClientRect();
          return [...column.querySelectorAll('.fs-toolbar-controls button')].every((button) => {
            const rect = button.getBoundingClientRect();
            return !rect.width || (rect.left >= bounds.left - 0.5 && rect.right <= bounds.right + 0.5);
          });
        }),
      )
      .toBe(true);
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('button', { name: 'List view' })).not.toBeVisible();
    await expect(body).not.toHaveClass(/\blist\b/);
    await expect.poll(columns).toBe(2);

    await page.evaluate(() => window.setCourseViewSwitcher(false));
    await expect(page.locator('.browse-courses-card-item')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'List view' })).toHaveCount(0);
    await expect(page.locator('.browse-courses-status')).toHaveCount(signedIn ? 1 : 0);
  });
});

test('shared UI always uses fs while result classes retain their content prefix', async ({ page }) => {
  const rendered = await page.evaluate(async () => {
    const modulePath = '/scripts/faceted-search/faceted-search.js';
    const { createFacetedSearch, createCollectionSortPolicy } = await import(modulePath);
    const block = document.createElement('div');
    block.innerHTML = '<div><div>Browse all content</div></div><div><div>h3</div></div>';
    document.querySelector('main').append(block);
    const config = {
      prefix: 'unsupported',
      resultsPrefix: 'playlist-browse',
      heading: true,
      groups: [{ id: 'product', name: 'Product' }],
      sort: createCollectionSortPolicy(),
      pageSize: 1,
      pagination: { pageSize: 1 },
      source: {
        type: 'collection',
        loadItems: async () => [
          { title: 'Analytics course', product: 'Analytics' },
          { title: 'Commerce course', product: 'Commerce' },
        ],
      },
      renderItem: (element, item) => {
        element.textContent = item.title;
      },
    };
    await createFacetedSearch(block, config);
    await createFacetedSearch(block, config);
    const toggle = block.querySelector('.fs-mobile-filter-toggle');
    const prefixed = {
      heading: block.querySelector('h3.fs-heading')?.textContent,
      headingCount: block.querySelectorAll('.fs-heading').length,
      sharedClasses: ['fs-layout', 'fs-filters', 'fs-keyword', 'fs-sort'].every((name) =>
        block.querySelector(`.${name}`),
      ),
      panelLinked: toggle?.getAttribute('aria-controls') === block.querySelector('.fs-filters-panel')?.id,
      pagination: !!block.querySelector('.fs-pagination.playlist-browse-pagination'),
      unsupportedClasses: [...block.querySelectorAll('[class]')].some((element) =>
        [...element.classList].some((name) => name.startsWith('unsupported-')),
      ),
    };
    const defaults = document.createElement('div');
    document.querySelector('main').append(defaults);
    await createFacetedSearch(defaults, { ...config, heading: false, resultsPrefix: undefined });
    return {
      prefixed,
      defaultResults: !!defaults.querySelector('.fs-results-body .fs-results-grid'),
    };
  });

  expect(rendered).toEqual({
    prefixed: {
      heading: 'Browse all content',
      headingCount: 1,
      sharedClasses: true,
      panelLinked: true,
      pagination: true,
      unsupportedClasses: false,
    },
    defaultResults: true,
  });
  await expect(page.locator('.playlist-browse-card-item')).toHaveText('Analytics course');
  await expect(page.locator('div.fs-filter-group')).toHaveCount(2);
  const toggle = page.locator('.fs-mobile-filter-toggle').first();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await page.locator('.playlist-browse-pagination .right-nav-arrow').click();
  await expect(page.locator('.playlist-browse-card-item')).toHaveText('Commerce course');
});

test('Perspective view switching honors the flag and retains three-column list cards', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addStyleTag({ url: '/styles/styles.css' });
  await page.addStyleTag({ url: '/blocks/perspectives-search/perspectives-search.css' });
  await page.evaluate(async () => {
    const configPath = '/scripts/faceted-search/core/config.js';
    const controllerPath = '/scripts/faceted-search/core/controller.js';
    const [{ default: createConfig }, { default: createSearch }] = await Promise.all([
      import(configPath),
      import(controllerPath),
    ]);
    const block = document.createElement('div');
    block.className = 'perspectives-search';
    document.querySelector('main').append(block);
    window.setPerspectiveViewSwitcher = async (viewSwitcher) => {
      const config = await createConfig({ contentType: 'perspective', filters: true, sort: true, viewSwitcher });
      return createSearch(block, {
        ...config,
        heading: 'Browse all perspectives',
        source: {
          type: 'collection',
          loadItems: async () => [
            { title: 'First perspective' },
            { title: 'Second perspective' },
            { title: 'Third perspective' },
          ],
        },
        prepareItems: (items) => items,
        renderItem(wrapper, item) {
          wrapper.innerHTML = `<div class="browse-card perspective-card">
              <div class="browse-card-figure"><img alt="Perspective thumbnail" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='48'%3E%3C/svg%3E"></div>
              <div class="browse-card-content"><h3 class="browse-card-title-text"></h3></div>
              <div class="browse-card-footer"><a class="browse-card-cta-element" href="#insight">View insight</a></div>
            </div>`;
          wrapper.querySelector('.browse-card-title-text').textContent = item.title;
        },
      });
    };
    await window.setPerspectiveViewSwitcher(true);
  });
  const body = page.locator('.perspectives-search-results-body');
  const grid = page.locator('.perspectives-search-results-grid');
  const card = page.locator('.perspective-card').first();
  const columns = () => grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  await expect(page.locator('.perspectives-search-card-item')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'List view' })).toBeVisible();
  await expect.poll(columns).toBe(3);
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(body).toHaveClass(/\blist\b/);
  await expect.poll(columns).toBe(1);
  expect(
    await card.evaluate((element) => {
      const figure = element.querySelector('.browse-card-figure').getBoundingClientRect();
      const content = element.querySelector('.browse-card-content').getBoundingClientRect();
      const footer = element.querySelector('.browse-card-footer').getBoundingClientRect();
      return figure.right <= content.left && content.right <= footer.left;
    }),
  ).toBe(true);
  await expect(card.locator('img')).toHaveCSS('object-fit', 'cover');
  await page.getByRole('button', { name: 'Grid view' }).click();
  await expect(body).not.toHaveClass(/\blist\b/);
  await expect.poll(columns).toBe(3);
  await expect(card).toHaveCSS('flex-direction', 'column');

  await page.getByRole('button', { name: 'List view' }).click();
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(body).not.toHaveClass(/\blist\b/);
  await expect(page.getByRole('button', { name: 'List view' })).not.toBeVisible();
  await expect.poll(columns).toBe(2);
  await page.evaluate(() => window.setPerspectiveViewSwitcher(false));
  await expect(page.locator('.perspectives-search-card-item')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'List view' })).toHaveCount(0);
});
