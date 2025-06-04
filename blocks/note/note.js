import { decorateIcons, toCamelCase } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

const iconMapping = {
  important: 'alert',
  warning: 'warning',
  caution: 'warning',
  error: 'warning',
  success: 'check',
};

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const [noteTypeElement] = [...block.children].map((row) => row.firstElementChild);
  noteTypeElement.textContent =
    placeholders?.[`note${toCamelCase(noteTypeElement.textContent)}Label`] || noteTypeElement.textContent;

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
