import { getLastDocsSection, htmlToElement } from '../../scripts/scripts.js';

/**
 * Adobe Target Insertion point.
 * @param {HTMLDivElement} block
 */
export default function decorate(block) {
  const firstRow = block?.firstElementChild;
  const firstCell = firstRow?.firstElementChild;
  const secondCell = firstRow?.children?.length >= 1 ? firstRow?.children[1] : null;
  const wrapperId = firstCell.textContent;

  const childIds = secondCell?.children ? Array.from(secondCell?.children)?.map((child) => child.textContent) : [];

  const replacement = htmlToElement(`
    <div id="${wrapperId}">
      ${childIds?.map((id) => `<div id="${id}"></div>`).join('')}
    </div>
  `);

  block.replaceChildren(replacement);
  if (wrapperId === 'recommendation-more-help') {
    block.remove();
    const lastSection = getLastDocsSection();
    lastSection?.append(block);
  }
}
