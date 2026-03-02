import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { getConfig } from '../../scripts/scripts.js';

// Handle CTA click for jump to section links
function handleJumpLink(ctaLink) {
  const href = ctaLink.getAttribute('href');

  if (href && href.startsWith('#')) {
    ctaLink.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = href.substring(1);
      const targetElement = document.querySelector(`[data-section-id="${sectionId}"]`);
      targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

export default async function decorate(block) {
  const allDivs = [...block.children];

  const [title, description, videoFileRow, imageMobile, primaryCtaRow, secondaryCtaRow] = allDivs;

  const primaryCta = primaryCtaRow?.firstElementChild;
  const secondaryCta = secondaryCtaRow?.firstElementChild;
  const mobileImagePicture = imageMobile?.querySelector('picture');

  // Extract video source from MP4 file
  const { cdnOrigin } = getConfig();
  const videoSrc =
    videoFileRow?.querySelector('a')?.href && `${cdnOrigin}${new URL(videoFileRow.querySelector('a').href).pathname}`;

  // Build structure
  const aimMarqueeDOM = document.createRange().createContextualFragment(`
    <div class='marquee-video-full-bleed-container'>
      <div class='marquee-video-full-bleed-content'>
        <div class='marquee-video-full-bleed-title'>
          <h1>${title?.textContent || ''}</h1>
        </div>
        <div class='marquee-video-full-bleed-description'>
          ${description?.innerHTML || ''}
        </div>
        <div class='marquee-video-full-bleed-cta'>
          ${decorateCustomButtons(primaryCta, secondaryCta)}
        </div>
      </div>
      ${
        mobileImagePicture
          ? `
        <div class="marquee-video-full-bleed-image">
          ${mobileImagePicture.outerHTML}
        </div>
      `
          : ''
      }
    </div>
  `);

  block.textContent = '';
  block.append(aimMarqueeDOM);

  // Background Video for desktop view
  if (videoSrc) {
    const containerEl = block.querySelector('.marquee-video-full-bleed-container');
    const videoWrapper = document.createElement('div');
    videoWrapper.classList.add('marquee-video-full-bleed-video');

    // Create custom play/pause button for mp4 video
    const video = document.createElement('video');
    video.src = videoSrc;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;

    const pauseIcon = `<svg class="pause-icon" width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M7 5h4v14H7V5Z" fill="white"/><path d="M13 5h4v14h-4V5Z" fill="white"/></svg>`;
    const playIcon = `<svg class="play-icon" width="40" height="40" viewBox="0 0 13.512 14"><path d="M4.73,2H3.5a.5.5,0,0,0-.5.5v13a.5.5,0,0,0,.5.5H4.73a1,1,0,0,0,.5-.136L16.265,9.431a.5.5,0,0,0,0-.862L5.234,2.136A1,1,0,0,0,4.73,2Z" transform="translate(-3 -2)" fill="white"/></svg>`;

    const controlBtn = document.createElement('button');
    controlBtn.className = 'marquee-video-full-bleed-play-pause';
    controlBtn.innerHTML = pauseIcon;
    controlBtn.setAttribute('aria-label', 'Pause video');

    controlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (video.paused) {
        video.play();
        controlBtn.innerHTML = pauseIcon;
        controlBtn.setAttribute('aria-label', 'Pause video');
      } else {
        video.pause();
        controlBtn.innerHTML = playIcon;
        controlBtn.setAttribute('aria-label', 'Play video');
      }
    });

    videoWrapper.append(video, controlBtn);
    containerEl.prepend(videoWrapper);
  }

  const ctaLinks = block.querySelectorAll('.marquee-video-full-bleed-cta a');
  ctaLinks.forEach((ctaLink) => {
    handleJumpLink(ctaLink);
  });

  decorateIcons(block);
}
