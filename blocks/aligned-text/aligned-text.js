const VALID_ALIGNMENTS = ['left', 'center', 'right'];

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const textCell = row.firstElementChild;
    if (!textCell || !textCell.textContent.trim()) {
      row.remove();
      return;
    }

    const alignCell = row.children[1];
    const explicit = alignCell?.textContent?.trim().toLowerCase();
    const alignment = VALID_ALIGNMENTS.includes(explicit) ? explicit : 'left';

    textCell.classList.add('text-line', `text-align-${alignment}`);
    alignCell?.remove();
  });
}
