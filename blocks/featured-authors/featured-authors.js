import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

/* Fetch data from the Placeholder.json */
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

// loads author info from author bio page
export async function fetchAuthorBio(link) {
  return fetch(link)
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(html, 'text/html');
      const authorInfo = [...htmlDoc.querySelector('.author-bio').children].map((row) => row.firstElementChild);

      return {
        authorImage: authorInfo[0].querySelector('img')?.src,
        authorName: authorInfo[1].textContent,
        authorTitle: authorInfo[2].textContent,
        authorCompany: authorInfo[3].textContent,
        authorDescription: authorInfo[4].textContent,
        authorSocialLinkText: authorInfo[5].textContent,
        authorSocialLinkURL: authorInfo[6].querySelector('a')?.href,
      };
    })
    .catch((error) => {
      console.error(error);
    });
}

/**
 *  Organises the DOM structure for one featured author info block
 */
async function setAuthorInfo(authorElem) {
  // get p element containg link to author bio
  const linkPar = authorElem.firstElementChild;
  // load author bio
  const authorInfo = await fetchAuthorBio(linkPar.firstElementChild.href);
  // remove the bio link p element
  linkPar.remove();
  // get a ref to cta link
  const cta = authorElem?.firstElementChild?.firstElementChild;
  if (cta) authorElem.firstElementChild.remove();
  // set class
  authorElem.classList.add('author');

  // add the author image
  if (authorInfo.authorImage) {
    const imageDiv = document.createElement('div');
    imageDiv.classList.add('author-image');
    const authorPict = document.createElement('picture');
    const authorImg = document.createElement('img');
    authorImg.src = authorInfo.authorImage;
    authorImg.alt = authorInfo.authorName;
    authorPict.append(authorImg);
    imageDiv.append(authorPict);

    // add empty div for company dot
    const companyDot = document.createElement('div');
    companyDot.classList.add('company-dot', authorInfo.authorCompany.toLowerCase());
    imageDiv.append(companyDot);

    authorElem.append(imageDiv);
  }

  // add a div for all the remaining author infos
  const authorInfoDiv = document.createElement('div');
  authorInfoDiv.classList.add('author-details');
  authorElem.append(authorInfoDiv);
  // add the remaining author infos
  const authorName = document.createElement('div');
  authorName.classList.add('author-name');
  authorName.textContent = authorInfo.authorName;
  const authorTitle = document.createElement('div');
  authorTitle.classList.add('author-title');
  authorTitle.textContent = authorInfo.authorTitle;
  authorInfoDiv.append(authorName, authorTitle);

  // if a social link is present, add it to the author info div
  const socialLink = authorInfo.authorSocialLinkURL;
  if (socialLink) {
    const socialLinkElem = document.createElement('a');
    socialLinkElem.classList.add('author-social-link');
    authorInfoDiv.append(socialLinkElem);
    socialLinkElem.textContent = authorInfo.authorSocialLinkText;
    socialLinkElem.href = socialLink;
  }

  // move the cta element into this div
  if (cta) {
    cta.classList.add('author-cta');
    authorInfoDiv.append(cta);
  }
}

export default async function decorate(block) {
  // get the cells
  const [image, description, author1, author2] = block.querySelectorAll(':scope div > div');

  // to make css simpler, add classes to the elements
  image.classList.add('featured-authors-image');
  description.classList.add('description');

  // add div overlay for tag text top right
  const sourceTag = document.createElement('div');
  sourceTag.classList.add('source-tag');
  image.append(sourceTag);
  sourceTag.textContent = block.classList.contains('adobe')
    ? placeholders.articleMarqueeAdobeTag
    : placeholders.articleMarqueeExternalTag;

  // check if featured authors have bio links
  if (author1.children.length > 1) {
    setAuthorInfo(author1);
  }

  if (author2.children.length > 1) {
    setAuthorInfo(author2);
  }
}
