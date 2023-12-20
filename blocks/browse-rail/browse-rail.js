import ffetch from '../../scripts/ffetch.js';
import { getBrowsePage } from '../../scripts/scripts.js';

export default async function decorate(block) {
  /* for now just some dummy output */
  block.textContent = getBrowsePage();
  console.log(await ffetch('/query-index.json').first());
}
