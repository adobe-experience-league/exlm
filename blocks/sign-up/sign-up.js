import { isSignedInUser } from '../../scripts/auth/profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

function decorateButtons(buttons) {
  return buttons
    .map(({ ctaElem, ctaStyle, ctaLinkType }) => {
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
  block.style.display = 'none';
  // Extract properties
  // always same order as in model, empty string if not set
  const [img, eyebrow, title, longDescr, firstCta, firstCtaLinkType, secondCta, secondCtaLinkType] =
    block.querySelectorAll(':scope div > div');
  const subjectPicture = img.querySelector('picture');
  const bgColorCls = [...block.classList].find((cls) => cls.startsWith('bg-'));
  const bgColor = bgColorCls ? `--${bgColorCls.substr(3)}` : '--spectrum-gray-700';

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
      <div class='signup-cta'>
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

  const signInBtns = block.querySelectorAll('.signin');

  signInBtns.forEach((signInBtn) => {
    signInBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      window.adobeIMS.signIn();
    });
  });

  isSignedInUser().then((isUserSignedIn) => {
    if (!isUserSignedIn || document.documentElement.classList.contains('adobe-ue-edit')) {
      // show the block
      block.style.display = 'block';
    }
  });
}
