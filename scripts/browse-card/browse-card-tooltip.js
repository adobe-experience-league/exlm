import { decorateIcons } from '../lib-franklin.js';
/**
 * Creates a tooltip and attaches event listeners to show/hide it.
 * @param {HTMLElement} container - The HTML element serving as the tooltip container.
 * @param {HTMLElement} element - The HTML element to which the tooltip is attached.
 * @param {object} config - The configuration of the tooltip.
 */
export const createTooltip = (container, element, config) => {
  const { position = 'right', color = 'blue', content } = config;

  /**
   * Handles tooltip-related events (e.g., mouseover, mouseout, click).
   * @param {Event} event - The event object.
   */
  const handleTooltipEvent = (event) => {
    try {
      const tooltipText = element.querySelector('.tooltip-text');
      if (event.type === 'mouseover' || event.type === 'mouseenter' || event.type === 'click') {
        tooltipText.classList.add('tooltip-visible');
        if (position === 'top') {
          const topSpacer = 5;
          const leftSpacer = 5;
          tooltipText.style.top = `${element.offsetTop - container.scrollTop - tooltipText.offsetHeight - topSpacer}px`;
          tooltipText.style.left = `${element.offsetLeft - container.scrollLeft + leftSpacer}px`;
        } else {
          const topSpacer = 3;
          tooltipText.style.top = `${
            element.offsetTop - tooltipText.offsetHeight / 2 + element.offsetHeight + topSpacer
          }px`;
          tooltipText.style.left = `${element.offsetLeft + element.offsetWidth}px`;
        }
      } else if (event.type === 'mouseout' || event.type === 'mouseleave') {
        tooltipText.classList.remove('tooltip-visible');
        tooltipText.style.left = '-999px';
      }
    } catch {
      // eslint-disable-next-line no-console
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
    decorateIcons(element);
    attachTooltipEvents();
  };

  // Initialize the tooltip when the function is called.
  init();
};

/**
 * Hides all tooltips when the container is scrolled.
 * @param {HTMLElement} container - The HTML element serving as the tooltip container.
 */
export const hideTooltipOnScroll = (container) => {
  /**
   * Handles the scroll event on the container to hide all the tooltips.
   */
  const handleContainerScroll = () => {
    const tooltips = container.querySelectorAll('.tooltip-text');
    tooltips.forEach((elem) => {
      elem.style.left = '-999px';
      elem.classList.remove('tooltip-visible');
    });
  };

  const resizeObserver = new ResizeObserver(() => {
    if (container.scrollWidth > container.clientWidth) {
      // Add scroll event listener when the container is scrollable
      container.addEventListener('scroll', handleContainerScroll);
    }
  });

  resizeObserver.observe(container);
};
