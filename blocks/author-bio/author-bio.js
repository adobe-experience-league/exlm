import { htmlToElement } from '../../scripts/scripts.js';

export default function decorate(block) {
  const props = [...block.children].map((row) => row.firstElementChild);
  const [
    authorImage,
    authorName,
    authorTitle,
    authorCompany,
    authorDescription,
    authorSocialLinkText,
    authorSocialLinkURL,
  ] = props;
  const authorBioPicture = authorImage.querySelector('picture');
  const authorSocialLinkElement = authorSocialLinkURL.querySelector('a').href;
  const authorBioDOM = htmlToElement(`
        <div class='author-bio-content ${authorCompany ? authorCompany.innerHTML : 'external'}'>
        <div class='author-image'>${authorBioPicture ? authorBioPicture.outerHTML : ''}</div>
        <div class="author-name-title-container">
          <div class='author-name'>${authorName.innerHTML}</div>
          <div class='author-title-company'>${authorTitle.innerHTML} ${authorCompany.innerHTML}</div>
        </div>
        <div class="author-description-socialLink-container">  
          <div class='author-description'>${authorDescription.innerHTML}</div>
          <a href='${authorSocialLinkElement}' class='author-socialLink' title='${authorSocialLinkElement}'>${authorSocialLinkText.innerHTML}</a>
        </div>
        </div>
    `);
  block.innerHTML = '';
  block.append(authorBioDOM);
}
