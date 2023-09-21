#!/usr/bin/env node
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

// this script is used instead of individual webpack-config.js configurations per action,
// as these would require additional dependencies (e.g. loaders) to be installed as dev
// dependency on the application level.

import * as url from "node:url";
import * as path from "node:path";
import { fork } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";

// read all directories, for those that have a webpack executable, run it with --mode production
const webpackArgs = ["--mode", "production"];
const dirname = url.fileURLToPath(new URL(".", import.meta.url));
const children = await readdir(dirname, { withFileTypes: true });


await Promise.all(
  children
    .filter((child) => child.name.endsWith("action")) // only folder ending with `action`
    .filter((child) => child.isDirectory) // only directories
    .map(async (child) => {
      const childDir = path.resolve(dirname, child.name);
      const webpackScript = path.resolve(childDir, "node_modules/.bin/webpack");
      if (existsSync(webpackScript)) {
        return new Promise((resolve, reject) => {
          // run the webpack script in the childDir
          // eslint-disable-next-line no-console
          console.log(`Bundling ${child.name} ... `);
          const webpackProcess = fork(webpackScript, webpackArgs, {
            cwd: childDir,
            silent: false,
          });
          webpackProcess.on("error", (err) => reject(err));
          webpackProcess.on("exit", (code) => {
            if (code > 0) {
              reject(code);
            } else {
              resolve();
            }
          });
        }).catch((err) => {
          // eslint-disable-next-line no-console
          console.log(`Failed bundling ${child.name}.`);
          throw err;
        });
      }

      return Promise.resolve();
    })
);
