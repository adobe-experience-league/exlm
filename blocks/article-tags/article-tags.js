import { htmlToElement } from '../../scripts/scripts.js';
import { getMetadata } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const solution = getMetadata('coveo-solution');
  const role = getMetadata('role');
  const experienceLevel = getMetadata('level');

  const [articleTagHeading] = [...block.children].map((row) => row.firstElementChild);

  block.innerHTML = '';
  block.classList.add('article-tags');

  const headerDiv = htmlToElement(`
      <div class="article-tags-header">
        <div class="article-tags-title">
          ${articleTagHeading.innerHTML}
        </div>
        <div class="article-tags-view">
        ${solution
          .split(',')
          .map((value) => `<div class="article-tags-name">${value.trim()}</div>`)
          .join('')}
        ${role
          .split(',')
          .map((value) => `<div class="article-tags-name">${value.trim()}</div>`)
          .join('')}
        ${experienceLevel
          .split(',')
          .map((value) => `<div class="article-tags-name">${value.trim()}</div>`)
          .join('')}
        </div>
      </div>
    `);

  block.append(headerDiv);
}
