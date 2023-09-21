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
/* eslint-disable import/no-relative-packages */
/* eslint-disable no-underscore-dangle */

const Logger = require("@adobe/aio-lib-core-logging");
const transform = require("./modules/clue/transformer/transformer.js");
let aioLogger = Logger("App");

function addExtensionIfNotExists(str, ext) {
  if (!str.endsWith(ext)) {
    return str + ext;
  }
  return str;
}

const parseDocsPath = (path) => {
  if (!path.startsWith("/")) {
    throw new Error("path must start with /");
  }
  const [, org, repo, branch, ...rest] = path.split("/");
  const fileName = rest[rest.length - 1];
  const folderPath = `/${rest.slice(0, -1).join("/")}`;
  return {
    org,
    repo,
    branch,
    fileName,
    folderPath,
  };
};

async function render(path) {
  /*
  const mdPath = addExtensionIfNotExists(path, ".md");
  const url = new URL(mdPath, "https://raw.githubusercontent.com");
  const parsedPath = parseDocsPath(mdPath);
  const resp = await fetch(url);
  console.log("fetched..", url);

  if (!resp.ok) {
    return { error: { code: resp.status, message: resp.statusText } };
  }

  const md = await resp.text();

  const result = await transform({
    src: parsedPath.folderPath,
    file: parsedPath.fileName,
    raw: md,
    base: "",
    lang: "en",
    type: "docs",
    solution: [],
    admonition: {},
  });

  const html = result.lhtml.split("<body>")[1].split("</body>")[0];;
  */
  const html = `<body style="background-image: none;">
  <div data-id="spectrum-notice-container" class="is-hidden" style="background-image: none;"></div>
  <div id="wrap" style="background-image: none;">
    <div style="background-image: none;"> </div>
    <div id="app" data-type="" style="background-image: none;">
      <div id="toc-toggle" class="columns is-hidden-touch is-absolute-full-width is-marginless" style="background-image: none;">
        <div class="column col-a sp-col-2 is-right" style="background-image: none;"> <a class="is-active" style="background-image: none;">
            <figure class="image is-16x16 is-inline-block" style="background-image: none;"> <img src="/assets/img/left-rail-open.svg" loading="lazy" style="background-image: none;"> </figure>
          </a><span> </span> </div>
        <div class="column col-b sp-col-2 is-hidden-touch is-left" style="background-image: none;"> <a class="is-active" style="background-image: none;">
            <figure class="image is-16x16 is-inline-block" style="background-image: none;"> <img src="/assets/img/left-rail-open.svg" loading="lazy" style="background-image: none;"> </figure>
          </a><span> </span> </div>
      </div>
      <div id="container" class="columns is-desktop is-marginless is-paddingless" style="background-image: none;">
        <div class="column sp-col-2 sp-pt-700" data-id="toc" style="background-image: none;">
          <div class="column is-hidden-desktop" style="background-image: none;"> <button id="dropdown-nav" type="button" class="spectrum-Picker spectrum-Picker--sizeXL" aria-haspopup="listbox" style="width: 100%; background-image: none;"="true"=""> <span class="spectrum-Picker-label" style="background-image: none;">Table of contents</span> <object data="/assets/img/chevron_down.svg" height="20" class="spectrum-PickerButton-UIIcon spectrum-Icon is-rotated" focusable="false" aria-hidden="true" style="background-image: none;"> </object> </button> </div>
          <div id="toc-content" class="spectrum-Site-nav is-hidden-touch" style="background-image: none;">
            <ul id="product" class="spectrum-SideNav" style="background-image: none;">
              <li style="background-image: none;"> <span class="product-icon" style="background-image: none;"></span> </li>
            </ul> User <ul class="related-topics is-hidden" style="background-image: none;">
              <li style="background-image: none;"><a href="/?lang=en#related-topics" style="background-image: none;">Related Topics</a>
                <ul style="background-image: none;">
                  <li style="background-image: none;"></li>
                </ul>
              </li>
            </ul>
            <ul class="related-content is-hidden" style="background-image: none;">
              <li style="background-image: none;"><a href="/?lang=en#related-content" style="background-image: none;">Related Content</a>
                <ul style="background-image: none;">
                  <li style="background-image: none;"></li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
        <div class="column" data-id="main" style="background-image: none;">
          <div id="header" style="background-image: none;">
            <dx-docs-mt mt="false" toggle="true" togglemsg="Automatic Translation" toggleurl="/docs/contributor/contributor-guide/localization/machine-translation.html?lang=en" lang="en" visible="false" class="is-block is-margin-bottom-big is-hidden-tablet" style="background-image: none;"></dx-docs-mt>
          </div>
          <div data-id="body" style="background-image: none;">
            <div class="docs-main" style="background-image: none;">
              <h1 id="help-center" tabindex="-1" style="background-image: none;">Help Center</h1>
              <div class="doc-meta" style="background-image: none;">
                <div class="doc-meta--item summary is-hidden" style="background-image: none;"> </div>
                <div class="doc-meta--item last-updated is-hidden" style="background-image: none;"> Last update: <span class="date-format" style="background-image: none;"></span> </div>
                <div class="doc-meta--item topics " style="background-image: none;">
                  <ul style="background-image: none;">
                    <li style="background-image: none;">Topics:</li>
                    <li style="background-image: none;"><a href="#" data-topics="Getting Started" style="background-image: none;">Getting Started</a></li>
                  </ul>
                </div>
                <div class="doc-meta--item tags " style="background-image: none;">
                  <ul style="background-image: none;">
                    <li style="background-image: none;">Created for:</li>
                    <li style="background-image: none;">
                      <div style="background-image: none;">
                        <div style="background-image: none;">Beginner</div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div class="doc-actions is-hidden-desktop" style="background-image: none;">
                  <dx-bookmark style="background-image: none;"></dx-bookmark>
                  <dx-link-page style="background-image: none;"></dx-link-page>
                </div>
              </div>
              <p style="background-image: none;">The Help Center in Marketo Engage serves as a centralized location for getting assistance. In addition to linking out to various resources (e.g., <a href="/docs//marketo/home.html?lang=en" target="_blank" style="background-image: none;">product documentation</a>, <a href="/docs//marketo/release-notes/current.html?lang=en" target="_blank" style="background-image: none;">release information</a>, the <a href="https://nation.marketo.com/" target="_blank" style="background-image: none;">Marketing Nation Community</a>), you can access helpful in-product walkthroughs organized by experience level.</p>
              <h2 id="how-to-access" tabindex="-1" style="background-image: none;">How to Access</h2>
              <p style="background-image: none;">After you log in to Marketo Engage, click the Help icon.</p>
              <p style="background-image: none;"><img src="assets/help-center-1.png" alt="" style="background-image: none;"></p>
              <h3 id="guides" tabindex="-1" style="background-image: none;">Guides</h3>
              <p style="background-image: none;">Guides serve as quick walkthroughs for popular features.</p>
              <p style="background-image: none;"><img src="assets/help-center-2.png" alt="" style="background-image: none;"></p>
              <ol style="background-image: none;">
                <li style="background-image: none;">
                  <p style="background-image: none;">Click the desired guide to view it.</p>
                  <p style="background-image: none;"><img src="assets/help-center-3.png" alt="" style="background-image: none;"></p>
                </li>
                <li style="background-image: none;">
                  <p style="background-image: none;">Click <strong style="background-image: none;">Get Started</strong>.</p>
                  <p style="background-image: none;"><img src="assets/help-center-4.png" alt="" style="background-image: none;"></p>
                </li>
                <li style="background-image: none;">
                  <p style="background-image: none;">Click <strong style="background-image: none;">Next</strong> to continue.</p>
                  <p style="background-image: none;"><img src="assets/help-center-5.png" alt="" style="background-image: none;"></p>
                </li>
                <li style="background-image: none;">
                  <p style="background-image: none;">Click <strong style="background-image: none;">Done</strong> to exit the walkthrough.</p>
                  <p style="background-image: none;"><img src="assets/help-center-6.png" alt="" style="background-image: none;"></p>
                  <div class="extension tip" style="background-image: none;">
                    <div style="background-image: none;">TIP</div>
                    <div style="background-image: none;">
                      <p style="background-image: none;">Exit the guide at any time by clicking <strong style="background-image: none;">Dismiss</strong>.</p>
                    </div>
                  </div>
                </li>
              </ol>
              <h3 id="whats-new" tabindex="-1" style="background-image: none;">What’s New</h3>
              <p style="background-image: none;">The What’s New tab contains the full details of Marketo Engage’s latest release.</p>
              <p style="background-image: none;"><img src="assets/help-center-7.png" alt="" style="background-image: none;"></p>
              <div class="extension tip" style="background-image: none;">
                <div style="background-image: none;">TIP</div>
                <div style="background-image: none;">
                  <p style="background-image: none;">Click the arrow icon at the bottom to view the page in Experience League.</p>
                </div>
              </div>
              <h3 id="resources" tabindex="-1" style="background-image: none;">Resources</h3>
              <p style="background-image: none;">The Resources tab gives you quick and direct access to various ways you can get additional help with your Marketo Engage instance.</p>
              <p style="background-image: none;"><img src="assets/help-center-8.png" alt="" style="background-image: none;"></p>
            </div>
            <div class="doc-pagination columns is-mobile mt-6 is-hidden" style="background-image: none;">
              <div class="column is-left-desktop" style="background-image: none;"> <a type="button" href="" class="spectrum-Button is-disabled spectrum-Button--sizeM spectrum-Button--outline spectrum-Button--accent" style="background-image: none;"> <span class="spectrum-Button-label" style="background-image: none;">Previous page</span> </a><span> </span> </div>
              <div class="column is-right-desktop" style="background-image: none;"> <a type="button" href="" class="spectrum-Button is-disabled spectrum-Button--sizeM spectrum-Button--outline spectrum-Button--accent" style="background-image: none;"> <span class="spectrum-Button-label" style="background-image: none;">Next page</span> </a><span> </span> </div>
            </div>
            <div data-id="footer" class="columns is-marginless is-margin-top-big-big is-hidden" style="background-image: none;">
              <div class="column" style="background-image: none;">
                <div class="is-flex is-vcentered" style="background-image: none;">
                  <h4 style="background-image: none;">Business.Adobe.com resources</h4> <a href="https://business.adobe.com/resources/main.html" target="_blank" style="background-image: none;">
                    <figure class="image is-32x32" style="background-image: none;"> <img src="/assets/img/link-arrow.svg" loading="lazy" alt="Docs links" style="background-image: none;"> </figure>
                  </a><span> </span>
                </div>
                <div class="links" style="background-image: none;"> </div>
              </div>
            </div>
          </div>
        </div>
        <div class="column sp-col-2 sp-pt-700 is-padded-bottom-0-mobile" data-id="other" style="background-image: none;">
          <div class="pinned" style="background-image: none;">
            <dx-docs-mt mt="false" toggle="true" togglemsg="Automatic Translation" toggleurl="/docs/contributor/contributor-guide/localization/machine-translation.html?lang=en" lang="en" visible="false" class="is-block is-hidden-mobile" style="background-image: none;"></dx-docs-mt>
            <div style="background-image: none;">
              <dx-docs-mt msg="Was the translation useful?" togglemsg="Automatic Translation" mt="false" yes="Yes" no="No" style="background-image: none;"></dx-docs-mt>
            </div>
            <div class="doc-actions" style="background-image: none;">
              <dx-bookmark style="background-image: none;"></dx-bookmark>
              <dx-link-page style="background-image: none;"></dx-link-page>
            </div>
            <h2 class="is-hidden-mobile" style="background-image: none;">On this page</h2>
            <div data-id="mtoc" class="is-hidden-mobile" style="background-image: none;"></div>
            <div class="is-margin-top-big-big is-hidden" style="background-image: none;">
              <h2 class="is-size-6 is-margin-bottom-small" style="background-image: none;">View next:</h2>
            </div>
            <div data-id="sidead" class="is-margin-top-big-big is-hidden" style="background-image: none;"> </div>
          </div>
        </div>
      </div>
      <dx-docs-feedback-bar style="background-image: none;"></dx-docs-feedback-bar>
    </div>
    <div style="background-image: none;"> </div>
  </div>
  <div class="has-text-centered" style="background-image: none;">
    <div class="spectrum-Toast spectrum-Toast--info notification animated is-hidden" style="background-image: none;">
      <figure id="toast-icon" class="spectrum-Icon spectrum-Icon--sizeM spectrum-Toast-typeIcon" focusable="false" aria-hidden="true" style="background-image: none;"> <img src="/assets/img/spectrum-info-icon.svg" loading="lazy" alt="Info" style="background-image: none;"> </figure>
      <div class="spectrum-Toast-body" style="background-image: none;">
        <div class="spectrum-Toast-content" style="background-image: none;"></div>
      </div>
      <div class="spectrum-Toast-buttons" style="background-image: none;"> <button id="dismiss" class="spectrum-ClearButton spectrum-ClearButton--overBackground spectrum-ClearButton--sizeM" style="background-image: none;">
          <div class="spectrum-ClearButton-fill" style="background-image: none;">
            <figure class="spectrum-ClearButton-icon spectrum-Icon spectrum-UIIcon-Cross100 image is-18x18" focusable="false" aria-hidden="true" style="background-image: none;"> <img src="/assets/img/close_white.svg" loading="lazy" alt="Close" style="background-image: none;"> </figure>
          </div>
        </button> </div>
    </div>
  </div>
  <div class="modal" style="background-image: none;">
    <div class="modal-background" style="background-image: none;"></div>
    <div class="modal-content has-text-centered" style="background-image: none;"></div> <button class="modal-close is-large" aria-label="close" style="background-image: none;"></button>
  </div>
</body>`
  return { md, html };
}

async function main(params) {
  aioLogger.info({ params });
  const path = params.__ow_path ? params.__ow_path : "";
  const { html, error } = await render(path, { ...params });

  if (!error) {
    return {
      statusCode: 200,
      body: html,
    };
  }

  return { statusCode: error.code, body: error.message };
}




module.exports = {
  render,
  main,
}