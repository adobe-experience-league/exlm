import { getConfig } from '../../scripts/scripts.js';

function generateFilteredEventURL(filterType, label, baseURL) {
  const filterMap = {
    product: 'f-el_product',
    series: 'f-el_event_series',
  };

  const key = filterType?.toLowerCase();
  const mappedFilter = filterMap[key];

  if (!mappedFilter) {
    return baseURL;
  }
  return `${baseURL}#${mappedFilter}=${encodeURIComponent(label)}`;
}

export default function decorate(block) {
  const pTags = block.querySelectorAll('.at-a-glance-wrapper p');

  const { cdnOrigin } = getConfig();

  pTags.forEach((p) => {
    const text = p.textContent;
    const [label, values] = text.split(':');

    if (!values) return;

    const items = values.split(',').map((v) => v.trim());

    // Clear existing <p> content
    p.textContent = `${label}: `;

    items.forEach((value, index) => {
      const a = document.createElement('a');
      a.textContent = value;
      a.href = generateFilteredEventURL(label, value, `${cdnOrigin}/en/test-folder/events`);
      a.target = '_blank';
      p.appendChild(a);
      if (index < items.length - 1) {
        p.appendChild(document.createTextNode(' '));
      }
    });
  });
}
