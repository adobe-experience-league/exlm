export default function initLiveGradientBackground() {
  const { body } = document;
  const main = document.querySelector('main');

  if (!body?.classList.contains('page-bg-gradient') || !main) return;

  const createLiveGradientCircles = () => {
    if (main.querySelector('.gradient-layer')) return;

    const circlesWrapper = document.createElement('div');
    circlesWrapper.className = 'gradient-layer';
    circlesWrapper.setAttribute('aria-hidden', 'true');
    circlesWrapper.setAttribute('role', 'presentation');

    ['gradient-circle-blue', 'gradient-circle-pink', 'gradient-circle-orange'].forEach((colorClass) => {
      const circle = document.createElement('div');
      circle.className = `gradient-circle ${colorClass}`;
      circle.setAttribute('aria-hidden', 'true');
      circle.setAttribute('role', 'presentation');
      circlesWrapper.appendChild(circle);
    });

    main.prepend(circlesWrapper);
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(createLiveGradientCircles, { timeout: 2000 });
  } else {
    window.setTimeout(createLiveGradientCircles, 1200);
  }
}
