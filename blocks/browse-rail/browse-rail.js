import ffetch from '../../scripts/ffetch.js';
import { isBrowsePage } from '../../scripts/scripts.js';

export default async function decorate(block) {
  /* for now just some dummy output */
  block.textContent = isBrowsePage();
  // eslint-disable-next-line no-console
  console.log(await ffetch('/query-index.json').first());
}
