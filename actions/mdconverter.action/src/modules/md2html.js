/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const mdast2hast = import('mdast-util-to-hast').toHast;
const defaultHandlers = import('mdast-util-to-hast').defaultHandlers;
const raw = import('hast-util-raw').raw;
const remarkGridTable = import('@adobe/remark-gridtables');
const mdast2hastGridTablesHandler = import('@adobe/mdast-util-gridtables').mdast2hastGridTablesHandler;
const TYPE_TABLE = import('@adobe/mdast-util-gridtables').TYPE_TABLE;
const toHtml = import('hast-util-to-html').toHtml;
const rehypeFormat = import('rehype-format');
const unified = import('unified');
const remarkParse = import('remark-parse');
const remarkGfm = import('remark-gfm');
const createPageBlocks = import('@adobe/helix-html-pipeline/src/steps/create-page-blocks.js');
const h = import('hastscript').h;
const fixSections = import('@adobe/helix-html-pipeline/src/steps/fix-sections.js');

module.exports = function md2html(md) {
  // note: we could use the entire unified chain, but it would need to be async -
  // which would require too much of a change
  const mdast = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkGridTable)
    .parse(md.trim());

  const main = mdast2hast(mdast, {
    handlers: {
      ...defaultHandlers,
      [TYPE_TABLE]: mdast2hastGridTablesHandler(),
    },
    allowDangerousHtml: true,
  });

  const content = {
    hast: main
  };

  fixSections({ content });
  createPageBlocks({ content });

  const hast = h('html', [
    h('body', [
      h('header', []),
      h('main', content.hast),
      h('footer', [])]),
  ]);

  raw(hast);
  rehypeFormat()(hast);

  return toHtml(hast, {
    upperDoctype: true,
  });
}
