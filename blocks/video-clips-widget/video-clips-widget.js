import { fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

function openVideoModal(block, placeholders, videoUrl, sourceUrl, sourcePageTitle) {
  document.body.style.overflow = 'hidden';

  let modal = block.querySelector('.video-modal-wrapper');
  let iframeContainer;

  if (!modal) {
    modal = document.createElement('div');
    modal.classList.add('video-modal-wrapper');

    const modalContent = document.createElement('div');
    modalContent.classList.add('video-modal-container');

    const closeBtn = document.createElement('span');
    closeBtn.classList.add('icon', 'icon-close-light');
    closeBtn.addEventListener('click', () => {
      document.body.style.overflow = '';
      modal.style.display = 'none';
      if (iframeContainer) iframeContainer.innerHTML = '';
    });

    iframeContainer = document.createElement('div');
    iframeContainer.classList.add('video-modal');

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(iframeContainer);
    modal.appendChild(modalContent);
    decorateIcons(modal);
    block.appendChild(modal);
  } else {
    iframeContainer = modal.querySelector('.video-modal');
    modal.style.display = 'flex';
  }

  if (iframeContainer && videoUrl) {
    iframeContainer.innerHTML = `<iframe src="${videoUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    iframeContainer.appendChild(
      htmlToElement(`<div class="video-meta">
          <p class="clipped-from">${placeholders?.clippedFrom || 'Clipped from'} <em>${sourcePageTitle}</em></p>
          <a class="watch-full-video" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${
            placeholders?.watchFullVideo || 'Watch full video'
          }</a>
        </div>`),
    );
  }
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }
  const firstRow = block.querySelector(':scope > div'); // only the first direct div

  if (firstRow) {
    const heading = firstRow.querySelector(':scope > *'); // get the first element inside firstRow

    if (heading) {
      const newHeadingWrapper = document.createElement('div');
      newHeadingWrapper.className = 'video-clips-heading';

      // Add only one icon
      const icon = document.createElement('span');
      icon.className = 'icon icon-Smock_VideoOutline_18_N';

      newHeadingWrapper.appendChild(icon);
      newHeadingWrapper.appendChild(heading); // move heading in before replacing

      block.replaceChild(newHeadingWrapper, firstRow);
    }
  }

  [...block.children].forEach((row) => {
    const [titleEl, videoUrlEl, sourceUrlEl, sourceTitleEl] = row.children;

    const title = titleEl?.textContent?.trim();
    const videoUrl = videoUrlEl?.querySelector('a')?.href;
    const sourceUrl = sourceUrlEl?.querySelector('a')?.href;
    const sourcePageTitle = sourceTitleEl?.textContent?.trim();

    if (!title || !videoUrl || !sourceUrl) return;

    const cleanTitle = title.replace(/\s*\(\d+ min\)/, '');

    // Clear the row and rebuild it
    row.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'video-clip';

    card.innerHTML = `
      <div class="icon-wrapper">
        <span class="icon icon-play-outline"></span>
      </div>
      <div class="text-wrapper">
          <a href="#" class="video-modal-trigger">${cleanTitle}</a>
        </div>
      </div>
    `;

    card.querySelector('.video-modal-trigger').addEventListener('click', (e) => {
      e.preventDefault();
      openVideoModal(block, placeholders, videoUrl, sourceUrl, sourcePageTitle);
    });

    row.appendChild(card);
  });

  decorateIcons(block);
}
