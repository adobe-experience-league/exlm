import { fetchPlaceholders } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  if (document.referrer.search('/browse') >= 0) {
    const anchorTag =  block.querySelector('a');
    let text = 'Back to browsing';
    
    try {
      const placeholders = await fetchPlaceholders();
      anchorTag.textContent = placeholders['back-to-browsing'] || text;
    } catch {
      /* empty */
    }
    
    anchorTag.addEventListener('click', (e) => {
      e.preventDefault();
      history.back();
    });

    anchorTag.classList.add('show');
  }
}