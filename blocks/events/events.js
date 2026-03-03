import { createTag } from '../../scripts/scripts.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';

const getText = (cell) => (cell?.textContent ?? '').trim();

const getLink = (cell) => cell?.querySelector('a')?.getAttribute('href') ?? getText(cell) ?? '';

function parseListItemCells(cells) {
  const [tagCell, dateCell, typeCell, titleCell, descCell, urlCell] = [...(cells ?? [])];
  return {
    tag: getText(tagCell),
    date: getText(dateCell),
    type: getText(typeCell),
    title: getText(titleCell),
    desc: getText(descCell),
    url: getLink(urlCell).trim(),
  };
}

export default function decorate(block) {
  const [blockEyebrowDiv, blockTitleDiv, blockDescDiv, featuredRow, ...itemRows] = [...block.children];

  const blockEyebrowText = getText(blockEyebrowDiv?.firstElementChild);
  const blockTitle = getText(blockTitleDiv?.firstElementChild);
  const blockDescription = getText(blockDescDiv?.firstElementChild);

  const [tagCell, dateCell, typeCell, titleCell, descCell, , imgCell, ctaCell] = [...(featuredRow?.children ?? [])];

  const tag = getText(tagCell);
  const dateText = getText(dateCell);
  const eventTypeText = getText(typeCell);
  const title = getText(titleCell);
  const description = getText(descCell);
  const picture = imgCell?.querySelector('picture') ?? featuredRow?.querySelector('picture');
  const imageAlt = imgCell?.querySelector('img')?.getAttribute('alt') ?? '';
  const ctaContainer = ctaCell ?? null;
  if (ctaContainer) {
    const link = ctaContainer.querySelector('a');
    const titleAttr = link?.getAttribute('title')?.trim();
    if (link && titleAttr && !/^https?:\/\//i.test(titleAttr)) {
      link.textContent = titleAttr;
    }
  }
  const ctaHtml = ctaContainer ? decorateCustomButtons(ctaContainer) : '';
  const featuredMediaHtml = picture ? picture.outerHTML : '';

  const metaLine = [dateText, eventTypeText].filter(Boolean).join(' • ');

  const headerHtml =
    blockEyebrowText || blockTitle || blockDescription
      ? `
    <div class="events-header">
      ${blockEyebrowText ? `<div class="events-header-eyebrow">${blockEyebrowText}</div>` : ''}
      ${blockTitle ? `<h2 class="events-header-title">${blockTitle}</h2>` : ''}
      ${blockDescription ? `<div class="events-header-description">${blockDescription}</div>` : ''}
    </div>
  `
      : '';

  const featuredInnerHtml = `
    <div class="events-featured-content">
      <div class="events-featured-header">
        ${tag ? `<span class="events-featured-tag">${tag}</span>` : ''}
        ${metaLine ? `<span class="events-featured-meta">${metaLine}</span>` : ''}
      </div>
      ${title ? `<h3 class="events-featured-title">${title}</h3>` : ''}
      ${description ? `<div class="events-featured-description">${description}</div>` : ''}
      ${ctaHtml ? `<div class="events-featured-cta">${ctaHtml}</div>` : ''}
    </div>
    <div class="events-featured-media">${featuredMediaHtml}</div>
  `;

  [blockEyebrowDiv, blockTitleDiv, blockDescDiv].forEach((el) => el?.remove());

  block.classList.add('events-block');
  if (headerHtml) block.insertAdjacentHTML('afterbegin', headerHtml);

  const contentWrapper = createTag('div', { class: 'events-content' });
  if (featuredRow) {
    featuredRow.innerHTML = featuredInnerHtml;
    featuredRow.className = 'events-featured';
    contentWrapper.appendChild(featuredRow);
  }

  const listWrapper = createTag('div', { class: 'events-list' });

  itemRows.forEach((row) => {
    if (!row?.parentElement) return;
    const item = parseListItemCells(row.children);
    const itemMetaLine = [item.date, item.type].filter(Boolean).join(' • ');
    const titleContent =
      item.title && item.url
        ? `<a href="${item.url.replace(/"/g, '&quot;')}" class="events-item-title-link">${item.title}</a>`
        : item.title;

    const itemHtml = `
      ${item.tag ? `<span class="events-featured-tag">${item.tag}</span>` : ''}
      ${itemMetaLine ? `<span class="events-featured-meta">${itemMetaLine}</span>` : ''}
      ${titleContent ? `<div class="events-item-title">${titleContent}</div>` : ''}
      ${item.desc ? `<div class="events-item-description">${item.desc}</div>` : ''}
    `;
    row.className = 'events-item';
    row.innerHTML = itemHtml;
    listWrapper.appendChild(row);
  });

  contentWrapper.appendChild(listWrapper);
  block.appendChild(contentWrapper);

  if (featuredMediaHtml && imageAlt) {
    block.querySelector('.events-featured-media img')?.setAttribute('alt', imageAlt);
  }
}
