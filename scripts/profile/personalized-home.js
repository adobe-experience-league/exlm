import { getPathDetails, htmlToElement } from '../scripts.js';
import { defaultProfileClient } from '../auth/profile.js';
import { loadBlocks, decorateSections, decorateBlocks, decorateIcons } from '../lib-franklin.js';

const { lang, suffix } = getPathDetails();

const paths = {
  incompletePageURL: `/${lang}/profile/home/incomplete`,
  completePageURL: `/${lang}/profile/home/complete`,
  commonPageURL: `/${lang}/profile/home/shared`,
};

let commonPageFetched = false;

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

const fetchCommonContent = async (loader) => {
  if (!commonPageFetched) {
    commonPageFetched = true;
    fetchPageContent(paths.commonPageURL, loader)
      .then(() => {
        loader.remove();
      })
      .catch((err) => {
        /* eslint-disable-next-line no-console */
        console.log(err);
      });
  }
};

export default async function classifyProfileAndFetchContent() {
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
      document.body.classList.add('profile-home-page');
      document.body.appendChild(
        htmlToElement('<div class="profile-background" role="presentation" aria-hidden="true"></div>'),
      );
      const loader = htmlToElement('<div class="section profile-shimmer"><span></span></div>');
      document.querySelector('main').appendChild(loader);
      defaultProfileClient.getMergedProfile().then(async (profileData) => {
        if (profileData.interests.length) {
          await fetchPageContent(paths.completePageURL, loader);
        } else {
          await fetchPageContent(paths.incompletePageURL, loader);
        }
        await fetchCommonContent(loader);
      });
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.log(err);
  }
}
