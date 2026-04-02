const observedMains = new WeakSet();

function isNarrowViewport() {
  return window.matchMedia('(max-width: 900px)').matches;
}

/** Blurred ellipses do not need full document-sized layers; huge sizes + blur + animation stress mobile GPUs and flicker on repaint. */
function cappedCircleBasePx(mainHeightPx) {
  const raw = Math.round(mainHeightPx * 0.6);
  if (!isNarrowViewport()) return raw;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const cap = Math.max(1400, Math.round(vh * 3.5));
  return Math.min(raw, cap);
}

export default function initLiveGradientBackground() {
  const { body } = document;
  const main = document.querySelector('main');

  if (!body?.classList.contains('page-bg-gradient') || !main) return;

  let lastCircleSizePx = '';
  let debounceTimer;

  const applyCircleSizeFromMain = () => {
    const circleSize = `${cappedCircleBasePx(main.offsetHeight)}px`;
    if (circleSize === lastCircleSizePx) return;
    lastCircleSizePx = circleSize;
    body.style.setProperty('--gradient-circle-size', circleSize);
  };

  const scheduleCircleSizeFromMain = () => {
    window.clearTimeout(debounceTimer);
    const ms = isNarrowViewport() ? 450 : 150;
    debounceTimer = window.setTimeout(applyCircleSizeFromMain, ms);
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
