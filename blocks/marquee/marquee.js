/* eslint-disable no-plusplus */
import { decorateIcons } from '../../scripts/lib-franklin.js';

function decorateButtons(buttons) {
  return buttons
    .map(({ ctaElem, ctaStyle, ctaLinkType = 'link' }) => {
      if (ctaElem && ctaElem.textContent?.trim() !== '') {
        const a = ctaElem.querySelector('a');
        if (a) {
          a.classList.add('button', ctaStyle, ctaLinkType);
          return a.outerHTML;
        }
      }
      return '';
    })
    .join('');
}

export default async function decorate(block) {
  // Extract properties
  // always same order as in model, empty string if not set
  const [
    img,
    hexcode,
    backgroundHexcode,
    eyebrow,
    title,
    longDescr,
    firstCta,
    firstCtaLinkType,
    secondCta,
    secondCtaLinkType,
  ] = block.querySelectorAll(':scope div > div');

  const subjectPicture = img.querySelector('picture');
  const bgColorCls = [...block.classList].find((cls) => cls.startsWith('bg-'));
  const bgColor = bgColorCls ? `var(--${bgColorCls.substr(3)})` : `#${hexcode.innerHTML}`;
  const eyebrowText = eyebrow?.textContent?.trim();

  // Build DOM
  const marqueeDOM = document.createRange().createContextualFragment(`
    <div class='marquee-foreground'>
      <div class='marquee-text'>
        ${eyebrowText !== '' ? `<div class='marquee-eyebrow'>${eyebrowText?.toUpperCase()}</div>` : ``}
        <div class='marquee-title'>${title.innerHTML}</div>
        <div class='marquee-long-description'>${longDescr.innerHTML}</div>
        <div class='marquee-cta'>
          ${decorateButtons([
            {
              ctaElem: firstCta,
              ctaStyle: 'secondary',
              ctaLinkType: firstCtaLinkType?.textContent?.trim() || 'link',
            },
            {
              ctaElem: secondCta,
              ctaStyle: 'primary',
              ctaLinkType: secondCtaLinkType?.textContent?.trim() || 'link',
            },
          ])}
        </div>
      </div>
      ${
        subjectPicture
          ? `<div class='marquee-subject' style="background-color : ${bgColor}">${subjectPicture.outerHTML}</div>`
          : `<div class='marquee-spacer'></div>`
      }
      </div>
    </div>
    <div class='marquee-background'>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1562 571.212"><path fill="${
        backgroundHexcode.innerHTML === 'true' ? `${bgColor}` : '#fff'
      }" d="M0 1.212h1562v570H0z" data-name="Rectangle 1"></path><path class="bg" fill="${bgColor}" d="M752.813-1495s115.146 210.072 471.053 309.516 291.355 261.7 291.355 261.7h150.039V-1495Z" data-name="Path 1" transform="translate(-103.26 1495)"></path></svg>
    </div> `);

  block.textContent = '';

  if (!subjectPicture) {
    block.classList.add('no-subject');
  }

  const videoLinkElems = marqueeDOM.querySelectorAll('.marquee-cta > .video');
  videoLinkElems.forEach((videoLinkElem) => {
    const videoLink = videoLinkElem.getAttribute('href');

    videoLinkElem.setAttribute('href', '#');
    videoLinkElem.removeAttribute('target');
    const playIcon = document.createElement('span');
    playIcon.classList.add('icon', 'icon-play');
    videoLinkElem.prepend(playIcon);
    decorateIcons(videoLinkElem);
    const modal = document.createElement('div');
    modal.classList.add('modal');
    const closeIcon = document.createElement('span');
    closeIcon.classList.add('icon', 'icon-close-light');
    modal.appendChild(closeIcon);
    decorateIcons(modal);
    modal.style.display = 'none';
    block.append(modal);

    videoLinkElem.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (!modal.querySelector('iframe')) {
        const iframeContainer = document.createElement('div');
        iframeContainer.classList.add('iframe-container');
        iframeContainer.innerHTML = `<iframe src=${videoLink} frameborder="0" allow="autoplay; encrypted-media" allowfullscreen=""></iframe>`;
        modal.append(iframeContainer);
      }
      
    });

    modal.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.removeAttribute('style');
      modal.querySelector('.iframe-container').remove();
    });
  });

  // fetch user auth to toggle hide signin button
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

  block.append(marqueeDOM);
}
