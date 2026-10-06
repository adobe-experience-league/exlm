/**
 * EXLM-5837 evidence against @coveo/headless 2.42.0.
 * No live Coveo org: this reads the engine state Headless copies onto the
 * Search API `tab` field and onto usage-analytics originLevel2.
 *
 * From exlm/, after `npm install` in scripts/coveo-headless/libs:
 *   node docs/spikes/EXLM-5837-evidence.mjs
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  buildSearchEngine,
  buildTab,
  buildUrlManager,
  getOrganizationEndpoints,
  loadSearchConfigurationActions,
} = require('../../scripts/coveo-headless/libs/node_modules/@coveo/headless/dist/headless.js');

function runCase(label, tabId) {
  const engine = buildSearchEngine({
    configuration: {
      organizationId: 'exlm5837spike',
      accessToken: 'spike-token',
      organizationEndpoints: getOrganizationEndpoints('exlm5837spike'),
      analytics: { enabled: true, analyticsMode: 'legacy' },
    },
  });
  engine.dispatch(
    loadSearchConfigurationActions(engine).updateSearchConfiguration({
      searchHub: 'Experience League Learning Hub',
    }),
  );
  if (tabId) {
    buildTab(engine, {
      initialState: { isActive: true },
      options: { id: tabId, expression: '' },
    });
  }
  const urlManager = buildUrlManager(engine, { initialState: { fragment: '' } });
  const activeTab = Object.values(engine.state.tabSet || {}).find((tab) => tab.isActive) || null;
  return {
    label,
    searchHub: engine.state.searchHub,
    originLevel2: engine.state.configuration.analytics.originLevel2,
    activeTabId: activeTab?.id ?? null,
    activeTabExpression: activeTab?.expression ?? null,
    urlFragment: urlManager.state.fragment,
  };
}

const eventsHub = runCase('events-hub-with-tab', 'Events Hub');
const browse = runCase('browse-without-tab', '');

const evidence = {
  package: '@coveo/headless',
  version: '2.42.0',
  ranAt: new Date().toISOString(),
  mapping:
    'Search API body field `tab` is set from configuration.analytics.originLevel2. updateActiveTab writes the Tab id into that field. An empty tab expression is omitted from cq.',
  eventsHub,
  browse,
  pass:
    eventsHub.originLevel2 === 'Events Hub' &&
    eventsHub.searchHub === 'Experience League Learning Hub' &&
    eventsHub.activeTabId === 'Events Hub' &&
    eventsHub.activeTabExpression === '' &&
    eventsHub.urlFragment === 'tab=Events%20Hub' &&
    browse.originLevel2 === 'default' &&
    browse.searchHub === 'Experience League Learning Hub' &&
    browse.activeTabId === null &&
    browse.urlFragment === '',
};

const out = join(dirname(fileURLToPath(import.meta.url)), 'EXLM-5837-evidence.json');
writeFileSync(out, `${JSON.stringify(evidence, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
process.exit(evidence.pass ? 0 : 1);
