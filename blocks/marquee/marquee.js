/* eslint-disable no-plusplus */
import { decorateIcons } from '../../scripts/lib-franklin.js';

function decorateButtons(...buttons) {
  return buttons
    .map((div, index) => {
      if (div) {
        const a = div.querySelector('a');
        if (a) {
          a.classList.add('button');
          if (index === 0) a.classList.add('secondary');
          if (index === 1) a.classList.add('primary');
          return a.outerHTML;
        }
      }
      return '';
    })
    .join('');
}

function getSignInButton(signInText, primaryCtaLink) {
  const secondCta = document.createElement('div');
  const link = document.createElement('a');
  link.classList.add('signin');
  link.setAttribute('href', primaryCtaLink);
  link.setAttribute('title', signInText);
  link.textContent = signInText;
  secondCta.append(link);
  return secondCta;
}

export default async function decorate(block) {
  // Extract properties
  // always same order as in model, empty string if not set
  const [img, eyebrow, title, longDescr, firstCta, linkType, confSignInText, secondCtaLink] =
    block.querySelectorAll(':scope div > div');

  const subjectPicture = img.querySelector('picture');
  const bgColorCls = [...block.classList].find((cls) => cls.startsWith('bg-'));
  const bgColor = bgColorCls ? `--${bgColorCls.substr(3)}` : '--spectrum-gray-700';
  const signInText = confSignInText?.textContent?.trim();
  const eyebrowText = eyebrow?.textContent?.trim();
  const primaryCtaLink = secondCtaLink?.textContent?.trim();

  // build sign in button if not in yet and button text is set
  const secondCta = signInText && getSignInButton(signInText, primaryCtaLink);

  // Build DOM
  const marqueeDOM = document.createRange().createContextualFragment(`
    <div class='marquee-foreground'>
      <div class='marquee-text'>
        ${eyebrowText !== '' ? `<div class='marquee-eyebrow'>${eyebrowText?.toUpperCase()}</div>` : ``}
        <div class='marquee-title'>${title.innerHTML}</div>
        <div class='marquee-long-description'>${longDescr.innerHTML}</div>
        <div class='marquee-cta'>${decorateButtons(firstCta, secondCta)}</div>
      </div>
      ${
        subjectPicture
          ? `<div class='marquee-subject' style="background-color : var(${bgColor})">${subjectPicture.outerHTML}</div>`
          : `<div class='marquee-spacer'></div>`
      }
      </div>
    </div>
    <div class='marquee-background'>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1562 571.212"><path fill="#fff" d="M0 1.212h1562v570H0z" data-name="Rectangle 1"></path><path class="bg" fill="var(${bgColor})" d="M752.813-1495s115.146 210.072 471.053 309.516 291.355 261.7 291.355 261.7h150.039V-1495Z" data-name="Path 1" transform="translate(-103.26 1495)"></path></svg>
    </div> `);

  block.textContent = '';

  if (!subjectPicture) {
    block.classList.add('no-subject');
  }

  if (linkType.textContent.trim() === 'video') {
    const firstCtaButton = marqueeDOM.querySelector('.marquee-cta > a:first-child');
    const videoLink = firstCtaButton.getAttribute('href');

    firstCtaButton.setAttribute('href', '#');
    firstCtaButton.removeAttribute('target');
    const playIcon = document.createElement('span');
    playIcon.classList.add('icon', 'icon-play');
    firstCtaButton.prepend(playIcon);
    const modal = document.createElement('div');
    modal.classList.add('modal');
    const closeIcon = document.createElement('span');
    closeIcon.classList.add('icon', 'icon-close');
    modal.appendChild(closeIcon);
    modal.style.display = 'none';
    block.append(modal);

    firstCtaButton.addEventListener('click', () => {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (!modal.querySelector('iframe')) {
        const iframeContainer = document.createElement('div');
        iframeContainer.classList.add('iframe-container');
        iframeContainer.innerHTML = `<iframe src=${videoLink} frameborder="0" allow="autoplay; encrypted-media" allowfullscreen=""></iframe>`;
        modal.append(iframeContainer);
      }
      decorateIcons(modal);
    });

    modal.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.removeAttribute('style');
      modal.querySelector('.iframe-container').remove();
    });
  }

  // fetch user auth to toggle hide signin button
  import('../../scripts/auth/profile.js')
    .then((module) => module.isSignedInUser())
    .then((isSignedInUser) => {
      if (!isSignedInUser) {
        block.classList.add('unauthenticated');
        block.querySelector('.signin')?.addEventListener('click', () => window.adobeIMS.signUp());
      }
    });

  decorateIcons(marqueeDOM);
  block.append(marqueeDOM);
}
