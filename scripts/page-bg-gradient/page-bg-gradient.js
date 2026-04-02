export default function initLiveGradientBackground() {
  const { body } = document;
  const main = document.querySelector('main');

  if (!body?.classList.contains('page-bg-gradient') || !main) return;

  const MOBILE_BREAKPOINT = 768;

  const updateCircleSize = () => {
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      body.style.removeProperty('--gradient-circle-size');
      return;
    }

    const height = main.offsetHeight;
    if (height > 0) {
      body.style.setProperty('--gradient-circle-size', `${height * 0.6}px`);
    }
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

  createLiveGradientCircles();
  updateCircleSize();

  window.addEventListener('resize', updateCircleSize);
  window.addEventListener('orientationchange', updateCircleSize);
  window.addEventListener('pageshow', updateCircleSize);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') updateCircleSize();
  });
}
