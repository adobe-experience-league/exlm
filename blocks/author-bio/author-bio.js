import { htmlToElement, extractAuthorInfo } from '../../scripts/scripts.js';

export default function decorate(block) {
  const {
    authorImage,
    authorName,
    authorTitle,
    authorCompany,
    authorDescription,
    authorSocialLinkText,
    authorSocialLinkURL,
  } = extractAuthorInfo(block);
  const authorBioPicture = authorImage.querySelector('picture');
  const authorSocialLinkElement = authorSocialLinkURL.querySelector('a').href;
  const authorBioDOM = htmlToElement(`
  <div class='author-bio-content ${authorCompany ? authorCompany.innerHTML : 'external'}'>
    <div class='author-image'>${authorBioPicture ? authorBioPicture.outerHTML : ''}</div>
    <div class="author-name-title-container">
      <div class='author-name'>${authorName ? authorName.innerHTML : ''}</div>
      <div class='author-title-company'>
        ${authorTitle ? authorTitle.innerHTML : ''} ${authorCompany ? authorCompany.innerHTML : ''}
      </div>
    </div>
    <div class="author-description-socialLink-container">
      <div class='author-description'>${authorDescription ? authorDescription.innerHTML : ''}</div>
      <a href='${authorSocialLinkElement}' class='author-socialLink' title='${authorSocialLinkElement}'>
        ${authorSocialLinkText ? authorSocialLinkText.innerHTML : ''}
      </a>
    </div>
  </div>
`);

  block.textContent = '';
  block.append(authorBioDOM);
}
