const observedMains = new WeakSet();

export default function initLiveGradientBackground() {
  const { body } = document;
  const main = document.querySelector('main');

  if (!body?.classList.contains('page-bg-gradient') || !main) return;

  let lastCircleSizePx = '';
  let debounceTimer;

  const applyCircleSizeFromMain = () => {
    const circleSize = `${Math.round(main.offsetHeight * 0.6)}px`;
    if (circleSize === lastCircleSizePx) return;
    lastCircleSizePx = circleSize;
    body.style.setProperty('--gradient-circle-size', circleSize);
  };

  const scheduleCircleSizeFromMain = () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(applyCircleSizeFromMain, 150);
  };

  const bindMainResizeSizing = () => {
    applyCircleSizeFromMain();
    if (observedMains.has(main)) return;
    observedMains.add(main);
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(scheduleCircleSizeFromMain);
      ro.observe(main);
    } else {
      window.addEventListener('resize', scheduleCircleSizeFromMain, { passive: true });
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

  const run = () => {
    createLiveGradientCircles();
    bindMainResizeSizing();
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2000 });
  } else {
    window.setTimeout(run, 1200);
  }
}
