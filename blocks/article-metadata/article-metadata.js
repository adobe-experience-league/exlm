import { createPlaceholderSpan, getPathDetails } from '../../scripts/scripts.js';

export default function decorate(block) {
  // create actions div, which is always present after this block.
  const actionsDiv = document.createElement('div');
  actionsDiv.classList.add('doc-actions-mobile');
  block.parentNode.insertBefore(actionsDiv, block.nextSibling);
  const lastUpdateElement = block.querySelector('.article-metadata-wrapper > div > div > div');
  const lastUpdateText = lastUpdateElement.textContent.trim();
  const datePattern = /Last update: (.+)/;
  const match = lastUpdateText.match(datePattern);
  const lastUpdateDate = match ? match[1] : '';
  const lastUpdateISO = new Date(lastUpdateDate).toISOString();
  const date = new Date(lastUpdateISO);
  const formatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const { lang } = getPathDetails();
  const formattedDate = date.toLocaleDateString(lang, formatOptions);
  const lastUpdateSpan = createPlaceholderSpan('lastUpdate', 'Last Update');
  const dateSpan = document.createElement('span');
  dateSpan.textContent = ` ${formattedDate}`;
  lastUpdateElement.innerHTML = '';
  lastUpdateElement.appendChild(lastUpdateSpan);
  lastUpdateElement.appendChild(dateSpan);
}
