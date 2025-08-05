/**
 * Decorates the skill track block
 * @param {Element} block The skill track block element
 */
export default function decorate(block) {
  // Get all rows
  const rows = [...block.children];

  rows.forEach(() => {
    block.classList.add('skill-track-step');
  });
}
