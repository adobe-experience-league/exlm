import { getBrowsePage } from '../../scripts/scripts.js';

export default function decorate(block) {
  block.textContent = getBrowsePage();
}
