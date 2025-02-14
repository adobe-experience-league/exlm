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
