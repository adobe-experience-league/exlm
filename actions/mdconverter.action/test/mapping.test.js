/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import assert from 'assert';
import { mapInbound, mapOutbound } from '../src/modules/mapping.js';

describe('Mapping Tests', () => {
  describe('mapInbound using paths.yaml', () => {
    [
      ['/index.html', '/content/danaher/ls/us/en.html'],
      ['/us/en/expert.html', '/content/danaher/ls/us/en/expert.html'],
      ['/fragments/footer/master.html', '/content/experience-fragments/danaher/us/en/site/footer/master.html'],
      ['/fragments/header/master.html', '/content/experience-fragments/danaher/us/en/site/header/master.html'],
    ].forEach(([given, expected]) => {
      it(`maps ${given} to ${expected}`, () => {
        assert.equal(expected, mapInbound(given));
      });
    });
  });

  describe('mapInbound', () => {
    [
      ['/vanity.html', '/content/site/us/en/page.html', ['/content/site/us/en/page:/vanity']],
      ['/vanity-bar.html', '/vanity-bar.html', ['/content/site/us/en/page:/vanity']],
      ['/en-ch/index.html', '/content/site/ch/en.html', ['/content/site/us/en:/', '/content/site/ch/en:/en-ch/']],
      // folder to single page is ignored
      ['/vanity.html', '/vanity.html', ['/content/site/us/en/:/vanity']],
    ].forEach(([given, expected, mappings]) => {
      it(`maps ${expected} to ${given} for mappings: ${mappings}`, () => {
        assert.equal(expected, mapInbound(given, { mappings }));
      });
    });
  });

  describe('mapOutbound using paths.yaml', () => {
    [
      ['/content/danaher/ls/us/en.html', '/'],
      ['/content/danaher/ls/us/en/expert.html', '/us/en/expert'],
      ['/content/experience-fragments/danaher/us/en/site/footer/master.html', '/fragments/footer/master'],
      ['/content/experience-fragments/danaher/us/en/site/header/master.html', '/fragments/header/master'],
    ].forEach(([given, expected]) => {
      it(`maps ${given} to ${expected}`, () => {
        assert.equal(expected, mapOutbound(given));
      });
    });
  });

  describe('mapOutbound', () => {
    [
      ['/content/site/us/en.html', '/', ['/content/site/us/en:/']],
      ['/content/site/us/en', '/', ['/content/site/us/en:/']],
      ['/content/site/us/en/page', '/en-us/page', ['/content/site/us/en/:/en-us/']],
      // special handling of /index
      ['/content/site/us/en/index', '/en-us/', ['/content/site/us/en/:/en-us/']],
      // folder to single page is ignored
      ['/content/site/us/en/page', '/content/site/us/en/page', ['/content/site/us/en/:/us/en']],
    ].forEach(([given, expected, mappings]) => {
      it(`maps ${given} to ${expected} for mappings: ${mappings}`, () => {
        assert.equal(expected, mapOutbound(given, { mappings }));
      });
    });
  });

  describe('round trip', () => {
    [
      ['/content/site/us/en/page.html', ['/content/site/us/en/:/']],
      ['/content/site/us/en/index.html', ['/content/site/us/en/:/']],
    ].forEach(([path, mappings]) => {
      it(`preserve ${path} for mappings: ${mappings}`, () => {
        const cfg = { mappings };
        let mapped = mapOutbound(path, cfg);
        // /index and .html is added by helix-admin
        if (mapped.endsWith('/')) {
          mapped += 'index';
        }
        mapped += '.html';
        assert.equal(path, mapInbound(mapped, cfg));
      });
    });
  });
});
