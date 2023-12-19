import { fetchIndex, getBrowsePage } from '../../scripts/scripts.js';

export default async function decorate(block) {
  /* for now just some dummy output */
  block.textContent = getBrowsePage();
  const index = await fetchIndex();
  block.append(index);
}
