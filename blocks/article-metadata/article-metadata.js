export default function decorate(block) {
  const lastUpdateElement = block.querySelector('.article-metadata-wrapper > div > div > div');
  const lastUpdateText = lastUpdateElement.textContent.trim();
  const datePattern = /Last update: (.+)/;
  const match = lastUpdateText.match(datePattern);
  const lastUpdateDate = match ? match[1] : '';
  const lastUpdateISO = new Date(lastUpdateDate).toISOString();
  const date = new Date(lastUpdateISO);
  const formatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  // FIXME: Revisit this implementation and add support for multiple locales
  const formattedDate = date.toLocaleDateString('en-US', formatOptions);
  lastUpdateElement.innerHTML = `Last update: ${formattedDate}`;
}
