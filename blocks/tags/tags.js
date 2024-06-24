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

function formatPageMetaTags(inputString) {
  return inputString
    .replace(/exl:[^/]*\/*/g, '')
    .split(',')
    .map((part) => part.trim());
}

function decodeArticlePageMetaTags() {
  const solutionMeta = document.querySelector(`meta[name="coveo-solution"]`);
  const roleMeta = document.querySelector(`meta[name="role"]`);
  const levelMeta = document.querySelector(`meta[name="level"]`);
  const featureMeta = document.querySelector(`meta[name="feature"]`);

  const solutions = solutionMeta ? formatPageMetaTags(solutionMeta.content) : [];
  const features = featureMeta ? formatPageMetaTags(featureMeta.content) : [];
  const roles = roleMeta ? formatPageMetaTags(roleMeta.content) : [];
  const experienceLevels = levelMeta ? formatPageMetaTags(levelMeta.content) : [];
  let decodedSolutions = [];
  decodedSolutions = solutions.map((solution) => {
    // In case of sub-solutions. E.g. exl:solution/campaign/standard
    const parts = solution.split('/');
    const decodedParts = parts.map((part) => atob(part));

    // If it's a sub-solution, create a version meta tag
    if (parts.length > 1) {
      const versionMeta = document.createElement('meta');
      versionMeta.name = 'version';
      versionMeta.content = atob(parts.slice(1).join('/'));
      document.head.appendChild(versionMeta);

      // If there are multiple parts, join them with ";"
      const product = atob(parts[0]);
      const version = atob(parts[1]);
      return `${product}|${product} ${version}`;
    }

    return decodedParts[0];
  });

  const decodedFeatures = features
    .map((feature) => {
      const parts = feature.split('/');
      if (parts.length > 1) {
        const product = atob(parts[0]);
        if (!decodedSolutions.includes(product)) {
          decodedSolutions.push(product);
        }
        const featureTag = atob(parts[1]);
        return `${featureTag}`;
      }
      decodedSolutions.push(atob(parts[0]));
      return '';
    })
    .filter((feature) => feature !== '');

  const decodedRoles = roles.map((role) => atob(role));
  const decodedLevels = experienceLevels.map((level) => atob(level));

  if (solutionMeta) {
    solutionMeta.content = decodedSolutions.join(';');
  }
  if (featureMeta) {
    featureMeta.content = decodedFeatures.join(',');
  }
  if (roleMeta) {
    roleMeta.content = decodedRoles.join(',');
  }
  if (levelMeta) {
    levelMeta.content = decodedLevels.join(',');
  }
}

export default function decorate(block) {
  if (window.hlx.aemRoot) {
    decodeArticlePageMetaTags();
  }
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
      <div class="article-tags-topics-heading">
      ${TOPICS}
      </div>
        ${[solutions, features].map(createTagsHTML).join('')}
      </div>
      <div class="article-tags-createdFor">
      <div class="article-tags-createdFor-heading">
      ${CREATED_FOR}
      </div>
        ${[roles, experienceLevels].map(createTagsHTML).join('')}
      </div>
  `);

  block.append(articleTags);
}
