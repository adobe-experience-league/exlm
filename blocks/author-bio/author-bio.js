import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { extractAuthorInfo } from '../../scripts/utils/author-utils.js';

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

  const authorBioPicture = createOptimizedPicture(authorImage, 'author-bio-picture');
  const authorSocialLinkElement = authorSocialLinkURL ?? '#';
  const authorBioDOM = htmlToElement(`
  <div class='author-bio-content ${authorCompany?.toLowerCase() ?? 'external'}'>
    <div class='author-image'>${authorBioPicture ? authorBioPicture.outerHTML : ''}</div>
    <div class="author-name-title-container">
      <div class='author-name'>${authorName ?? ''}</div>
      <div class='author-title-company'>
        ${authorTitle ?? ''} ${authorCompany ?? ''}
      </div>
    </div>
    <div class="author-description-social-link-container">
      <div class='author-description'>${authorDescription?.innerHTML ?? ''}</div>
      <a href='${authorSocialLinkElement}' class='author-social-link' title='${authorSocialLinkElement}'>
        ${authorSocialLinkText ?? ''}
      </a>
    </div>
  </div>
`);

  block.textContent = '';
  block.append(authorBioDOM);
}
