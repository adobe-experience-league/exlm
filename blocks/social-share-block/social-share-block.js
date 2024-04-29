import { htmlToElement } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const socialDiv = block.firstElementChild;
  const socialNetworks = socialDiv.textContent.split(',').map((network) => network.trim());

  block.textContent = '';

  const socialLinks = {
    Facebook: `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`,
    'X (formerly Twitter)': `https://twitter.com/intent/tweet?url=${window.location.href}`,
    LinkedIn: `https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}`,
  };

  const socialIcons = {
    Facebook: 'fb-social-icon',
    LinkedIn: 'li-social-icon',
    'X (formerly Twitter)': 'x-social-icon',
  };

  const headerDiv = htmlToElement(`
    <div class="social-share-block">
    <div class="social-share-title">
      ${'SHARE ON SOCIAL'}
    </div>
    <div class="social-share-view">
      ${socialNetworks
        .map(
          (network) => `<a href="${socialLinks[network]}" target="_blank">
      <div class="social-share-item">
      <span class="icon icon-${socialIcons[network]}"></span></span><span class="social-share-name">${network}</span>
      </div>
      </a>`,
        )
        .join('')}
    </div>
    </div>
  `);

  block.append(headerDiv);
  decorateIcons(block);
}
