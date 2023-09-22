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
const { default: ExlClient } = require("./modules/ExlClient.js");
import md2html from './modules/md2html.js';
let aioLogger = Logger("App");


const exlClient = new ExlClient();

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

export const render = async function render(path) {
  const response = await exlClient.getArticle('recXZZxBo4pkOnx9k')
  const md = response.data.FullBody;
  const html = md2html(md)
  return { md, html };
}

export const main = async function main(params) {
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
