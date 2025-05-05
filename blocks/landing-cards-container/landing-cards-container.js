export default function decorate(block) {
  const card = document.createElement('div');
  card.innerHTML = block.innerHTML;

  // if an icon is present, create a wrapper div with the icon and title
  card.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img');

    if ((img.alt ?? '').toLowerCase().startsWith('icon')) {
      const iconParagraph = picture.closest('p');
      const titleParagraph = iconParagraph.nextElementSibling;

      iconParagraph.classList.add('icon');

      if (titleParagraph) {
        const wrapperDiv = document.createElement('div');
        wrapperDiv.classList.add('icon-content-wrapper');

        iconParagraph.parentNode.insertBefore(wrapperDiv, iconParagraph);

        wrapperDiv.appendChild(iconParagraph);
        wrapperDiv.appendChild(titleParagraph);
      }
    }
  });

  block.textContent = '';
  block.append(card);
}
