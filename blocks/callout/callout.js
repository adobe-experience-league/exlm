import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }
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
        tagDiv.textContent = isExternalSource ? placeholders?.articleExternalTag : `By ${tag}`;
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
