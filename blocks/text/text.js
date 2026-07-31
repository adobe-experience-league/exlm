const VALID_ALIGNMENTS = ['left', 'center', 'right', 'justify'];
const DEFAULT_ALIGNMENT = 'left';

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

    if (!content || !content.textContent.trim()) {
      row.remove();
      return;
    }

    row.classList.add('text-segment', `text-align-${alignment}`);
  });
}
