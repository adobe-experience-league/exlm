export default function initLiveGradientBackground() {
  const { body } = document;
  const main = document.querySelector('main');

  if (!body?.classList.contains('page-bg-gradient') || !main) return;

  const updateCircleSize = () => {
    const circleSize = `${main.offsetHeight * 0.6}px`;
    let sizeStyle = document.head.querySelector('#gradient-circle-size-override');
    if (!sizeStyle) {
      sizeStyle = document.createElement('style');
      sizeStyle.id = 'gradient-circle-size-override';
      document.head.append(sizeStyle);
    }
    sizeStyle.textContent = `.page-bg-gradient { --gradient-circle-size: ${circleSize}; }`;
  };

  const createLiveGradientCircles = () => {
    if (main.querySelector('.gradient-layer')) return;

    const circlesWrapper = document.createElement('div');
    circlesWrapper.className = 'gradient-layer';
    circlesWrapper.setAttribute('aria-hidden', 'true');
    circlesWrapper.setAttribute('role', 'presentation');

    ['gradient-circle-primary', 'gradient-circle-secondary', 'gradient-circle-accent'].forEach((colorClass) => {
      const circle = document.createElement('div');
      circle.className = `gradient-circle ${colorClass}`;
      circle.setAttribute('aria-hidden', 'true');
      circle.setAttribute('role', 'presentation');
      circlesWrapper.appendChild(circle);
    });

    main.prepend(circlesWrapper);
  };

  // Inject the gradient layer immediately so it's visible as soon as the CSS applies.
  // Skip updateCircleSize here — main.offsetHeight is too small before blocks render.
  createLiveGradientCircles();

  // Update circle size exactly once after all blocks are loaded and the page height
  // is stable. Using window.load instead of ResizeObserver avoids repeated GPU layer
  // repaints on every block load (each repaint of a filter:blur composited element
  // is expensive, especially on mobile GPUs).
  window.addEventListener('load', updateCircleSize, { once: true });
}
