import { fetchLanguagePlaceholders, getPathDetails } from '../../scripts/scripts.js';

export default async function decorate(block) {
  // create actions div, which is always present after this block.
  const actionsDiv = document.createElement('div');
  actionsDiv.classList.add('doc-actions-mobile');
  block.parentNode.insertBefore(actionsDiv, block.nextSibling);

  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }
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
  lastUpdateElement.innerHTML = `${placeholders?.lastUpdate} ${formattedDate}`;
}
