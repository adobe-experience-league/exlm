import { decorateIcons } from '../../scripts/lib-franklin.js';
import { loadIms } from '../../scripts/scripts.js';

function decorateButtons(...buttons) {
  return buttons
    .map((div, index) => {
      if (div) {
        const a = div.querySelector('a');
        if (a) {
          a.classList.add('button');
          if (index === 0) a.classList.add('sign-up-cta-btn');
          if (index === 1) a.classList.add('secondary');
          if (a.parentElement.tagName === 'EM') a.classList.add('secondary');
          if (a.parentElement.tagName === 'STRONG') a.classList.add('primary');
          return a.outerHTML;
        }
      }
      return '';
    })
    .join('');
}

function getSignInButton(signInText) {
  const firstCta = document.createElement('div');
  const link = document.createElement('a');
  link.classList.add('sign-up-cta-btn');
  link.setAttribute('href', '#');
  link.setAttribute('title', signInText);
  link.textContent = signInText;
  firstCta.append(link);
  return firstCta;
}

export default async function decorate(block) {
  block.style.display = 'none';
  // Extract properties
  // always same order as in model, empty string if not set
  const [img, eyebrow, title, longDescr, firstCtaText, secondCta] = block.querySelectorAll(':scope div > div');
  const subjectPicture = img.querySelector('picture');
  const bgColorCls = [...block.classList].find((cls) => cls.startsWith('bg-'));
  const bgColor = bgColorCls ? `--${bgColorCls.substr(3)}` : '--spectrum-gray-700';
  const signInText = firstCtaText.textContent?.trim();

  // build sign in button if not in yet and button text is set
  const firstCta = signInText ? getSignInButton(signInText) : null;

  // Build DOM
  const signupDOM = document.createRange().createContextualFragment(`
  <div class='signup-foreground'>
    <div class='signup-text'>
      ${
        eyebrow.textContent.trim() !== ''
          ? `<div class='signup-eyebrow'>${eyebrow.textContent.trim().toUpperCase()}</div>`
          : ``
      }
      <div class='signup-title'>${title.innerHTML}</div>
      <div class='signup-long-description'>${longDescr.innerHTML}</div>
      <div class='signup-cta'>${decorateButtons(firstCta, secondCta)}</div>
    </div>
    ${
      subjectPicture
        ? `<div class='signup-subject' style="background-color : var(${bgColor})">${subjectPicture.outerHTML}</div>`
        : `<div class='signup-spacer'></div>`
    }
    </div>
  </div>
  <div class='signup-background'>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1562 571.212"><path fill="#fff" d="M0 1.212h1562v570H0z" data-name="Rectangle 1"></path><path class="bg" fill="var(${bgColor})" d="M752.813-1495s115.146 210.072 471.053 309.516 291.355 261.7 291.355 261.7h150.039V-1495Z" data-name="Path 1" transform="translate(-103.26 1495)"></path></svg>
  </div>
  `);

  block.textContent = '';
  if (!subjectPicture) {
    block.classList.add('no-subject');
  }

  decorateIcons(signupDOM);
  block.append(signupDOM);

  const signUpBtn = block.querySelector('.sign-up-cta-btn');

  if (signUpBtn) {
    signUpBtn.addEventListener('click', async () => {
      window.adobeIMS.signIn();
    });
  }

  // check if user is signed in
  try {
    await loadIms();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }

  const isUserSignedIn = window.adobeIMS?.isSignedInUser();

  // if not signed in or in UE edit mode
  if (!isUserSignedIn || document.documentElement.classList.contains('adobe-ue-edit')) {
    // show the block
    block.style.display = 'block';
  }
}
