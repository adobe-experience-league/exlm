export default function decorate(block) {
  const wrapper = block.closest('.badge-wrapper');
  const firstChildDiv = block.querySelector('div:nth-child(1) > div');
  const secondChildDiv = block.querySelector('div:nth-child(2) > div');
  const anchorElement = firstChildDiv?.querySelector('a');
  const classes = block.getAttribute('class');

  try {
    if (firstChildDiv) {
      const firstDivContent = firstChildDiv.textContent.trim();
      const titleAttribute = secondChildDiv
        ? `title="${secondChildDiv.textContent.trim()}"`
        : '';

      if (anchorElement) {
        const href = anchorElement.getAttribute('href');

        if (href) {
          const key = '#_blank';
          const url = href.includes(key) ? href.split(key)[0] : href;
          wrapper.innerHTML = `<a href="${url}" class="${classes}" target="_blank" ${titleAttribute}>${firstDivContent}</a>`;
        } else {
          wrapper.innerHTML = `<div class="${classes}" ${titleAttribute}>${firstDivContent}</div>`;
        }
      } else {
        wrapper.innerHTML = `<div class="${classes}" ${titleAttribute}>${firstDivContent}</div>`;
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error | Badge ::', error);
  }
}
