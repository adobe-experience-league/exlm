import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

export default async function decorate(block) {
  if (document.referrer.search('/browse') >= 0) {
    const anchorTag = block.querySelector('a');
    const text = 'Back to browsing';

    try {
      const placeholders = await fetchLanguagePlaceholders();
      anchorTag.textContent = placeholders['back-to-browsing'] || text;
    } catch {
      /* empty */
    }

    anchorTag.addEventListener('click', (e) => {
      e.preventDefault();
      // eslint-disable-next-line no-restricted-globals
      history.back();
    });

    block.classList.add('show');
  }
}
