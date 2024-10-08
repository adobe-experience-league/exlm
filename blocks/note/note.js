import { decorateIcons } from '../../scripts/lib-franklin.js';

const iconMapping = {
  important: 'alert',
  warning: 'warning',
  caution: 'warning',
  error: 'warning',
  success: 'check',
};

export default async function decorate(block) {
  const [noteTypeElement] = [...block.children].map((row) => row.firstElementChild);

  // Shouldn't apply to MD Github pages
  if (noteTypeElement && !noteTypeElement.querySelector('span.icon')) {
    const noteType = noteTypeElement?.textContent.trim().toLowerCase();

    const svgName = iconMapping[noteType] ? iconMapping[noteType] : 'info';
    const iconSpan = document.createElement('span');
    iconSpan.className = `icon icon-${svgName}`;
    noteTypeElement.prepend(iconSpan);

    block.classList.add('note', noteType);
    decorateIcons(block);
    
  }
}
