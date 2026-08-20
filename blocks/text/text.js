const VALID_ALIGNMENTS = ['left', 'center', 'right'];

function resolveAlignment(row, textCell) {
  const alignCell = row.children[1];
  const explicit = alignCell?.textContent?.trim().toLowerCase();
  if (VALID_ALIGNMENTS.includes(explicit)) return explicit;

  // Fall back to an inline text-align style authored directly on the rich text
  // (e.g. via the rich text editor's alignment toolbar) when no explicit cell is set.
  const styledEl = textCell.querySelector('[style*="text-align"]') || textCell;
  const inline = styledEl.style?.textAlign;
  if (VALID_ALIGNMENTS.includes(inline)) return inline;

  return 'left';
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const textCell = row.firstElementChild;
    if (!textCell || !textCell.textContent.trim()) {
      row.remove();
      return;
    }

    const alignment = resolveAlignment(row, textCell);
    textCell.classList.add('text-line', `text-align-${alignment}`);
    row.children[1]?.remove();
  });
}
