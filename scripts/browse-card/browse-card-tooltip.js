/**
 * Creates a tooltip and attaches event listeners to show/hide it.
 * @param {HTMLElement} element - The HTML element to which the tooltip is attached.
 * @param {object} config - The config of the tooltip.
 */
const createTooltip = (container, element, config) => {
  const { position = 'right', color = 'blue', content } = config;

  /**
   * Creates HTML content for the tooltip.
   * @returns {string} - The HTML content for the tooltip.
   */
  const createTooltipHTML = () => `
      <div class="tooltip tooltip-${position} tooltip-${color}">
        <span class="icon icon-info"></span><span class="tooltip-text">${content}</span>
      </div>
    `;

  /**
   * Initializes the TooltipHandler by creating and appending the tooltip element.
   */
  const init = () => {
    element.innerHTML = createTooltipHTML();
  };

  // Initialize the tooltip when the function is called.
  init();
};

export default createTooltip;
