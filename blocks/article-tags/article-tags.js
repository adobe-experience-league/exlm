import { htmlToElement } from '../../scripts/scripts.js';

export default function decorate(block) {
    const value1 = "Solution1, Solution2";
    const value2 = "Experience Level, Experience Level2";
    const value3 = "Role";

    const [articleTagHeading] = [...block.children].map(
      (row) => row.firstElementChild,
    );

    block.innerHTML = '';
    block.classList.add('article-tags');
  
    const headerDiv = htmlToElement(`
      <div class="article-tags-header">
        <div class="article-tags-title">
          ${articleTagHeading.innerHTML}
        </div>
        <div class="article-tags-view">
        ${value1.split(',').map(value => `<div class="article-tags-name">${value.trim()}</div>`).join('')}
        ${value2.split(',').map(value => `<div class="article-tags-name">${value.trim()}</div>`).join('')}
        ${value3.split(',').map(value => `<div class="article-tags-name">${value.trim()}</div>`).join('')}
        </div>
      </div>
    `);

    block.append(headerDiv);

    const buildCardsShimmer = new BuildPlaceholder();
    buildCardsShimmer.add(block);
}