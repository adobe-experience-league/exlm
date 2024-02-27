import { decorateButtons } from '../../scripts/lib-franklin.js';

/**
 * @param {HTMLDivElement} card
 */
function decorateCard(card) {
  card.classList.add('docs-cards-card');
  const [image, content] = card.children;
  image.classList.add('docs-cards-image');
  content.classList.add('docs-cards-content');
  let time;
  let headding;
  let text;
  let button;
  if (content.children.length === 3) {
    [headding, text, button] = content.children;
  }
  if (content.children.length === 4) {
    [time, headding, text, button] = content.children;
  }
  if (time) {
    time.classList.add('docs-cards-time');
    content.removeChild(time);
    headding.appendChild(time);
  }

  headding?.classList.add('docs-cards-heading');
  text?.classList.add('docs-cards-text');
  button?.classList.add('docs-cards-button');

  decorateButtons(button);
}

/**
 *
 * @param {HTMLDivElement} block
 */
export default function decorate(block) {
  if (block.children.length < 3) {
    block.classList.add('docs-cards-two-card-layout');
  }
  [...block.children].forEach(decorateCard);
}
