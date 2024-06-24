import { htmlToElement } from '../../scripts/scripts.js';

/**
 * @param {HTMLElement} block
 */
function decoratePlaylistBrowseMarquee(block) {
  const [firstRow] = block.children;
  const [firstCell] = firstRow.children;
  const [p, header, description] = firstCell.children;

  const marquee = htmlToElement(`
    <div class="playlist-browse-marquee">
        <div class="playlist-browse-marquee-background">${p.innerHTML}</div>
        <div class="playlist-browse-marquee-content">
        <h1>${header.outerHTML}</h1>
        <p>${description.outerHTML}</p>
        </div>
    </div>`);

  firstCell.replaceWith(marquee);
}

/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  decoratePlaylistBrowseMarquee(block);
}
