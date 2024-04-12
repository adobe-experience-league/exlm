import { htmlToElement } from '../../scripts/scripts.js';

export default function decorate(block) {
  // Extracting elements from the block
  const [blockQuoteTextElement] = [...block.children].map((row) => row.firstElementChild);
  block.innerHTML = '';
  // Getting the theme from the Metadata Properties
  const metaArticleTheme = document.querySelector('meta[name="article-theme"]');
  const theme = metaArticleTheme ? metaArticleTheme.getAttribute('content') : 'external';
  const headerDiv = htmlToElement(`
      <div class="block-quote-content">
        ${blockQuoteTextElement.innerHTML.trim()}
    </div>
  `);
  block.classList.add(theme);

  block.appendChild(headerDiv);
}
