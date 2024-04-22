import { htmlToElement } from '../../scripts/scripts.js';
import { getMetadata } from '../../scripts/lib-franklin.js';
export default function decorate(block) {
  const solutions = getMetadata('coveo-solution');
  const roles = getMetadata('role');
  const experienceLevels = getMetadata('level');

  const [articleTagHeading] = [...block.children].map((row) => row.firstElementChild);

  block.innerHTML = '';
  block.classList.add('article-tags');

  const headerDiv = htmlToElement(`
      <div class="article-tags">
        <div class="article-tags-title">
          ${articleTagHeading.innerHTML}
        </div>
        <div class="article-tags-view">
        ${solutions
          .split(',')
          .filter(Boolean)
          .map((value) => `<div class="article-tags-name">${value.trim()}</div>`)
          .join('')}
        ${roles
          .split(',')
          .filter(Boolean)
          .map((value) => `<div class="article-tags-name">${value.trim()}</div>`)
          .join('')}
        ${experienceLevels
          .split(',')
          .filter(Boolean)
          .map((value) => `<div class="article-tags-name">${value.trim()}</div>`)
          .join('')}
        </div>
      </div>
    `);

  block.append(headerDiv);
}
