/* eslint-disable no-plusplus */
import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';

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

export default async function decorate(block) {
  // Extract properties
  // always same order as in model, empty string if not set
  const [customBgColor, img, eyebrow, title, longDescr, firstCta, firstCtaLinkType, secondCta, secondCtaLinkType] =
    block.querySelectorAll(':scope div > div');

  const subjectPicture = img.querySelector('picture');
  const isStraightVariant = block.classList.contains('straight');
  const bgColorCls = [...block.classList].find((cls) => cls.startsWith('bg-'));
  const bgColor = bgColorCls ? `var(--${bgColorCls.substr(3)})` : `#${customBgColor?.textContent?.trim() || 'FFFFFF'}`;
  const eyebrowText = eyebrow?.textContent?.trim();

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
          ${
            subjectPicture
              ? `<div class='marquee-subject' style="background-color: ${bgColor}">${subjectPicture.outerHTML}</div>`
              : `<div class='marquee-spacer'></div>`
          } 
      <div class="marquee-background-fill">
      ${
        !isStraightVariant
          ? `
          <svg xmlns="http://www.w3.org/2000/svg" width="755.203" height="606.616" viewBox="0 0 755.203 606.616">
            <path
              id="Path_1"
              data-name="Path 1"
              d="M739.5-1.777s-23.312,140.818,178.8,258.647c70.188,40.918,249.036,104.027,396.278,189.037,102.6,59.237,98.959,158.932,98.959,158.932h79.913l.431-606.616Z"
              transform="translate(-738.685 1.777)"
              fill="${bgColor}"
            />
          </svg>`
          : ' '
      }
      </div>
      <div class="marquee-bg-filler" style="background-color: ${bgColor}"></div>

      </div>
    </div>
    </div>
  `);

  block.textContent = '';

  if (!subjectPicture) {
    block.classList.add('no-subject');
  }

  if (block.classList.contains('fill-background')) {
    block.style.backgroundColor = bgColor;
  }

  block.append(marqueeDOM);

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
