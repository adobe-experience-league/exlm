/**
 * Decorates the module block
 * @param {Element} block The module block element
 */
export default function decorate(block) {
  // Get all rows
  const rows = [...block.children];

  rows.forEach(() => {
    block.classList.add('module-step');
  });
}
