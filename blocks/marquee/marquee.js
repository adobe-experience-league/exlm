/* eslint-disable no-plusplus */
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { loadIms } from '../../scripts/scripts.js';

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

function getSignInButton(signInText) {
  const secondCta = document.createElement('div');
  const link = document.createElement('a');
  link.classList.add('signin');
  link.setAttribute('href', '#');
  link.setAttribute('title', signInText);
  link.textContent = signInText;
  secondCta.append(link);
  return secondCta;
}

export default async function decorate(block) {
  // Extract properties
  // always same order as in model, empty string if not set
  const [img, eyebrow, title, longDescr, firstCta, confSignInText] = block.querySelectorAll(':scope div > div');
  const subjectPicture = img.querySelector('picture');
  const bgColorCls = [...block.classList].find((cls) => cls.startsWith('bg-'));
  const bgColor = bgColorCls ? `--${bgColorCls.substr(3)}` : '--spectrum-gray-700';
  const signInText = confSignInText.textContent.trim();

  // get signed in status
  try {
    await loadIms();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }
  const isSignedIn = window.adobeIMS?.isSignedInUser();

  // build sign in button if not in yet and button text is set
  const secondCta = signInText && !isSignedIn ? getSignInButton(signInText) : null;

  // Build DOM
  const marqueeDOM = document.createRange().createContextualFragment(`
    <div class='marquee-foreground'>
      <div class='marquee-text'>
        ${
          eyebrow.textContent.trim() !== ''
            ? `<div class='marquee-eyebrow'>${eyebrow.textContent.trim().toUpperCase()}</div>`
            : ``
        }
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
    </div>
  `);

  // add sign in event handler for sign in if set
  if (signInText && !isSignedIn) {
    marqueeDOM.querySelector('.signin').addEventListener('click', async () => {
      window.adobeIMS.signIn();
    });
  }

  block.textContent = '';
  if (!subjectPicture) {
    block.classList.add('no-subject');
  }

  decorateIcons(marqueeDOM);
  block.append(marqueeDOM);
}
