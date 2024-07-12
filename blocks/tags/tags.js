import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { getMetadata } from '../../scripts/lib-franklin.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const TOPICS = placeholders?.topics || 'TOPICS:';
const CREATED_FOR = placeholders?.createdFor || 'CREATED FOR:';
const PRODUCT = placeholders?.product || 'PRODUCT:';

export default function decorate(block) {
  const coveosolutions = getMetadata('coveo-solution');
  const solutions = [
    ...new Set(
      coveosolutions.split(';').map((item) => {
        const parts = item.split('|');
        return parts.length > 1 ? parts[1].trim() : item.trim();
      }),
    ),
  ].join(',');

  const features = getMetadata('feature');
  const roles = getMetadata('role');
  const experienceLevels = getMetadata('level');

  function createTagsHTML(values) {
    return values
      .split(',')
      .filter(Boolean)
      .map((value) => `<div class="article-tags-name">${value.trim()}</div>`)
      .join('');
  }

  block.textContent = '';

  const articleTags = document.createDocumentFragment();

  if (solutions) {
    const productSection = document.createElement('div');
    productSection.classList.add('article-tags-product');
    productSection.innerHTML = `
      <div class="article-tags-product-heading">
        ${PRODUCT}
      </div>
      ${createTagsHTML(solutions)}
    `;
    articleTags.appendChild(productSection);
  }

  if (features) {
    const topicsSection = document.createElement('div');
    topicsSection.classList.add('article-tags-topics');
    topicsSection.innerHTML = `
      <div class="article-tags-topics-heading">
        ${TOPICS}
      </div>
      ${createTagsHTML(features)}
    `;
    articleTags.appendChild(topicsSection);
  }

  const createdForContent = [roles, experienceLevels].filter(Boolean).map(createTagsHTML).join('');
  if (createdForContent) {
    const createdForSection = document.createElement('div');
    createdForSection.classList.add('article-tags-createdFor');
    createdForSection.innerHTML = `
      <div class="article-tags-createdFor-heading">
        ${CREATED_FOR}
      </div>
      ${createdForContent}
    `;
    articleTags.appendChild(createdForSection);
  }

  block.append(articleTags);
}
