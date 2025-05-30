/* eslint-disable no-plusplus */
import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { htmlToElement } from '../../scripts/scripts.js';

const getDefaultEmbed = (url, { autoplay = false } = {}) => `
  <div class="video-frame" style="position: absolute; inset: 0; width: 100%; height: 100%;">
    <iframe 
      src="${new URL(url).href + (autoplay ? '?autoplay=true' : '')}"
      style="border: 0; width: 100%; height: 100%;"
      allowfullscreen
      allow="encrypted-media; autoplay"
      title="Content from ${new URL(url).hostname}"
      loading="lazy"></iframe>
  </div>`;

function handleVideoLinks(videoLinkElems, block) {
  videoLinkElems.forEach((videoLinkElem) => {
    const videoLink = videoLinkElem.getAttribute('href');
    videoLinkElem.setAttribute('href', '#');
    videoLinkElem.removeAttribute('target');

    // Add play icon
    const playIcon = document.createElement('span');
    playIcon.classList.add('icon', 'icon-play');
    videoLinkElem.prepend(playIcon);
    decorateIcons(videoLinkElem);

    // Create modal
    const modal = document.createElement('div');
    modal.classList.add('modal');
    const closeIcon = document.createElement('span');
    closeIcon.classList.add('icon', 'icon-close-light');
    modal.appendChild(closeIcon);
    decorateIcons(modal);
    modal.style.display = 'none';
    block.append(modal);

    // Event listeners
    videoLinkElem.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      if (!modal.querySelector('iframe')) {
        const iframeContainer = document.createElement('div');
        iframeContainer.classList.add('iframe-container');
        iframeContainer.innerHTML = `<iframe src="${videoLink}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        modal.append(iframeContainer);
      }
    });

    modal.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.removeAttribute('style');
      modal.querySelector('.iframe-container').remove();
    });
  });
}

const getMpcVideoDetailsByUrl = (url) =>
  new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('format', 'json');

      fetch(urlObj.href)
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Error while fetching URL:', error);
          resolve(undefined);
        });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to process the URL:', error);
      reject(new Error(`Failed to process the URL: ${error?.message}`));
    }
  });

function handleSigninLinks(block) {
  import('../../scripts/auth/profile.js')
    .then((module) => module.isSignedInUser())
    .then((isSignedInUser) => {
      if (!isSignedInUser) {
        block.classList.add('unauthenticated');
        block.querySelectorAll('.signin').forEach((signIn) => {
          signIn.addEventListener('click', (e) => {
            e.preventDefault();
            window.adobeIMS.signIn();
          });
        });
      }
    });
}
function createPlayButton() {
  return htmlToElement(`
    <button aria-label="play" class="video-overlay-play-button marquee-play-button">
      <div class="video-overlay-play-circle">
        <div class="play-triangle"></div>
      </div>
    </button>`);
}

function addPlayButton(container, videoUrl, bgContainer) {
  const playButton = createPlayButton();
  playButton.addEventListener('click', (e) => {
    e.stopPropagation();
    container.innerHTML = getDefaultEmbed(videoUrl, { autoplay: true });
  });

  container.appendChild(playButton);
  bgContainer.prepend(container);
}

export default async function decorate(block) {
  // Extract properties
  const allDivs = [...block.querySelectorAll(':scope > div')];
  let customBgColor;
  let videoLinkWrapper;
  let img;
  let eyebrow;
  let title;
  let longDescr;
  let firstCta;
  let firstCtaLinkType;
  let secondCta;
  let secondCtaLinkType;

  if (allDivs[1]?.querySelector('picture')) {
    [customBgColor, img, eyebrow, title, longDescr, firstCta, firstCtaLinkType, secondCta, secondCtaLinkType] = allDivs;
  } else {
    [
      customBgColor,
      videoLinkWrapper,
      img,
      eyebrow,
      title,
      longDescr,
      firstCta,
      firstCtaLinkType,
      secondCta,
      secondCtaLinkType,
    ] = allDivs;
  }

  const subjectPicture = img?.querySelector('picture');
  const isVideoVariant = block.classList.contains('video');
  const videoUrl = videoLinkWrapper?.querySelector('a')?.href?.trim();
  const isStraightVariant = block.classList.contains('straight');
  const isLargeVariant = block.classList.contains('large');
  const marqueeVideoVariant = isVideoVariant && isLargeVariant && isStraightVariant;
  const bgColorCls = [...block.classList].find((cls) => cls.startsWith('bg-'));
  const bgColor = bgColorCls ? `var(--${bgColorCls.substr(3)})` : `#${customBgColor?.textContent?.trim() || 'FFFFFF'}`;
  const eyebrowText = eyebrow?.textContent?.trim() || '';

  // Build DOM
  const marqueeDOM = document.createRange().createContextualFragment(`
    <div class='marquee-content-container'>
    <div class='marquee-foreground'>
      <div class='marquee-text'>
        ${eyebrowText !== '' ? `<div class='marquee-eyebrow'>${eyebrowText?.toUpperCase()}</div>` : ``}
        <div class='marquee-title'>${title.innerHTML}</div>
        <div class='marquee-long-description'>${longDescr.innerHTML}</div>
        <div class='marquee-cta'>
          ${decorateCustomButtons(firstCta, secondCta)}
        </div>
      </div>
      </div>
      <div class='marquee-background' ${isStraightVariant ? `style="background-color: ${bgColor}"` : ''}>
        <div class='marquee-background-fill'>
          ${
            !isStraightVariant && !marqueeVideoVariant
              ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="755.203" height="606.616" viewBox="0 0 755.203 606.616">
              <path
                d="M739.5-1.777s-23.312,140.818,178.8,258.647c70.188,40.918,249.036,104.027,396.278,189.037,102.6,59.237,98.959,158.932,98.959,158.932h79.913l.431-606.616Z"
                transform="translate(-738.685 1.777)"
                fill="${bgColor}"
              />
            </svg>`
              : ''
          }
        </div>
      <div class="marquee-bg-filler" style="background-color: ${bgColor}"></div>
    </div>
    </div>
  `);

  function appendSubjectPicture(container, pictureEl, color) {
    const bgContainer = container.querySelector('.marquee-background');
    const bgFill = bgContainer.querySelector('.marquee-background-fill');
    const subjectEl = document.createElement('div');
    subjectEl.classList.add('marquee-subject');
    subjectEl.style.backgroundColor = color;
    subjectEl.append(pictureEl);
    if (bgFill) {
      bgFill.after(subjectEl);
    } else {
      bgContainer.prepend(subjectEl);
    }
  }

  if (!marqueeVideoVariant) {
    block.classList.remove('video');
  }

  block.textContent = '';
  block.append(marqueeDOM);

  if (isVideoVariant && videoUrl) {
    const bgFillerEl = block.querySelector('.marquee-bg-filler');
    if (bgFillerEl) bgFillerEl.style.display = 'none';

    const bgContainer = block.querySelector('.marquee-background');
    bgContainer.style.position = 'relative';

    const subjectEl = document.createElement('div');
    subjectEl.classList.add('marquee-subject');
    subjectEl.style.backgroundColor = bgColor;
    subjectEl.style.position = 'relative';
    subjectEl.style.width = '100%';
    subjectEl.style.height = '100%';

    getMpcVideoDetailsByUrl(videoUrl)
      .then((videoDetails) => {
        const posterUrl = videoDetails?.video?.poster;

        if (posterUrl) {
          const imgEl = document.createElement('img');
          imgEl.classList.add('marquee-video-poster');
          imgEl.src = posterUrl;
          imgEl.alt = videoDetails?.title || 'Video thumbnail';
          subjectEl.appendChild(imgEl);
        }

        addPlayButton(subjectEl, videoUrl, bgContainer);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error loading video details:', error);
        addPlayButton(subjectEl, videoUrl, bgContainer);
      });
  } else if (subjectPicture) {
    appendSubjectPicture(block, subjectPicture, bgColor);
  } else {
    block.classList.add('no-subject');
  }

  if (block.classList.contains('fill-background')) {
    block.style.backgroundColor = bgColor;
  }

  if (!((firstCta && firstCtaLinkType) || (secondCta && secondCtaLinkType))) {
    return; // Exit early if no CTA or link type is present
  }

  const isVideoLinkType =
    firstCtaLinkType?.textContent?.trim() === 'video' || secondCtaLinkType?.textContent?.trim() === 'video';
  const isSigninLinkType =
    firstCtaLinkType?.textContent?.trim() === 'signin' || secondCtaLinkType?.textContent?.trim() === 'signin';

  function addCtaClass(ctaType, selector) {
    const ctaText = ctaType?.textContent?.trim();
    if (ctaText === 'video' || ctaText === 'signin') {
      block.querySelector(selector).classList.add(ctaText);
    }
  }

  addCtaClass(firstCtaLinkType, '.marquee-cta > a:first-child');
  addCtaClass(secondCtaLinkType, '.marquee-cta > a:last-child');

  if (isSigninLinkType) {
    handleSigninLinks(block);
  }

  if (isVideoLinkType) {
    const videoLinkElems = block.querySelectorAll('.marquee-cta > .video');
    handleVideoLinks(videoLinkElems, block);
  }
}
