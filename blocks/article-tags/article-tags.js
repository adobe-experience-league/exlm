import { htmlToElement } from '../../scripts/scripts.js';
import { getMetadata } from '../../scripts/lib-franklin.js';

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

  const solutions = solutionMeta ? formatPageMetaTags(solutionMeta.content) : [];
  const roles = roleMeta ? formatPageMetaTags(roleMeta.content) : [];
  const experienceLevels = levelMeta ? formatPageMetaTags(levelMeta.content) : [];

  const decodedSolutions = solutions.map((solution) => {
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
  const decodedRoles = roles.map((role) => atob(role));
  const decodedLevels = experienceLevels.map((level) => atob(level));

  if (solutionMeta) {
    solutionMeta.content = decodedSolutions.join(';');
  }
  if (roleMeta) {
    roleMeta.content = decodedRoles.join(',');
  }
  if (levelMeta) {
    levelMeta.content = decodedLevels.join(',');
  }
}

export default function decorate(block) {
  if (
    document.documentElement.classList.contains('adobe-ue-edit') ||
    document.documentElement.classList.contains('adobe-ue-preview')
  ) {
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

  const roles = getMetadata('role');
  const experienceLevels = getMetadata('level');

  const [articleTagHeading] = [...block.children].map((row) => row.firstElementChild);

  block.textContent = '';

  const headerDiv = htmlToElement(`
    <div class="article-tags">
      <div class="article-tags-title">
        ${articleTagHeading.innerHTML}
      </div>
      <div class="article-tags-view">
        ${[solutions, roles, experienceLevels]
          .map((values) =>
            values
              .split(',')
              .filter(Boolean)
              .map((value) => `<div class="article-tags-name">${value.trim()}</div>`)
              .join(''),
          )
          .join('')}
      </div>
    </div>
  `);

  block.append(headerDiv);
}
