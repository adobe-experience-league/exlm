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

import fetch from "node-fetch";
import md2html from "./modules/md2html.js";
import Logger from "@adobe/aio-lib-core-logging";
let aioLogger = Logger("App");

function addExtensionIfNotExists(str, ext) {
  if (!str.endsWith(ext)) {
    return str + ext;
  }
  return str;
}

export async function render(path, params) {
  const url = new URL(path, "https://raw.githubusercontent.com");
  const mdUrl = addExtensionIfNotExists(url.toString(), ".md");
  const resp = await fetch(mdUrl);

  if (!resp.ok) {
    return { error: { code: resp.status, message: resp.statusText } };
  }

  const md = await resp.text();
  const html = md2html(md);
  return { md, html };
}

export async function main(params) {
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
