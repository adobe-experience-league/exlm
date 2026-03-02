export default function initLiveGradientBackground() {
  const shouldCreateLiveGradient = () => {
    const { body } = document;
    const main = document.querySelector('main');
    if (!body?.classList.contains('live-gradient-bg') || !main) {
      return false;
    }
    return true;
  };

  const createLiveGradientCircles = () => {
    if (!shouldCreateLiveGradient()) return;
    const main = document.querySelector('main');
    if (main.querySelector('.bg-circles-wrapper')) return;

    const circlesWrapper = document.createElement('div');
    circlesWrapper.className = 'bg-circles-wrapper';
    circlesWrapper.setAttribute('aria-hidden', 'true');
    circlesWrapper.setAttribute('role', 'presentation');

    ['bg-blue', 'bg-pink', 'bg-orange'].forEach((colorClass) => {
      const circle = document.createElement('div');
      circle.className = colorClass;
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
