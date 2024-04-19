import { htmlToElement } from '../../scripts/scripts.js';

export default function decorate(block) {
    const value1 = "Solution";
    const value2 = "Experience Level";
    const value3 = "Role";

    const [tagElement] = [...block.children].map(
      (row) => row.firstElementChild,
    );

    block.innerHTML = '';
    block.classList.add('article-tags');
  
    const headerDiv = htmlToElement(`
      <div class="article-tags-header">
        <div class="article-tags-title">
          ${tagElement.innerHTML}
        </div>
        <div class="article-tags-view">
        <div class="article-tags-name">${value1}</div>
        <div class="article-tags-name">${value2}</div>
        <div class="article-tags-name">${value3}</div>
        </div>
      </div>
    `);

    block.append(headerDiv);

    const buildCardsShimmer = new BuildPlaceholder();
    buildCardsShimmer.add(block);
  }
  