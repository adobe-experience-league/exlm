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
/* eslint-env mocha */

import assert from 'assert';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import nock from 'nock';
import { render } from '../src/index.js';

async function test(spec) {
  const html = await readFile(resolve(__testdir, 'fixtures', `${spec}.html`), 'utf-8');
  nock('http://www.example.com')
    .get(`/${spec}.html`)
    .reply(200, html);
  const expected = await readFile(resolve(__testdir, 'fixtures', `${spec}-semantic.html`), 'utf-8');
  const actual = await render(`/${spec}.html`, {}, {
    env: {
      publicURL: 'https://stage.lifesciences.danaher.com/',
      aemURL: 'http://www.example.com',
    },
  });
  assert.strictEqual(actual.html.trim(), expected.trim());
}

describe('Converter Tests', () => {
  before(() => {
    nock.disableNetConnect();
  });

  after(() => {
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('convert the footer html', async () => {
    await test('footer');
  });
  it('convert the header html', async () => {
    const json = await readFile(resolve(__testdir, 'fixtures', 'megamenu_items_us.json'), 'utf-8');
    nock('https://stage.lifesciences.danaher.com')
      .get('/content/dam/danaher/system/navigation/megamenu_items_us.json')
      .reply(200, json);
    await test('header');
  });
  it('convert the en html', async () => {
    await test('en');
  });
});
