import { decorateIcons } from '../../scripts/lib-franklin.js';
import { loadIms } from '../../scripts/scripts.js';

export default async function decorate(block) {
  block.style.display = 'none';

  let adobeIMS = {
    isSignedInUser: () => false,
  };

  try {
    await loadIms();
    adobeIMS = window.adobeIMS;
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }

  const isUserSignedIn = adobeIMS?.isSignedInUser();

  if (!isUserSignedIn) {
    block.style.display = 'block';
    // Extract properties
    // always same order as in model, empty string if not set
    const props = [...block.querySelectorAll(':scope div > div')];

    const subjectPicture = props[0].innerHTML?.trim();
    const subjectImageDescr = props[1].textContent?.trim();
    const bgColor = props[2].textContent?.trim();
    const eyebrow = props[3].textContent?.trim();
    const title = props[4].textContent?.trim();
    const longDescr = props[5].innerHTML?.trim();
    const firstCTAType = props[6].textContent?.trim();
    const firstCTAText = props[7].textContent?.trim();
    const firstCTALink = props[8].textContent?.trim();
    const secondCTAType = props[9].textContent?.trim();
    const secondCTAText = props[10].textContent?.trim();
    const secondCTALink = props[11].textContent?.trim();

    // Build DOM
    const signupDOM = document.createRange().createContextualFragment(`
    <div class='signup-foreground'>
      <div class='signup-text'>
        ${eyebrow ? `<div class='signup-eyebrow'>${eyebrow.toUpperCase()}</div>` : ``}
        <div class='signup-title'>${title}</div>
        <div class='signup-long-description'>${longDescr}</div>
        <div class='signup-cta'>${
          firstCTAText
            ? `<a class='button ${firstCTAType} sign-up-cta-btn' href='${firstCTALink || '#'}'>${firstCTAText}</a>`
            : ``
        }${
          secondCTAText && secondCTALink
            ? `<a class='button ${secondCTAType}' href='${secondCTALink}'>${secondCTAText}</a>`
            : ``
        }</div>
      </div>
      ${
        subjectPicture
          ? `<div class='signup-subject' style="background-color : var(${
              bgColor || '--spectrum-gray-700'
            })">${subjectPicture}</div>`
          : `<div class='signup-spacer'></div>`
      }
      </div>
    </div>
    <div class='signup-background'>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1562 571.212"><path fill="#fff" d="M0 1.212h1562v570H0z" data-name="Rectangle 1"></path><path class="bg" fill="var(${
        bgColor || '--spectrum-gray-700'
      })" d="M752.813-1495s115.146 210.072 471.053 309.516 291.355 261.7 291.355 261.7h150.039V-1495Z" data-name="Path 1" transform="translate(-103.26 1495)"></path></svg>
    </div>
  `);

    if (subjectPicture && subjectImageDescr) {
      signupDOM.querySelector('.signup-subject picture img').setAttribute('alt', subjectImageDescr);
    }

    block.textContent = '';
    if (!subjectPicture) {
      block.classList.add('no-subject');
    }

    decorateIcons(signupDOM);
    block.append(signupDOM);

    const signUpBtn = block.querySelector('.sign-up-cta-btn');

    signUpBtn.addEventListener('click', async () => {
      adobeIMS.signIn();
    });
  } else {
    block.parentElement.remove();
  }
}
