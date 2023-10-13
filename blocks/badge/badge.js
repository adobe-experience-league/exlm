export default function decorate(block) {
  const wrapper = block.closest('.badge-wrapper');
  const firstChildDiv = block.querySelector('div:nth-child(1) > div');
  const secondChildDiv = block.querySelector('div:nth-child(2) > div');
  const anchorElement = firstChildDiv.querySelector('.button.primary');
  const classes = block.getAttribute('class');

  let content = '';

  if (firstChildDiv) {
    const firstDivContent = firstChildDiv.textContent.trim();
    const titleAttribute = secondChildDiv
      ? `title="${secondChildDiv.textContent.trim()}"`
      : '';

    if (anchorElement) {      
      const href = anchorElement.getAttribute('href');
      const parts = href.split('#');
      const target = parts.length > 1 ? parts[1] : '';
      content = `<a href="${href}" class="${classes}" ${titleAttribute} ${target}>${firstDivContent}</a>`;
    } else {
      content = `<div class="${classes}" ${titleAttribute}>${firstDivContent}</div>`;
    }
  }

  wrapper.innerHTML = content;
}
 