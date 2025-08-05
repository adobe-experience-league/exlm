/**
 * Decorates the skill track block
 * @param {Element} block The skill track block element
 */
export default function decorate(block) {
  // Add container class
  block.classList.add('skill-track');

  // Get all rows
  const rows = [...block.children];

  // Process each lesson row
  rows.forEach((row) => {

    row.textContent = '';

  });
}
