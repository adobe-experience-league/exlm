import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { getLocalizedVideoUrl } from '../../scripts/utils/video-utils.js';
import { getPathDetails } from '../../scripts/scripts.js';

const getDefaultEmbed = (url) => `
  <div class="video-frame">
    <iframe 
      src="${url}"
      style="border: 0; width: 100%; height: 100%;"
      allowfullscreen
      allow="encrypted-media; autoplay"
      title="Content from ${new URL(url).hostname}"
      loading="lazy"></iframe>
  </div>`;

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
  const [title, description, primaryCtaRow, secondaryCtaRow, videoDesktop, imageMobile] = [...block.children];

  const primaryCta = primaryCtaRow?.firstElementChild;
  const secondaryCta = secondaryCtaRow?.firstElementChild;

  const videoSrc = videoDesktop?.querySelector('a')?.href?.trim() || '';
  const mobileImagePicture = imageMobile?.querySelector('picture');

  // Build structure
  const aimMarqueeDOM = document.createRange().createContextualFragment(`
    <div class='aim-marquee-container'>
      <div class='aim-marquee-content'>
        <div class='aim-marquee-title'>
          ${title?.innerHTML || ''}
        </div>
        <div class='aim-marquee-description'>
          ${description?.innerHTML || ''}
        </div>
        <div class='aim-marquee-cta'>
          ${decorateCustomButtons(primaryCta, secondaryCta)}
        </div>
      </div>
      ${
        mobileImagePicture
          ? `
        <div class="aim-marquee-image">
          ${mobileImagePicture.outerHTML}
        </div>
      `
          : ''
      }
    </div>
  `);

  block.textContent = '';
  block.append(aimMarqueeDOM);

  // Background Video (MP4 or Embed)
  if (videoSrc) {
    const { lang = 'en' } = getPathDetails() || {};
    const containerEl = block.querySelector('.aim-marquee-container');
    const videoWrapper = document.createElement('div');
    videoWrapper.classList.add('aim-marquee-video');

    const isMP4 = videoSrc.endsWith('.mp4');

    if (isMP4) {
      // MP4 video with play/pause button
      const video = document.createElement('video');
      Object.assign(video, {
        src: videoSrc,
        autoplay: true,
        muted: true,
        loop: true,
      });

      const icons = {
        pause: `<svg class="pause-icon" width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M7 5h4v14H7V5Z" fill="white"/><path d="M13 5h4v14h-4V5Z" fill="white"/></svg>`,
        play: `<svg class="play-icon" width="40" height="40" viewBox="0 0 13.512 14"><path d="M4.73,2H3.5a.5.5,0,0,0-.5.5v13a.5.5,0,0,0,.5.5H4.73a1,1,0,0,0,.5-.136L16.265,9.431a.5.5,0,0,0,0-.862L5.234,2.136A1,1,0,0,0,4.73,2Z" transform="translate(-3 -2)" fill="white"/></svg>`,
      };

      const controlBtn = document.createElement('button');
      controlBtn.className = 'aim-marquee-play-pause';
      controlBtn.innerHTML = icons.pause;
      controlBtn.setAttribute('aria-label', 'Pause video');

      controlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isPaused = video.paused;
        video[isPaused ? 'play' : 'pause']();
        controlBtn.innerHTML = icons[isPaused ? 'pause' : 'play'];
        controlBtn.setAttribute('aria-label', `${isPaused ? 'Pause' : 'Play'} video`);
      });

      videoWrapper.append(video, controlBtn);
    } else {
      // Embed video iframe for mpc video
      const locVideoUrl = await getLocalizedVideoUrl(videoSrc, lang);
      videoWrapper.innerHTML = getDefaultEmbed(locVideoUrl);
    }

    containerEl.prepend(videoWrapper);
  }

  const ctaLinks = block.querySelectorAll('.aim-marquee-cta a');
  ctaLinks.forEach((ctaLink) => {
    handleJumpLink(ctaLink);
  });

  decorateIcons(block);
}
