import { htmlToElement } from '../../scripts/scripts.js';

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
    Facebook: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16">
    <defs>
      <clipPath id="clip-path">
        <rect id="Rectangle_378454" data-name="Rectangle 378454" width="16" height="16" fill="none"/>
      </clipPath>
    </defs>
    <g id="Group_446190" data-name="Group 446190" clip-path="url(#clip-path)">
      <path id="Path_749659" data-name="Path 749659" d="M15.854,7.927a7.927,7.927,0,1,0-9.842,7.694V10.349H4.377V7.927H6.012V6.883c0-2.7,1.221-3.949,3.87-3.949a8.74,8.74,0,0,1,1.723.2v2.2c-.187-.02-.512-.03-.916-.03-1.3,0-1.8.492-1.8,1.772v.857h2.589l-.445,2.422H8.887V15.8a7.928,7.928,0,0,0,6.967-7.869" transform="translate(0 0.145)" fill="#0866ff"/>
      <path id="Path_749660" data-name="Path 749660" d="M144.708,99.963l.445-2.422h-2.589v-.857c0-1.28.5-1.772,1.8-1.772.4,0,.729.01.916.03v-2.2a8.74,8.74,0,0,0-1.723-.2c-2.649,0-3.87,1.251-3.87,3.949v1.044h-1.635v2.422h1.635v5.271a7.972,7.972,0,0,0,2.875.175V99.963Z" transform="translate(-133.677 -89.468)" fill="#fff"/>
    </g>
  </svg>
  `,
    LinkedIn: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16">
    <defs>
      <clipPath id="clip-path">
        <rect id="Rectangle_378455" data-name="Rectangle 378455" width="16" height="16" fill="none"/>
      </clipPath>
    </defs>
    <g id="Group_446192" data-name="Group 446192" clip-path="url(#clip-path)">
      <path id="Path_749661" data-name="Path 749661" d="M14.816,0H1.18A1.168,1.168,0,0,0,0,1.154V14.845A1.168,1.168,0,0,0,1.18,16H14.816A1.171,1.171,0,0,0,16,14.845V1.154A1.17,1.17,0,0,0,14.816,0" transform="translate(0)" fill="#006aa8"/>
      <path id="Path_749662" data-name="Path 749662" d="M55.7,59.827h2.375v7.635H55.7Zm1.188-3.8a1.376,1.376,0,1,1-1.377,1.376,1.376,1.376,0,0,1,1.377-1.376" transform="translate(-53.33 -53.828)" fill="#fff"/>
      <path id="Path_749663" data-name="Path 749663" d="M158.6,147.95h2.275v1.044h.033a2.493,2.493,0,0,1,2.245-1.233c2.4,0,2.847,1.581,2.847,3.637v4.187h-2.373v-3.713c0-.885-.015-2.025-1.233-2.025-1.235,0-1.423.965-1.423,1.961v3.776H158.6Z" transform="translate(-152.363 -141.952)" fill="#fff"/>
    </g>
  </svg>
  `,
    'X (formerly Twitter)': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect id="Canvas" width="16" height="16" fill="#1065dc" opacity="0"/>
  </svg>
  `,
  };

  const headerDiv = htmlToElement(`
    <div class="social-share-block">
    <div class="social-share-title">
      ${'SHARE ON SOCIAL'}
    </div>
    <div class="social-share-view">
      ${socialNetworks
        .map(
          (network) => `<a href="${socialLinks[network]}">
      <div class="social-share-item">
      ${socialIcons[network] || ''}<span class="social-share-name">${network}</span>
      </div>
      </a>`,
        )
        .join('')}
    </div>
    </div>
  `);

  block.append(headerDiv);
}
