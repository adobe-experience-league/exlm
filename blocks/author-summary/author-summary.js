import { fetchAuthorBio } from '../../scripts/scripts.js';

export default function decorate(block) {
  const authorSummaryContainer = document.createElement('div');
  authorSummaryContainer.classList.add('author-summary-grid');

  fetchAuthorBio(block.querySelector('a').href).then((authorInfo) => {
    if (authorInfo.authorImage) {
      authorInfo.authorImage.classList.add('author-image');
      authorSummaryContainer.append(authorInfo.authorImage);
    }

    if (authorInfo.authorName) {
      const authorDetails = document.createElement('div');
      authorDetails.classList.add('author-details');
      authorDetails.append(authorInfo.authorName);
      if (authorInfo.authorTitle) {
        authorDetails.append(authorInfo.authorTitle);
      }
      authorSummaryContainer.append(authorDetails);
    }

    if (authorInfo.authorDescription) {
      const description = document.createElement('div');
      description.classList.add('author-description');
      description.append(authorInfo.authorDescription);
      if (authorInfo.authorSocialLinkURL && authorInfo.authorSocialLinkText) {
        const socialLink = document.createElement('a');
        socialLink.href = authorInfo.authorSocialLinkURL?.textContent.trim();
        socialLink.append(authorInfo.authorSocialLinkText?.textContent.trim());
        description.append(socialLink);
      }
      authorSummaryContainer.append(description);
    }

    if (authorInfo.authorCompany) {
      authorSummaryContainer.classList.add(authorInfo.authorCompany.textContent.toLowerCase().trim());
    }
  });

  block.innerHTML = '';
  block.append(authorSummaryContainer);
}
