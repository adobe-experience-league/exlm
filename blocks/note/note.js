import { decorateIcons } from '../../scripts/lib-franklin.js';
// const iconMapping = {
//     "note": "info"
// }

export default function decorate(block) {
  console.log(window.hlx.codeBasePath);
  const span = document.createElement('span');
  span.className = 'icon icon-info';
  block.prepend(span);
  decorateIcons(block);
}
