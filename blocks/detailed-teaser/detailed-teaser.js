import decorateCustomButtons from '../../scripts/utils/button-utils.js';

// eslint-disable-next-line no-unused-vars
export function generateDetailedTeaserDOM(props, classes) {
  // Extract properties, always same order as in model, empty string if not set
  const [backImage, eyebrowContent, title, description, subjectImage, firstCta, secondCta] = props;
  const backPicture = backImage.querySelector('picture');
  const subjectPicture = subjectImage.querySelector('picture');

  // add classes for the different eyebrow elements
  if (eyebrowContent) {
    eyebrowContent.classList.add('eyebrow');
    [...eyebrowContent.children].forEach((p, i) => {
      // eslint-disable-next-line default-case
      switch (i) {
        case 0:
          // if first p has an image , otherwise its eyebrow title
          p.classList.add(p.firstElementChild && p.firstElementChild.tagName === 'PICTURE' ? 'logo' : 'title');
          break;
        case 1:
          // if eybrow title is already set it eyebrow subtitle, otherwise its eyebrow title
          p.classList.add(p.previousElementSibling.classList.contains('eyebrow-title') ? 'subtitle' : 'title');
          break;
        case 2:
          // third p is always sub title if existing
          p.classList.add('subtitle');
          break;
      }
    });
  }

  // Build DOM
  const teaserDOM = document.createRange().createContextualFragment(`
    <div class='background'>${backPicture ? backPicture.outerHTML : ''}</div>
    <div class='foreground'>
      <div class='text'>
        ${eyebrowContent.outerHTML}
        <div class='title'>${title.innerHTML}</div>
        <div class='description'>${description.innerHTML}</div>
        <div class='cta'>${decorateCustomButtons(firstCta, secondCta)}</div>
      </div>
      <div class='spacer'>
        ${subjectPicture ? subjectPicture.outerHTML : ''}
      </div>
    </div>
  `);
  // add final teaser DOM and classes if used as child component
  return teaserDOM;
}

export default async function decorate(block) {
  const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
  // get the first and only cell from each row
  const [imageElement, ...props] = [...block.children].map((row) => row.firstElementChild);
  const teaserDOM = generateDetailedTeaserDOM([imageElement, ...props], block.classList);
  block.textContent = '';

  block.append(teaserDOM);

  const bgColorCls = [...block.classList].find((cls) => cls.startsWith('bg-'));
  if (bgColorCls) {
    const bgColor = `var(--${bgColorCls.substr(3)})`;
    block.style.backgroundColor = bgColor;
  }

  if (block.classList.contains('inline-banner') && block.classList.contains('hide-banner') && !UEAuthorMode) {
    try {
      const { isSignedInUser } = await import('../../scripts/auth/profile.js');
      const isSignedIn = await isSignedInUser();
      if (isSignedIn) {
        block.style.display = 'none';
      }
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.error('Error fetching profile data: ', error);
    }
  }
}
