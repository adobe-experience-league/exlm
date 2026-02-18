import { decorateIcons } from '../../scripts/lib-franklin.js';

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
  // Extract properties from block structure
  const allDivs = [...block.querySelectorAll(':scope > div > div')];

  let title;
  let description;
  let primaryCta;
  let secondaryCta;
  let videoDesktop;
  let imageMobile;

  // Parse block content based on structure
  if (allDivs.length >= 6) {
    [title, description, primaryCta, secondaryCta, videoDesktop, imageMobile] = allDivs;
  } else if (allDivs.length >= 4) {
    [title, description, primaryCta, secondaryCta] = allDivs;
  }

  const titleText = title?.textContent?.trim() || '';
  const descriptionText = description?.innerHTML?.trim() || '';
  const primaryCtaLink = primaryCta?.querySelector('a');
  const secondaryCtaLink = secondaryCta?.querySelector('a');
  const videoUrl = videoDesktop?.querySelector('a')?.href || '';
  const mobileImage = imageMobile?.querySelector('picture');

  // Get title type from block metadata or default to h1
  const titleType = block.dataset.titleType || block.getAttribute('data-title-type') || 'h1';

  // Build DOM structure
  const aimMarqueeDOM = document.createRange().createContextualFragment(`
    <div class="aim-marquee-container">
      <div class="aim-marquee-background">
        ${
          videoUrl
            ? `
          <div class="aim-marquee-video-wrapper">
            <video class="aim-marquee-video" autoplay loop muted playsinline>
              <source src="${videoUrl}" type="video/mp4">
            </video>
          </div>
        `
            : ''
        }
        ${
          mobileImage
            ? `
          <div class="aim-marquee-image-mobile">
            ${mobileImage.outerHTML}
          </div>
        `
            : ''
        }
        <div class="aim-marquee-overlay"></div>
      </div>
      <div class="aim-marquee-content">
        <${titleType} class="aim-marquee-title">${titleText}</${titleType}>
        <div class="aim-marquee-description">${descriptionText}</div>
        <div class="aim-marquee-cta-container">
          ${
            primaryCtaLink
              ? `
            <a href="${primaryCtaLink.href}" class="aim-marquee-cta primary">
              ${primaryCtaLink.textContent}
            </a>
          `
              : ''
          }
          ${
            secondaryCtaLink
              ? `
            <a href="${secondaryCtaLink.href}" class="aim-marquee-cta secondary">
              ${secondaryCtaLink.textContent}
            </a>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `);

  // Clear block and append new structure
  block.textContent = '';
  block.append(aimMarqueeDOM);

  // Setup jump link functionality for CTAs
  const primaryCtaElement = block.querySelector('.aim-marquee-cta.primary');
  const secondaryCtaElement = block.querySelector('.aim-marquee-cta.secondary');

  if (primaryCtaElement) {
    handleJumpLink(primaryCtaElement);
  }

  if (secondaryCtaElement) {
    handleJumpLink(secondaryCtaElement);
  }

  // Decorate icons if any
  decorateIcons(block);
}
