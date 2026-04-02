function isNarrowViewport() {
  return window.matchMedia('(max-width: 900px)').matches;
}

function cappedGradientCircleBasePx(mainHeightPx) {
  const raw = Math.round(mainHeightPx * 0.6);
  if (!isNarrowViewport()) return raw;
  const vvh = window.visualViewport?.height ?? window.innerHeight;
  const cap = Math.max(1400, Math.round(vvh * 3.5));
  return Math.min(raw, cap);
}

export default function initLiveGradientBackground() {
  const { body } = document;
  const main = document.querySelector('main');

  if (!body?.classList.contains('page-bg-gradient') || !main) return;
  const updateCircleSize = () => {
    const circleSize = `${cappedGradientCircleBasePx(main.offsetHeight)}px`;
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

  updateCircleSize();

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(createLiveGradientCircles, { timeout: 2000 });
  } else {
    window.setTimeout(createLiveGradientCircles, 1200);
  }
}
