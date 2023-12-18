import { getBrowsePage } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* for now just some dummy output */
  block.textContent = getBrowsePage();
}
