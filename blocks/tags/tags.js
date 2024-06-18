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

  const articleTags = document.createRange().createContextualFragment(`
      <div class="article-tags-topics">
      ${TOPICS}
        ${[solutions, features].map(createTagsHTML).join('')}
      </div>
      <div class="article-tags-createdFor">
      ${CREATED_FOR}
        ${[roles, experienceLevels].map(createTagsHTML).join('')}
      </div>
  `);

  block.append(articleTags);
}
