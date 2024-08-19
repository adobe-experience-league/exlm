import { getPathDetails, htmlToElement } from '../scripts.js';
import { defaultProfileClient } from '../auth/profile.js';
import { loadBlocks, decorateSections, decorateBlocks, decorateIcons } from '../lib-franklin.js';

const { lang, suffix } = getPathDetails();

const paths = {
  incompletePageURL: `/${lang}/profile/home/incomplete`,
  completePageURL: `/${lang}/profile/home/complete`,
  commonPageURL: `/${lang}/profile/home/common`,
};

let commonPageFetched = false;

const fetchPageContent = async (url) => {
  const main = document.querySelector('main');
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
      main.appendChild(section);
    });
  }
};

const fetchCommonContent = async () => {
  if (!commonPageFetched) {
    commonPageFetched = true;
    fetchPageContent(paths.commonPageURL)
      .then(() => {
        window.removeEventListener('scroll', fetchCommonContent);
      })
      .catch((err) => {
        /* eslint-disable-next-line no-console */
        console.log(err);
      });
  }
};

export default function classifyProfileAndFetchContent() {
  try {
    if (suffix === '/profile') {
      Object.keys(paths).forEach((url) => {
        document.head.appendChild(htmlToElement(`<link rel="prefetch" href="${paths[url]}.plain.html">`));
      });
      document.querySelectorAll('main > div').forEach((section) => {
        if (!section.children.length) {
          section.remove();
        }
      });
      defaultProfileClient
        .getMergedProfile()
        .then((profileData) => {
          if (profileData.interests.length) {
            fetchPageContent(paths.completePageURL);
          } else {
            fetchPageContent(paths.incompletePageURL);
          }
        })
        .catch((err) => {
          /* eslint-disable-next-line no-console */
          console.log(err);
        });
      window.addEventListener('scroll', fetchCommonContent);
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.log(err);
  }
}
