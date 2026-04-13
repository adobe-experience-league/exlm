import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { getMetadata } from '../../scripts/lib-franklin.js';
import isFeatureEnabled from '../../scripts/utils/feature-flag-utils.js';

function getPreferredMetadata(tqMetaKey, locLegacyMetaKey, legacyMetaKey) {
  return getMetadata(tqMetaKey) || getMetadata(locLegacyMetaKey) || getMetadata(legacyMetaKey);
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const coveosolutions = getMetadata('coveo-solution');
  let solutions;
  let roles;
  let features;
  let experienceLevels;

  if (isFeatureEnabled('isV2TagsEnabled')) {
    solutions =
      [
        ...new Set(
          coveosolutions.split(';').map((item) => {
            const parts = item.split('|');
            return parts.length > 1 ? parts[1].trim() : item.trim();
          }),
        ),
      ].join(',') || getMetadata('product_v1');

    features = getPreferredMetadata('feature', 'feature_v1');
    roles = getPreferredMetadata('role', 'role_v1');
    experienceLevels = getPreferredMetadata('level', 'level_v1');
  } else {
    solutions =
      [
        ...new Set(
          coveosolutions.split(';').map((item) => {
            const parts = item.split('|');
            return parts.length > 1 ? parts[1].trim() : item.trim();
          }),
        ),
      ].join(',') || getMetadata('product_v2');

    features = getPreferredMetadata('loc-legacy-feature', 'feature', 'feature_v2');
    roles = getPreferredMetadata('loc-legacy-role', 'role', 'role_v2');
    experienceLevels = getPreferredMetadata('loc-legacy-level', 'level', 'level_v2');
  }

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
        ${placeholders?.tagsBlockProducts || 'PRODUCTS:'}
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
        ${placeholders?.topics || 'TOPICS:'}
      </div>
      ${createTagsHTML(features)}
    `;
    articleTags.appendChild(topicsSection);
  }

  const createdForContent = [roles, experienceLevels].filter(Boolean).map(createTagsHTML).join('');
  if (createdForContent) {
    const createdForSection = document.createElement('div');
    createdForSection.classList.add('article-tags-createdfor');
    createdForSection.innerHTML = `
      <div class="article-tags-createdfor-heading">
        ${placeholders?.createdFor || 'CREATED FOR:'}
      </div>
      ${createdForContent}
    `;
    articleTags.appendChild(createdForSection);
  }

  block.append(articleTags);
}
