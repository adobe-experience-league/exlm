import { createOptimizedPicture, getMetadata } from '../../scripts/lib-franklin.js';
import { fetchAuthorBio } from '../../scripts/scripts.js';

export default function decorate(block) {
  const authorSummaryContainer = document.createElement('div');
  let link = getMetadata('author-bio-page');
  if (
    link &&
    (document.documentElement.classList.contains('adobe-ue-edit') ||
      document.documentElement.classList.contains('adobe-ue-preview'))
  ) {
    link = `${link}.html`;
  }
  if (link) {
    fetchAuthorBio(link).then((authorInfo) => {
      if (authorInfo.authorImage) {
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('author-image');
        imageContainer.append(createOptimizedPicture(authorInfo.authorImage));
        authorSummaryContainer.append(imageContainer);
      }

      if (authorInfo.authorName) {
        const authorDetails = document.createElement('div');
        authorDetails.classList.add('author-details');
        const authorName = document.createElement('div');
        authorName.textContent = authorInfo.authorName;
        authorDetails.append(authorName);
        if (authorInfo.authorTitle) {
          const authorTitle = document.createElement('div');
          authorTitle.textContent = authorInfo.authorTitle;
          authorDetails.append(authorTitle);
        }
        authorSummaryContainer.append(authorDetails);
      }

      if (authorInfo.authorDescription || authorInfo.authorSocialLinkURL) {
        const description = document.createElement('div');
        description.classList.add('author-description');
        description.innerHTML = `<div>${
          authorInfo.authorDescription ? authorInfo.authorDescription.innerHTML : ''
        }</div>`;
        if (authorInfo.authorSocialLinkURL && authorInfo.authorSocialLinkText) {
          const socialLink = document.createElement('a');
          socialLink.href = authorInfo.authorSocialLinkURL ? authorInfo.authorSocialLinkURL : '#';
          socialLink.append(authorInfo.authorSocialLinkText);
          description.append(socialLink);
        }
        authorSummaryContainer.append(description);
      }

      if (authorInfo.authorCompany) {
        authorSummaryContainer.classList.add(authorInfo.authorCompany.toLowerCase());
      }

      authorSummaryContainer.classList.add('author-summary-grid');
    });
  }

  block.textContent = '';
  block.append(authorSummaryContainer);
}
