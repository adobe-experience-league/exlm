import { a, div, h2, img } from "../../scripts/dom-helpers.js";

export async function getContentReference(link) {
  return fetch(link)
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(html, 'text/html');
      const title = htmlDoc.title;
      const description = htmlDoc.querySelector('main div p')?.textContent;
      // const authorBio = [...htmlDoc.querySelector('.author-bio')?.children].map((row) => row.firstElementChild);
      const authorBio = htmlDoc.querySelectorAll('.author-bio');

      return {
        contentTitle: title,
        contentDescription: description,
        authorInfo: authorBio,
      };
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
    });
}

async function buildFeaturedContent(contentElem) {
  const link = contentElem.querySelectorAll('a');
  const ctaString = contentElem.querySelector('p:last-child').textContent;
  const contentInfo = await getContentReference(link[0].href);

  contentElem.innerHTML = '';

  const contentDiv = div({ class: 'content-details' },
    h2(contentInfo.contentTitle),
    div({ class: 'content-description' }, contentInfo.contentDescription),
    div({ class: 'button-container' },
      a({ href: link[0].href, class: 'button primary' }, ctaString ? ctaString : 'Read More'),
    ),
    contentInfo.authorInfo.forEach((author) => {
      const authorName = author.querySelector('div:nth-child(1)')?.textContent;
      const authorPicture = author.querySelector('div:first-child picture img')?.src;

      const authorDiv = div({ class: 'author' },
        img({ src: authorPicture, alt: authorName }),
        div( authorName),
      );

      if (authorDiv) contentDiv.appendChild(authorDiv);
    })
  );
  contentElem.appendChild(contentDiv);
}

export default async function decorate(block) {
  // get the cells
  const [image, content] = block.querySelectorAll(':scope div > div');

  // to make css simpler, add classes to the elements
  image.classList.add('featured-content-image');

  // check if featured authors have bio links
  if (content.children?.length >= 1) {
    buildFeaturedContent(content);
  }
}