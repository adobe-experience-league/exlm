import { decorateIcons } from '../../scripts/lib-franklin.js';
import decorateCustomButtons from '../../scripts/utils/button-utils.js';
import { getLocalizedVideoUrl } from '../../scripts/utils/video-utils.js';
import { getPathDetails } from '../../scripts/scripts.js';

const getDefaultEmbed = (url) => `
  <div class="video-frame" style="position: absolute; inset: 0; width: 100%; height: 100%;">
    <iframe 
      src="${new URL(url).href}"
      style="border: 0; width: 100%; height: 100%;"
      allowfullscreen
      allow="encrypted-media; autoplay"
      title="Content from ${new URL(url).hostname}"
      loading="lazy"></iframe>
  </div>`;

/**
 * Smooth scroll to a section on the page
 * @param {string} targetId - The ID of the target section (without #)
 */
function scrollToSection(targetId) {
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}

/**
 * Handle CTA click for jump links
 * @param {HTMLAnchorElement} ctaLink - The CTA link element
 */
function handleJumpLink(ctaLink) {
  const href = ctaLink.getAttribute('href');

  // Check if it's a jump link (starts with #)
  if (href && href.startsWith('#')) {
    ctaLink.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = href.substring(1); // Remove the # symbol
      scrollToSection(sectionId);
    });
  }
}

export default async function decorate(block) {
  const { lang = 'en' } = getPathDetails() || {};

  // Extract properties from block structure
  const allDivs = [...block.querySelectorAll(':scope > div > div')];

  let title;
  let description;
  let primaryCta;
  let secondaryCta;
  let videoDesktop;
  let imageMobile;

  // Parse block content - expect 6 rows
  if (allDivs.length >= 6) {
    [title, description, primaryCta, secondaryCta, videoDesktop, imageMobile] = allDivs;
  } else if (allDivs.length >= 4) {
    // Fallback if only 4 rows provided (no video/image)
    [title, description, primaryCta, secondaryCta] = allDivs;
  }

  const titleText = title?.textContent?.trim() || '';
  const descriptionHTML = description?.innerHTML?.trim() || '';
  const primaryCtaLink = primaryCta?.querySelector('a');
  const secondaryCtaLink = secondaryCta?.querySelector('a');
  const videoUrl = videoDesktop?.querySelector('a')?.href?.trim() || '';
  const mobileImagePicture = imageMobile?.querySelector('picture');

  // Get localized video URL if video is provided
  let localizedVideoUrl = '';
  if (videoUrl) {
    localizedVideoUrl = await getLocalizedVideoUrl(videoUrl, lang);
  }

  // Build DOM structure
  const aimMarqueeDOM = document.createRange().createContextualFragment(`
    <div class='aim-marquee-container'>
      <div class='aim-marquee-content'>
        <div class='aim-marquee-title'>${titleText}</div>
        <div class='aim-marquee-description'>${descriptionHTML}</div>
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

  // Clear block and append new structure
  block.textContent = '';
  block.append(aimMarqueeDOM);

  // Add video iframe if video URL is provided (same as marquee.js)
  if (localizedVideoUrl) {
    const container = block.querySelector('.aim-marquee-container');

    const embedWrapper = document.createElement('div');
    embedWrapper.classList.add('aim-marquee-video');
    embedWrapper.innerHTML = getDefaultEmbed(localizedVideoUrl);

    container.prepend(embedWrapper);
  }

  // Setup jump link functionality for CTAs
  const ctaLinks = block.querySelectorAll('.aim-marquee-cta a');
  ctaLinks.forEach((ctaLink) => {
    handleJumpLink(ctaLink);
  });

  // Decorate icons if any
  decorateIcons(block);
}
