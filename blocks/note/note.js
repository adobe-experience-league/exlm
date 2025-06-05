import { decorateIcons } from '../../scripts/lib-franklin.js';
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
  if (!noteTypeElement) return;

  const noteTypeRaw = noteTypeElement.textContent.trim();
  const noteType = noteTypeRaw.toLowerCase();
  const localizedNoteLabel =
    placeholders?.[`note${noteType.charAt(0).toUpperCase() + noteType.slice(1)}Label`] || noteTypeRaw;

  // Shouldn't apply to MD Github pages
  if (!noteTypeElement.querySelector('span.icon')) {
    const svgName = iconMapping[noteType] ? iconMapping[noteType] : 'info';
    const iconSpan = document.createElement('span');
    iconSpan.className = `icon icon-${svgName}`;
    noteTypeElement.prepend(iconSpan);

    block.classList.add('note', noteType);
    decorateIcons(block);
  }

  const textNode = [...noteTypeElement.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode) {
    textNode.textContent = ` ${localizedNoteLabel}`;
  } else {
    noteTypeElement.append(` ${localizedNoteLabel}`);
  }
}
