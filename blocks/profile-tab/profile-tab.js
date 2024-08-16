import ffetch from '../../scripts/ffetch.js';
import { getPathDetails, htmlToElement } from '../../scripts/scripts.js';

const tabOrder = ['/profile', '/profile/bookmarks-and-achievements'];

export default function ProfileTab(block) {
  const tabs = [];
  const currentURL = `/${getPathDetails()?.lang}${getPathDetails()?.suffix}`;
  ffetch(`/${getPathDetails()?.lang}/profile-index.json`)
    .all()
    .then((index) => {
      tabOrder.forEach((path) => {
        const profileIndex = index.find((page) => page.path.endsWith(path));
        if (profileIndex) {
          tabs.push(profileIndex);
        }
      });
      tabs.forEach((profileIndex) => {
        if (profileIndex) {
          const link = htmlToElement(
            `<a class="${
              currentURL === profileIndex.path || currentURL.replace('.html', '') === profileIndex.path ? 'active' : ''
            }" href=${profileIndex.path}>${profileIndex.title}</a>`,
          );
          block.appendChild(link);
        }
      });
    });
}
