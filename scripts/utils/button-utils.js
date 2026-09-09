/**
 * Decorates button elements by assigning appropriate classes and styles based on their type, text color, and background color.
 *
 * @param {...HTMLElement} buttonElements - One or more button container elements, each containing child elements with button type, custom color, hex code, text color, and a link (`<a>`).
 * @returns {string} - A string containing the modified button `<a>` elements with the appropriate classes and styles applied.
 */
export default function decorateCustomButtons(...buttonElements) {
  const buttonTypeClasses = {
    primary: 'primary',
    secondary: 'secondary',
    tertiary: 'tertiary',
    custom: 'custom',
  };

  const textColorClasses = {
    white: 'text-white',
    black: 'text-black',
  };

  return buttonElements
    .filter((buttonElement) => buttonElement)
    .map((buttonElement) => {
      const link = buttonElement.querySelector('a');
      if (!link) return ''; // Early return for elements without a link

      const [buttonType, buttonCustomColor, buttonHexCode, buttonTextColor] = [...buttonElement.children].map((child) =>
        child.textContent.trim(),
      );

      link.classList.add('button');

      // Assign button type class if it exists
      if (buttonType in buttonTypeClasses) {
        link.classList.add(buttonTypeClasses[buttonType]);
      }

      if (buttonType === 'custom') {
        // Assign text color class
        if (buttonTextColor in textColorClasses) {
          link.classList.add(textColorClasses[buttonTextColor]);
        }

        // Apply background color (spectrum or hexcode)
        if (buttonCustomColor !== 'custom-hexcode') {
          link.style.backgroundColor = `var(${buttonCustomColor})`;
        } else if (buttonHexCode) {
          link.style.backgroundColor = `#${buttonHexCode}`;
        }
      }

      return link.outerHTML;
    })
    .join('');
}

const CTA_BUTTON_TYPES = ['primary', 'secondary', 'tertiary', 'custom'];

/**
 * Decorates a single CTA link using predefined block-level classes (e.g. `${prefix}-primary`,
 * `${prefix}-bg-spectrum-gray-700`, `${prefix}-text-white`) instead of per-CTA authoring fields,
 * so no color/hex values leak into the page's markdown export.
 *
 * Content authored before a block adopts this pattern stores CTA type/color/hex/text-color as
 * extra sibling cells next to the link (the shape `decorateCustomButtons` expects). Detecting
 * that shape at runtime lets already-published pages keep rendering with their original custom
 * color, unchanged, until they're reopened and re-saved against the new predefined-color fields.
 *
 * @param {HTMLElement} ctaEl - The CTA container cell, expected to hold just the link `<a>`.
 * @param {HTMLElement} block - The block element carrying the predefined `${prefix}-*` classes.
 * @param {string} prefix - The CTA's class prefix, e.g. 'cta1', 'cta2', or 'cta'.
 * @returns {string} - The decorated CTA link's outerHTML, or '' if there is no link.
 */
export function decorateCta(ctaEl, block, prefix) {
  if (!ctaEl) return '';

  if (ctaEl.children.length > 1) {
    return decorateCustomButtons(ctaEl);
  }

  const link = ctaEl.querySelector('a');
  if (!link) return '';

  link.classList.add('button');

  const blockClasses = [...block.classList];
  const typeCls = blockClasses.find((cls) => CTA_BUTTON_TYPES.some((type) => cls === `${prefix}-${type}`));
  const type = typeCls?.slice(prefix.length + 1);

  if (type && type !== 'custom') {
    link.classList.add(type);
  } else if (type === 'custom') {
    const bgCls = blockClasses.find((cls) => cls.startsWith(`${prefix}-bg-`));
    const textCls = blockClasses.find((cls) => cls.startsWith(`${prefix}-text-`));
    if (bgCls) link.style.backgroundColor = `var(--${bgCls.slice(`${prefix}-bg-`.length)})`;
    if (textCls) link.classList.add(textCls.endsWith('white') ? 'text-white' : 'text-black');
  }

  return link.outerHTML;
}
