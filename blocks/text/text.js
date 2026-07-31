const VALID_ALIGNMENTS = new Set(['left', 'center', 'right']);

export default function decorate(block) {
  const rows = [...block.children];
  block.innerHTML = '';

  rows.forEach((row) => {
    const [alignCell, contentCell] = [...row.children];
    const content = contentCell?.innerHTML?.trim();
    if (!content) return;

    const alignment = alignCell?.textContent?.trim().toLowerCase();
    const textAlign = VALID_ALIGNMENTS.has(alignment) ? alignment : 'left';

    const wrapper = document.createElement('div');
    wrapper.className = 'text-row';
    wrapper.dataset.align = textAlign;
    wrapper.innerHTML = content;
    block.appendChild(wrapper);
  });
}
