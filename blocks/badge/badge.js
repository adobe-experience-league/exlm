export default function decorate(block) {
  const wrapper = block.closest('.badge-wrapper');
  const firstChildDiv = block.querySelector('div:nth-child(1) > div');
  const secondChildDiv = block.querySelector('div:nth-child(2) > div');
  const anchorElement = firstChildDiv.querySelector('a');
  const classes = block.getAttribute('class');

  let content = '';

  if (firstChildDiv) {
    const firstDivContent = firstChildDiv.textContent.trim();
    const titleAttribute = secondChildDiv
      ? `title="${secondChildDiv.textContent.trim()}"`
      : '';

    if (anchorElement) {
      const href = anchorElement.getAttribute('href');
      const key = '#_blank';
      if (href.includes(key)) {
        const parts = href.split(key);
        const url = parts[0];
        content = `<a href="${url}" class="${classes}" target="_blank" ${titleAttribute}>${firstDivContent}</a>`;
      } else {
        content = `<a href="${href}" class="${classes}" ${titleAttribute}>${firstDivContent}</a>`;
      }
    } else {
      content = `<div class="${classes}" ${titleAttribute}>${firstDivContent}</div>`;
    }
  }

  wrapper.innerHTML = content;
}
