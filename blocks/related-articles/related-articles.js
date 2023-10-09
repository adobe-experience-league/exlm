export default function decorate(block) {
  const blockHeading = document.createElement('div');
  const linksContainer = document.createElement('ul');
  linksContainer.classList.add('related-article-links');

  [...block.children].forEach((row, i) => {
    if (i === 0) blockHeading.innerHTML = row.textContent;
    else {
      const link = document.createElement('li');
      link.appendChild(row.querySelector('a'));
      linksContainer.appendChild(link);
    }
  });
  block.innerHTML = '';
  block.appendChild(blockHeading);
  block.appendChild(linksContainer);
}
