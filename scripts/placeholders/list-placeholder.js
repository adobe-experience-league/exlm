import { loadCSS } from '../lib-franklin.js';
import { htmlToElement } from '../scripts.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/placeholders/list-placeholder.css`);

function listPlaceholder(count = 4) {
  const container = htmlToElement('<div class="list-placeholder-wrapper"><div/>');
  const loaders = [];

  for (let i = 0; i < count; i += 1) {
    loaders.push(
      htmlToElement(`
      <div class="list-item">
        <div class="line"></div>
      </div>
    `),
    );
  }

  container.append(...loaders);

  return container;
}

export default listPlaceholder;
