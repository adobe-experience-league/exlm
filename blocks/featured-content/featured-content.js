export async function getContentReference(link) {
  return fetch(link)
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(html, 'text/html');
      const title = htmlDoc.querySelector("meta[name='og:title']")?.content;
      const image =  htmlDoc.querySelector('.article-content-section picture img')?.src;
      const description = htmlDoc.querySelector('article-content-section p')?.textContent;
      const authorInfo = [...htmlDoc.querySelector('.author-details').children].map((row) => row.firstElementChild);

      return {
        contentTitle: title,
        contentImage: image,
        contentDescription: description,
        authorName: authorInfo[1].textContent,
        authorProfile: authorInfo[2].textContent,
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