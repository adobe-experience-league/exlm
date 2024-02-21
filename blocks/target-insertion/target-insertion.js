/**
 * Adobe Target Insertion point.
 * @param {HTMLDivElement} block
 */
export default function decorate(block) {
  const id = block?.firstElementChild?.firstElementChild?.textContent;
  block.id = id;
  block.innerHTML = '';
}
