import { getPathDetails, htmlToElement } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import {
  getFeaturedChampions,
  getRotatedChampions,
  getContentTypeIcon,
  getTimeCommitmentIcon,
} from '../../scripts/utils/champion-utils.js';

function buildAssociatedContentCard(item) {
  const contentTypeIcon = getContentTypeIcon(item.contentType);
  const timeIcon = getTimeCommitmentIcon(item.timeIcon);

  return `
    <div class="advocate-content-card">
      <div class="advocate-content-eyebrow">
        ${contentTypeIcon ? `<span class="icon icon-${contentTypeIcon}"></span>` : ''}
        <span>${item.contentType}</span>
      </div>
      <div class="advocate-content-title">${item.title}</div>
      ${item.description ? `<p class="advocate-content-description">${item.description}</p>` : ''}
      <div class="advocate-content-time">
        ${timeIcon ? `<span class="icon icon-${timeIcon}"></span>` : ''}
        <span>${item.timeText}</span>
      </div>
      ${item.ctaHref ? `<a class="advocate-content-cta" href="${item.ctaHref}">${item.ctaLabel}</a>` : ''}
    </div>
  `;
}

function buildAdvocatePanel(champion) {
  const { detail, associatedContent } = champion;

  return htmlToElement(`
    <div class="advocate-panel">
      <div class="advocate-profile">
        <div class="advocate-image">
          <picture><img src="${detail.image}" alt="${detail.imageAlt}" loading="lazy"></picture>
        </div>
        <div class="advocate-info">
          ${detail.eyebrow ? `<div class="advocate-eyebrow">${detail.eyebrow}</div>` : ''}
          ${detail.quoteBio ? `<p class="advocate-quote">${detail.quoteBio}</p>` : ''}
          <a class="advocate-name" href="${detail.communityProfileUrl}">${detail.name}</a>
          <div class="advocate-title">${detail.jobTitle}</div>
          ${detail.productDesignation ? `<div class="advocate-designation">${detail.productDesignation}</div>` : ''}
          ${detail.ctaHref ? `<a class="button advocate-cta" href="${detail.ctaHref}">${detail.ctaLabel}</a>` : ''}
        </div>
      </div>
      ${
        associatedContent.length
          ? `<div class="advocate-associated-content">${associatedContent.map(buildAssociatedContentCard).join('')}</div>`
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

  const panelContainer = document.createElement('div');
  panelContainer.classList.add('panel-container');

  const paginationContainer = document.createElement('div');
  paginationContainer.classList.add('pagination-container');

  let currentIndex = 0;

  function goTo(index) {
    currentIndex = (index + orderedChampions.length) % orderedChampions.length;
    [...panelContainer.children].forEach((panel, i) => panel.classList.toggle('active', i === currentIndex));
    [...paginationContainer.children].forEach((dot, i) => {
      dot.classList.toggle('selected', i === currentIndex);
      if (i === currentIndex) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  orderedChampions.forEach((champion, i) => {
    const panel = buildAdvocatePanel(champion);
    if (i === 0) panel.classList.add('active');
    panelContainer.append(panel);

    if (orderedChampions.length > 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.classList.add('pagination-dot');
      dot.setAttribute('aria-label', `Go to advocate ${i + 1}`);
      if (i === 0) {
        dot.classList.add('selected');
        dot.setAttribute('aria-current', 'true');
      }
      dot.addEventListener('click', () => goTo(i));
      paginationContainer.append(dot);
    }
  });

  const carouselWrapper = document.createElement('div');
  carouselWrapper.classList.add('carousel-wrapper');
  carouselWrapper.append(panelContainer);
  block.append(carouselWrapper);

  if (orderedChampions.length > 1) {
    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.classList.add('carousel-nav', 'carousel-prev');
    prevButton.setAttribute('aria-label', 'Previous advocate');
    prevButton.innerHTML = '<span class="icon icon-back-arrow"></span>';
    prevButton.addEventListener('click', () => goTo(currentIndex - 1));

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.classList.add('carousel-nav', 'carousel-next');
    nextButton.setAttribute('aria-label', 'Next advocate');
    nextButton.innerHTML = '<span class="icon icon-front-arrow"></span>';
    nextButton.addEventListener('click', () => goTo(currentIndex + 1));

    carouselWrapper.append(prevButton, nextButton);
    block.append(paginationContainer);
  }

  decorateIcons(block);
}
