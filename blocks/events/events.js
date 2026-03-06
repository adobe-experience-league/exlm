import { createTag } from '../../scripts/scripts.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';

const getText = (cell) => (cell?.textContent ?? '').trim();

const DESKTOP_BREAKPOINT = '(min-width: 600px)';

export const debounce = (ms, fn) => {
  let timer;
  // eslint-disable-next-line func-names
  return function (...args) {
    const ctx = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(ctx, args);
    }, ms);
  };
};

function parseListItemCells(cells) {
  const cellArr = [...(cells ?? [])];
  const [tagText, date, type, title, desc] = cellArr.splice(0, 5).map(getText);
  const url = cellArr.pop()?.querySelector('a')?.href?.trim() ?? '';
  return { tagText, date, type, title, desc, url };
}

export default function decorate(block) {
  const [blockEyebrowDiv, blockTitleDiv, blockDescDiv, featuredRow, ...itemRows] = [...block.children];

  const blockEyebrowText = getText(blockEyebrowDiv);
  const blockTitle = getText(blockTitleDiv);
  const blockDescription = getText(blockDescDiv);
  const featuredEventCells = [...(featuredRow?.children ?? [])];
  const [tagText, dateText, eventTypeText, title, description] = featuredEventCells.splice(0, 5).map(getText);
  const [imgCell, ctaContainer] = featuredEventCells;

  const imageAlt = imgCell?.querySelector('img')?.getAttribute('alt') ?? '';
  if (ctaContainer) {
    const link = ctaContainer.querySelector('a');
    const titleAttr = link?.getAttribute('title')?.trim();
    if (link && titleAttr && !/^https?:\/\//i.test(titleAttr)) {
      link.textContent = titleAttr;
    }
  }
  const ctaHtml = ctaContainer ? decorateCustomButtons(ctaContainer) : '';
  const featuredMediaHtml =
    (imgCell?.querySelector('picture') ?? featuredRow?.querySelector('picture'))?.outerHTML ?? '';
  const featuredUrl = (ctaContainer?.querySelector('a')?.getAttribute('href') ?? '').trim();

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

  let featuredTitleHtml = '';
  if (title) {
    featuredTitleHtml = featuredUrl
      ? `<h3 class="events-featured-title"><a href="${featuredUrl.replace(
          /"/g,
          '&quot;',
        )}" class="events-item-title-link">${title}</a></h3>`
      : `<h3 class="events-featured-title">${title}</h3>`;
  }

  const featuredInnerHtml = `
    <div class="events-featured-content">
      <div class="events-featured-header">
        ${tagText ? `<span class="events-featured-tag">${tagText}</span>` : ''}
        ${metaLine ? `<span class="events-featured-meta">${metaLine}</span>` : ''}
      </div>
      ${featuredTitleHtml}
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
      ${item.tagText ? `<span class="events-featured-tag">${item.tagText}</span>` : ''}
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

  function updateGlassBg() {
    const isDesktop = window.matchMedia(DESKTOP_BREAKPOINT).matches;
    contentWrapper.classList.toggle('glass-bg', isDesktop);
    const featured = block.querySelector('.events-featured');
    const items = block.querySelectorAll('.events-item');
    [featured, ...items].filter(Boolean).forEach((el) => {
      el.classList.toggle('glass-bg', !isDesktop);
    });
  }

  updateGlassBg();

  const resizeObserver = new ResizeObserver(debounce(150, updateGlassBg));
  resizeObserver.observe(block);

  if (featuredMediaHtml && imageAlt) {
    block.querySelector('.events-featured-media img')?.setAttribute('alt', imageAlt);
  }
}
