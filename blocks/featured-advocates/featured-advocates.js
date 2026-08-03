import { getPathDetails, htmlToElement } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { getFeaturedChampions, getRotatedChampions, getDesignationColor } from '../../scripts/utils/champion-utils.js';

function buildAssociatedContentCard(item, championName) {
  return `
    <div class="advocate-content-card">
      <div class="advocate-content-eyebrow">
        ${item.eyebrowIcon ? `<img class="advocate-content-icon" src="${item.eyebrowIcon}" alt="" loading="lazy">` : ''}
        <span>${item.contentType}</span>
      </div>
      <div class="advocate-content-title">${item.title}</div>
      ${item.description ? `<div class="advocate-content-description">${item.description}</div>` : ''}
      <div class="advocate-content-byline">By ${championName}</div>
      <div class="advocate-content-footer">
        ${item.footerIcon ? `<img class="advocate-content-icon" src="${item.footerIcon}" alt="" loading="lazy">` : ''}
        <div class="advocate-content-footer-text">${item.footerText}</div>
      </div>
      ${item.ctaHref ? `<a class="advocate-content-cta" href="${item.ctaHref}">${item.ctaLabel}</a>` : ''}
    </div>
  `;
}

function buildAdvocatePanel(champion, total) {
  const { detail, associatedContent } = champion;
  const colorClass = getDesignationColor(detail.colorSelection);
  const colorModifier = colorClass ? ` advocate-panel-${colorClass}` : '';

  return htmlToElement(`
    <div class="advocate-panel${colorModifier}">
      <div class="advocate-profile">
        <div class="advocate-image${colorClass ? ` advocate-image-${colorClass}` : ''}">
          <picture><img src="${detail.image}" alt="${detail.imageAlt}" loading="lazy"></picture>
        </div>
        <div class="advocate-info">
          ${detail.quoteBio ? `<div class="advocate-quote">${detail.quoteBio}</div>` : ''}
          <a class="advocate-name" href="${detail.communityProfileUrl}">${detail.name}</a>
          <span class="advocate-title"> – ${detail.jobTitle}</span>
          ${
            detail.productDesignation
              ? `<div class="advocate-designation${colorClass ? ` advocate-designation-${colorClass}` : ''}">${
                  detail.productDesignation
                }</div>`
              : ''
          }
          ${
            total > 1
              ? `<div class="advocate-pagination">
                  <button type="button" class="advocate-nav advocate-prev" aria-label="Previous advocate">
                    <span class="icon icon-back-arrow"></span>
                  </button>
                  <span class="advocate-pagination-count">1/${total}</span>
                  <button type="button" class="advocate-nav advocate-next" aria-label="Next advocate">
                    <span class="icon icon-front-arrow"></span>
                  </button>
                </div>`
              : ''
          }
        </div>
      </div>
      ${
        associatedContent.length
          ? `<div class="advocate-more-from">More from ${detail.name}</div>
             <div class="advocate-associated-content">
               ${associatedContent.map((item) => buildAssociatedContentCard(item, detail.name)).join('')}
             </div>`
          : ''
      }
    </div>
  `);
}

export default async function decorate(block) {
  const [titleRow, descriptionRow] = [...block.children].map((row) => row.firstElementChild);
  const title = titleRow?.textContent.trim();
  const description = descriptionRow?.innerHTML.trim();

  block.textContent = '';

  if (title || description) {
    const header = htmlToElement(`
      <div class="featured-advocates-header">
        ${title ? `<h2>${title}</h2>` : ''}
        ${description ? `<div class="featured-advocates-description">${description}</div>` : ''}
      </div>
    `);
    block.append(header);
  }

  const { lang } = getPathDetails();
  let champions = [];
  try {
    champions = await getFeaturedChampions(lang);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching featured advocates:', error);
  }
  if (!champions.length) return;

  const orderedChampions = getRotatedChampions(champions);
  const total = orderedChampions.length;

  const panelContainer = document.createElement('div');
  panelContainer.classList.add('panel-container');

  let currentIndex = 0;

  function goTo(index) {
    currentIndex = (index + total) % total;
    [...panelContainer.children].forEach((panel, i) => panel.classList.toggle('active', i === currentIndex));
    panelContainer.querySelectorAll('.advocate-pagination-count').forEach((el) => {
      el.textContent = `${currentIndex + 1}/${total}`;
    });
  }

  orderedChampions.forEach((champion, i) => {
    const panel = buildAdvocatePanel(champion, total);
    if (i === 0) panel.classList.add('active');
    panelContainer.append(panel);
  });

  if (total > 1) {
    panelContainer.addEventListener('click', (event) => {
      if (event.target.closest('.advocate-prev')) goTo(currentIndex - 1);
      else if (event.target.closest('.advocate-next')) goTo(currentIndex + 1);
    });
  }

  block.append(panelContainer);

  decorateIcons(block);
}
