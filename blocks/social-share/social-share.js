import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

function getObjectById(obj, ID) {
  return obj.find((option) => option.id === ID);
}

export default function decorate(block) {
  const socialDiv = block.firstElementChild;
  const socialNetworks = socialDiv.textContent.split(',').map((network) => network.trim());

  block.textContent = '';

  const socialData = [
    {
      id: 'facebook',
      icon: 'fb-social-icon',
      url: `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`,
    },
    {
      id: 'twitter',
      icon: 'x-social-icon',
      url: `https://twitter.com/intent/tweet?url=${window.location.href}`,
    },
    {
      id: 'linkedin',
      icon: 'li-social-icon',
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}`,
    },
  ];

  const headerDiv = htmlToElement(`
    <div class="social-share-container">
      <div class="social-share-title">
        ${placeholders.shareOnSocial}
      </div>
      <div class="social-share-view">
        ${socialNetworks
          .map((network) => {
            const socialInfo = getObjectById(socialData, network);
            if (socialInfo) {
              const label = socialInfo.id.charAt(0).toUpperCase() + socialInfo.id.slice(1);
              return `
                <a class="social-share-item" href="${socialInfo.url}" target="_blank">
                  <span class="icon icon-${socialInfo.icon}"></span>
                  <span class="social-share-name">${placeholders[`socialShare${label}`]}</span>
                </a>`;
            }
            return '';
          })
          .join('')}
      </div>
    </div>
  `);

  block.append(headerDiv);
  decorateIcons(block);
}
