import ffetch from '../../scripts/ffetch.js';
import { getPathDetails } from '../../scripts/scripts.js';

export default function ProfileTab(block) {
  const currentURL = `/${getPathDetails()?.lang}${getPathDetails()?.suffix}`;
  ffetch(`/${getPathDetails()?.lang}/profile-index.json`)
    .all()
    .then((index) => {
      index.forEach((profileIndex) => {
        if (profileIndex) {
          block.innerHTML += `
          <a class="${
            currentURL === profileIndex.path || currentURL.replace('.html', '') === profileIndex.path ? 'active' : ''
          }" href=${profileIndex.path}>${profileIndex.title}</a>
          `;
        }
      });
    });
}
