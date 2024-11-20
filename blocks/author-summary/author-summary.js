import { createOptimizedPicture, getMetadata } from '../../scripts/lib-franklin.js';
import { fetchAuthorBio } from '../../scripts/utils/author-utils.js';

export default async function decorate(block) {
  let links = getMetadata('author-bio-page');
  if (links) {
    if (window.hlx.aemRoot) {
      links = links.split(',').map((link) => `${link.trim()}.html`);
    } else {
      links = links.split(',').map((link) => link.trim());
    }

    // Filter out null, empty and duplicate links and map to fetchAuthorBio
    const uniqueLinks = Array.from(new Set(links.filter((link) => link)));
    const authorPromises = uniqueLinks.map((link) => fetchAuthorBio(link));

    // Process promises without blocking rendering
    Promise.allSettled(authorPromises).then((results) => {
      block.textContent = ''; // Clear block content
      results
        .filter((result) => result.status === 'fulfilled') // Only handle resolved promises
        .forEach(({ value: authorInfo }) => {
          if (authorInfo) {
            const authorSummaryContainer = document.createElement('div');
            authorSummaryContainer.classList.add('author-summary-grid');

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

            block.append(authorSummaryContainer);
          }
        });
    });
  }
}
