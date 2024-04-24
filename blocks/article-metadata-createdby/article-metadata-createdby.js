/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  if (!block.textContent.trim()) {
    block.remove(); // causes CLS issues
  }
}
