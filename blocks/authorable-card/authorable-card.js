import { decorateIcons, fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';
import buildCard from '../../scripts/browse-card/browse-card.js';
import ArticleDataService from '../../scripts/data-service/article-data-service.js';
import mapResultToCardsData from './article-data-adapter.js';
import buildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';

const numberOfCards = 4;

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div > a');
  const links = [];
  const linksContainer = [];
  for(let i=0;i<=numberOfCards;i+=1){
    linksContainer.push(block.querySelector(`div:nth-child(${i+4})`))
    links.push(block.querySelector(`div:nth-child(${i+4}) > div`)?.textContent)
  }

  // Clearing the block's content
  block.classList.add('browse-cards-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
          <h4>${headingElement?.textContent.trim()}</h4>
          <div class="tooltip">
            <span class="icon icon-info"></span><span class="tooltip-text">${toolTipElement?.textContent.trim()}</span>
          </div>
      </div>
      <div>${linkTextElement?.outerHTML}</div>
    </div>
  `);


  // Appending header div to the block
  block.appendChild(headerDiv);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  const placeholders = await fetchPlaceholders();
  block.innerHTML += buildPlaceholder;
  
  links.forEach((link, i) => {
    if (link) {
      const articleDataService = new ArticleDataService();
      articleDataService
      .handleArticleDataService(link)
      .then(async (data) => {
          block.querySelectorAll('.shimmer-placeholder').forEach((el) => {
            el.remove();
          });
          linksContainer[i].innerHTML = ``;
          const cardData = await mapResultToCardsData(data, placeholders);
          buildCard(linksContainer[i], cardData);
          contentDiv.appendChild(linksContainer[i]);
          decorateIcons(block);
        })
        .catch(() => {
          block.querySelectorAll('.shimmer-placeholder').forEach((el) => {
            el.remove();
          });
        });
    }
  });
  block.innerHTML='';
  block.appendChild(contentDiv);
}