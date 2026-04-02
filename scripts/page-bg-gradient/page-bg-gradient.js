export default function initLiveGradientBackground() {
  const { body } = document;
  const main = document.querySelector('main');

  if (!body?.classList.contains('page-bg-gradient') || !main) return;
  let rafId = null;
  let retryCount = 0;
  const MAX_RETRIES = 10;

  const updateCircleSize = () => {
    const height = main.offsetHeight;

    if (height > 0) {
      body.style.setProperty('--gradient-circle-size', `${height * 0.6}px`);
      retryCount = 0;
      return;
    }

    if (retryCount >= MAX_RETRIES) return;
    retryCount += 1;
    rafId = requestAnimationFrame(updateCircleSize);
  };

  const scheduleUpdate = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(updateCircleSize);
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
  scheduleUpdate();

  let resizeTimeoutId = null;
  const onResize = () => {
    if (resizeTimeoutId) clearTimeout(resizeTimeoutId);
    resizeTimeoutId = setTimeout(scheduleUpdate, 120);
  };

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', scheduleUpdate, { passive: true });
  window.addEventListener('pageshow', scheduleUpdate, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleUpdate();
  });
}
