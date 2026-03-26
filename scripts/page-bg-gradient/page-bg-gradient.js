export default function initLiveGradientBackground() {
  const { body } = document;
  const main = document.querySelector('main');

  if (!body?.classList.contains('page-bg-gradient') || !main) return;

  const isLowEnd = (navigator.hardwareConcurrency ?? 8) <= 4 || (navigator.deviceMemory ?? 8) <= 4;
  if (isLowEnd) body.classList.add('low-gpu');

  const applyQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    const parseDuration = (key) => {
      const v = parseFloat(params.get(key));
      return Number.isFinite(v) ? `${clamp(v, 2, 20)}s` : null;
    };

    const parseScale = (key) => {
      const v = parseFloat(params.get(key));
      return Number.isFinite(v) ? clamp(v, 0.2, 3) : null;
    };

    const blue = parseDuration('blue');
    const pink = parseDuration('pink');
    const orange = parseDuration('orange');
    const width = parseScale('width');
    const height = parseScale('height');

    if (blue) body.style.setProperty('--lg-blue-duration', blue);
    if (pink) body.style.setProperty('--lg-pink-duration', pink);
    if (orange) body.style.setProperty('--lg-orange-duration', orange);
    if (width !== null) body.style.setProperty('--lg-circle-width-scale', width);
    if (height !== null) body.style.setProperty('--lg-circle-height-scale', height);
  };

  applyQueryParams();

  const updateCircleSize = () => {
    const circleSize = `${main.offsetHeight * 0.6}px`;
    body.style.setProperty('--lg-circle-size', circleSize);
  };

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

  updateCircleSize();

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(createLiveGradientCircles, { timeout: 2000 });
  } else {
    window.setTimeout(createLiveGradientCircles, 1200);
  }
}
