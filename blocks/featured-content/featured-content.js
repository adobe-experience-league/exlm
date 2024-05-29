import { a, div, h2, p } from "../../scripts/dom-helpers.js";
import { createOptimizedPicture } from "../../scripts/lib-franklin.js";

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
  const contentInfo = await getContentReference(link[0].href);
  contentElem.innerHTML = '';

  const contentDiv = div({ class: 'description' },
    h2(contentInfo.contentTitle),
    p(contentInfo.contentDescription),
    div({ class: 'button-container' },
      a({ href: link[0].href, 'aria-label': 'Read Article', class: 'button primary' }, 'Read Article'),
    ),
  );
  const authorContainer = div({ class: 'author-container' });

  contentInfo.authorInfo.forEach((author) => {
    const authorName = author.querySelector('div:nth-child(2) > div')?.innerText;
    const authorPicture = author.querySelector('div:first-child picture img')?.src;
    const company = author.querySelector('div').classList[1];

    const authorDiv = div({ class: 'author' },
      div({class: 'author-image'},
        createOptimizedPicture(authorPicture, authorName, 'eager', [{ width: '100' }]),
        div({class: `company-dot ${company}`})
      ),
      div({class: 'author-details'}, div( authorName)),
    );

    if (authorDiv) authorContainer.append(authorDiv);
  });

  contentElem.replaceWith(contentDiv);
  contentElem.after(authorContainer);
}

export default async function decorate(block) {
  // get the cells
  const [image, content] = block.querySelectorAll(':scope div > div');

  // to make css simpler, add classes to the elements
  image.classList.add('featured-content-image');
  const imageInfo = image.querySelector('picture img');
  image.querySelector('picture').replaceWith(createOptimizedPicture(imageInfo.src, imageInfo.alt, 'eager', [{ width: '327' }]));

  // check if featured authors have bio links
  if (content.children?.length >= 1) {
    buildFeaturedContent(content);
  }
}