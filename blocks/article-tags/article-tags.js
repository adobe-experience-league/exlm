import { htmlToElement } from '../../scripts/scripts.js';
import { getMetadata } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const solutions = getMetadata('coveo-solution');
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
