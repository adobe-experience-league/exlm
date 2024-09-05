import { getPathDetails } from '../../scripts/scripts.js';
import { loadBlocks, decorateSections, decorateBlocks, decorateIcons } from '../../scripts/lib-franklin.js';

const { lang} = getPathDetails();

const paths = {
  incompletePageURL: `/${lang}/profile/home/incomplete`,
  completePageURL: `/${lang}/profile/home/complete`,
  commonPageURL: `/${lang}/profile/home/shared`,
};

const fetchPageContent = async (url, loader) => {
  try {
    const response = await fetch(`${url}.plain.html`);
    if (response.ok) {
      const pageContent = await response.text();
      const container = document.createElement('div');
      container.innerHTML = pageContent;
      decorateSections(container);
      decorateBlocks(container);
      await loadBlocks(container);
      await decorateIcons(container);
      Array.from(container.children).forEach((section) => {
        loader.insertAdjacentElement('beforebegin', section);
      });
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.log(err);
  }
};


export default async function decorate(block) {
  block.innerHTML = `Hi`;
  if(!window.hlx.aemRoot) {
    await fetchPageContent(paths.commonPageURL, document.querySelector('.iframe-app-container'));
  }
}
