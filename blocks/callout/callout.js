export default function decorate(block) {
  const allDivs = Array.from(block.children);
  const fragment = document.createDocumentFragment();

  // Create cards in pairs
  for (let i = 0; i < allDivs.length; i += 2) {
    const card = document.createElement('div');
    card.className = 'callout-card';
    const descriptionDiv = allDivs[i];
    const tagDiv = allDivs[i + 1];

    if (descriptionDiv) {
      descriptionDiv.classList.add('callout-card-header');
      card.appendChild(descriptionDiv);
    }

    if (tagDiv) {
      const tag = tagDiv.textContent?.trim();
      const isExternalSource = tag?.toLowerCase() !== 'adobe';
      if (isExternalSource) {
        card.classList.add('callout-card-external');
      }
      tagDiv.classList.add('callout-card-tag');
      if (tag) {
        tagDiv.textContent = isExternalSource ? 'By You' : `By ${tag}`;
      }

      card.appendChild(tagDiv);
    }

    fragment.appendChild(card);
  }

  block.innerHTML = '';
  block.classList.add('callout-card-wrapper');
  if (fragment.childElementCount === 1) {
    block.classList.add('callout-card-wrapper-full');
  }
  block.appendChild(fragment);
}
