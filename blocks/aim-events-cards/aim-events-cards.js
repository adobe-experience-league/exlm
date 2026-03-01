import decorateCustomButtons from '../../scripts/utils/button-utils.js';

export default function decorate(block) {
  const rows = [...block.children];
  const [
    blockTitleRow,
    blockDescriptionRow,
    blockCtaRow,
    titleRow,
    descriptionRow,
    imageRow,
    dateTextRow,
    tagRow,
    eventTypeRow,
    ctaRow,
    ...itemRows
  ] = rows;

  const getText = (cell) => (cell?.innerHTML ?? cell?.textContent ?? '').trim();
  const blockTitle = getText(blockTitleRow?.firstElementChild);
  const blockDescription = getText(blockDescriptionRow?.firstElementChild);

  const titleCell = titleRow?.firstElementChild;
  const descriptionCell = descriptionRow?.firstElementChild;
  const imageCell = imageRow?.firstElementChild;
  const dateTextCell = dateTextRow?.firstElementChild;
  const tagCell = tagRow?.firstElementChild;
  const eventTypeCell = eventTypeRow?.firstElementChild;
  const ctaCell = ctaRow?.firstElementChild;
  const blockCtaCell = blockCtaRow?.firstElementChild;

  const ctaHtml = ctaCell ? decorateCustomButtons(ctaCell) : '';
  const blockCtaHtml = blockCtaCell ? decorateCustomButtons(blockCtaCell) : '';

  const picture = imageCell?.querySelector('picture');
  const title = titleCell?.innerHTML || '';
  const description = descriptionCell?.innerHTML || '';
  const imageAlt = imageCell?.querySelector('img')?.getAttribute('alt') || '';
  const dateText = dateTextCell?.textContent?.trim() || '';
  const tag = tagCell?.textContent?.trim() || '';
  const eventType = eventTypeCell?.textContent?.trim() || '';

  const metaParts = [dateText, eventType].filter(Boolean);
  const metaLine = metaParts.length ? metaParts.join(' • ') : '';

  const headerHtml =
    blockTitle || blockDescription
      ? `
    <div class="aim-events-cards-header">
      ${blockTitle ? `<h2 class="aim-events-cards-header-title">${blockTitle}</h2>` : ''}
      ${blockDescription ? `<div class="aim-events-cards-header-description">${blockDescription}</div>` : ''}
    </div>
  `
      : '';

  const featuredHtml = `
    <div class="aim-events-cards-featured">
      <div class="aim-events-cards-featured-content">
        <div class="aim-events-cards-featured-header">
          ${tag ? `<span class="aim-events-cards-featured-tag">${tag}</span>` : ''}
          ${metaLine ? `<span class="aim-events-cards-featured-meta">${metaLine}</span>` : ''}
        </div>
        ${title ? `<h3 class="aim-events-cards-featured-title">${title}</h3>` : ''}
        ${description ? `<div class="aim-events-cards-featured-description">${description}</div>` : ''}
        ${ctaHtml ? `<div class="aim-events-cards-featured-cta">${ctaHtml}</div>` : ''}
      </div>
      <div class="aim-events-cards-featured-media">${picture ? picture.outerHTML : ''}</div>
    </div>
  `;

  // Remove only the first 10 config rows so item rows stay in the block (preserves UE parent-child)
  const configRows = rows.slice(0, 10);
  configRows.forEach((row) => row.remove());

  block.classList.add('aim-events-cards-block');

  if (headerHtml) {
    block.insertAdjacentHTML('afterbegin', headerHtml);
  }

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'aim-events-cards-content';
  contentWrapper.insertAdjacentHTML('beforeend', featuredHtml);

  const listWrapper = document.createElement('div');
  listWrapper.className = 'aim-events-cards-list';

  (itemRows || []).forEach((row) => {
    if (!row?.parentElement) return;
    const cells = [...row.children];
    const values = cells.map((c) => (c?.innerHTML ?? c?.textContent ?? '').trim());
    const [itemTag = '', itemDate = '', itemType = '', itemTitle = '', itemDesc = ''] = values;
    const hasContent = itemTag || itemDate || itemType || itemTitle || itemDesc;
    if (!hasContent) return;
    if (!itemTitle && !itemDesc) return;
    const itemMetaParts = [itemDate, itemType].filter(Boolean);
    const itemMetaLine = itemMetaParts.length ? itemMetaParts.join(' • ') : '';
    const itemHtml = `
      ${itemTag ? `<span class="aim-events-cards-featured-tag">${itemTag}</span>` : ''}
      ${itemMetaLine ? `<span class="aim-events-cards-featured-meta">${itemMetaLine}</span>` : ''}
      ${itemTitle ? `<div class="aim-events-cards-item-title">${itemTitle}</div>` : ''}
      ${itemDesc ? `<div class="aim-events-cards-item-description">${itemDesc}</div>` : ''}
    `;
    row.className = 'aim-events-cards-item';
    row.innerHTML = itemHtml;
    listWrapper.appendChild(row);
  });

  contentWrapper.appendChild(listWrapper);

  if (blockCtaHtml) {
    const blockCtaWrapper = document.createElement('div');
    blockCtaWrapper.className = 'aim-events-cards-block-cta';
    blockCtaWrapper.innerHTML = blockCtaHtml;
    contentWrapper.appendChild(blockCtaWrapper);
  }

  block.appendChild(contentWrapper);

  if (picture && imageAlt) {
    const img = block.querySelector('.aim-events-cards-featured-media img');
    if (img) img.setAttribute('alt', imageAlt);
  }
}
