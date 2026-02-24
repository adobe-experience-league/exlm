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
  const allDivs = [...block.children];

  const [
    title,
    description,
    videoTypeRow,
    videoFileRow,
    videoUrlRow,
    imageMobile,
    primaryCtaRow,
    secondaryCtaRow,
    themeRow,
  ] = allDivs;

  const isMP4 = videoTypeRow?.textContent?.trim() === 'mp4';
  const theme = themeRow?.textContent?.trim() || '';

  const primaryCta = primaryCtaRow?.firstElementChild;
  const secondaryCta = secondaryCtaRow?.firstElementChild;
  const mobileImagePicture = imageMobile?.querySelector('picture');

  // Extract video source based on type
  const isLocalhost = window.location.hostname.includes('localhost');
  const origin = isLocalhost ? 'https://experienceleague-dev.adobe.com' : window.location.origin;

  const videoSrc = isMP4
    ? videoFileRow?.querySelector('a')?.href && `${origin}${new URL(videoFileRow.querySelector('a').href).pathname}`
    : videoUrlRow?.querySelector('a')?.href?.trim() || '';

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
  if (theme) block.classList.add(theme);

  // Background Video for desktop view
  if (videoSrc) {
    const { lang = 'en' } = getPathDetails() || {};
    const containerEl = block.querySelector('.aim-marquee-container');
    const videoWrapper = document.createElement('div');
    videoWrapper.classList.add('aim-marquee-video');

    if (isMP4) {
      // Create custom play/pause button for mp4 video
      const video = document.createElement('video');
      video.src = videoSrc;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;

      const pauseIcon = `<svg class="pause-icon" width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M7 5h4v14H7V5Z" fill="white"/><path d="M13 5h4v14h-4V5Z" fill="white"/></svg>`;
      const playIcon = `<svg class="play-icon" width="40" height="40" viewBox="0 0 13.512 14"><path d="M4.73,2H3.5a.5.5,0,0,0-.5.5v13a.5.5,0,0,0,.5.5H4.73a1,1,0,0,0,.5-.136L16.265,9.431a.5.5,0,0,0,0-.862L5.234,2.136A1,1,0,0,0,4.73,2Z" transform="translate(-3 -2)" fill="white"/></svg>`;

      const controlBtn = document.createElement('button');
      controlBtn.className = 'aim-marquee-play-pause';
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
