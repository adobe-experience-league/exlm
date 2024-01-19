/**
 * Creates a tooltip and attaches event listeners to show/hide it.
 * @param {HTMLElement} element - The HTML element to which the tooltip is attached.
 * @param {object} config - The config of the tooltip.
 */
const createTooltip = (container, element, config) => {
  const { position, color = 'blue', content } = config;

  /**
   * Handles tooltip-related events (e.g., mouseover, mouseout, click).
   * @param {Event} event - The event object.
   */
  const handleTooltipEvent = (event) => {
    try {
      const tooltipText = element.querySelector('.tooltip-text');
      const topSpacer = 5;
      const leftSpacer = 4;
      if (event.type === 'mouseover' || event.type === 'mouseenter' || event.type === 'click') {
        tooltipText.classList.add('tooltip-visible');
        if (position === 'top') {
          tooltipText.style.top = `${element.offsetTop - container.scrollTop - tooltipText.offsetHeight - topSpacer}px`;
          tooltipText.style.left = `${element.offsetLeft - container.scrollLeft + leftSpacer}px`;
        } else {
          tooltipText.style.top = `${element.offsetTop + tooltipText.offsetHeight / 2}px`;
          tooltipText.style.left = `${element.offsetLeft + element.offsetWidth}px`;
        }
      } else if (event.type === 'mouseout' || event.type === 'mouseleave') {
        tooltipText.classList.remove('tooltip-visible');
        tooltipText.style.left = '-999px';
      }
    } catch (e) {
      console.error('Error on tooltip');
    }
  };

  /**
   * Attaches tooltip-related events to the specified HTML element.
   */
  const attachTooltipEvents = () => {
    if (element) {
      element.addEventListener('mouseenter', handleTooltipEvent);
      element.addEventListener('mouseleave', handleTooltipEvent);
      element.addEventListener('click', handleTooltipEvent);
    }
  };

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
    attachTooltipEvents();
  };

  // Initialize the tooltip when the function is called.
  init();
};

export default createTooltip;
