const VALID_ALIGNMENTS = ['left', 'center', 'right', 'justify'];
const DEFAULT_ALIGNMENT = 'left';

/**
 * Text block — lets authors align individual text segments differently within a
 * single block (e.g. a centered sentence directly above a left-aligned paragraph),
 * avoiding one-section-per-alignment authoring and the excess spacing it causes.
 *
 * Content model (one row per segment):
 *   | alignment token (left|center|right|justify) | rich text |
 *
 * A single-cell row is treated as text at the default alignment. An unknown or
 * empty token falls back to the default. Empty segments are dropped.
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    let alignment = DEFAULT_ALIGNMENT;
    let content;

    if (cells.length >= 2) {
      const token = cells[0].textContent.trim().toLowerCase();
      if (VALID_ALIGNMENTS.includes(token)) {
        alignment = token;
      }
      [, content] = cells;
      cells[0].remove();
    } else {
      [content] = cells;
    }

    // Drop empty segments so authors don't get stray gaps.
    if (!content || !content.textContent.trim()) {
      row.remove();
      return;
    }

    row.classList.add('text-segment', `text-align-${alignment}`);
  });
}
