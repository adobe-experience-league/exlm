export default function initLiveGradientBackground() {
  const { body } = document;
  const main = document.querySelector('main');

  if (!body?.classList.contains('page-bg-gradient') || !main) return;

  const createLiveGradientCircles = () => {
    if (main.querySelector('.gradient-layer')) return;

    // Set --gradient-circle-size ONCE, before circles are inserted into the DOM.
    // Reading scrollHeight here (inside an idle/delayed callback) means the page is
    // largely settled. Setting the variable before DOM insertion means there is no
    // before/after visible change — zero flicker. We never update it again so
    // subsequent lazy-loaded content growing main's height cannot cause a repaint.
    const { scrollHeight = 0 } = main;
    if (scrollHeight > 0) {
      main.style.setProperty('--gradient-circle-size', `${scrollHeight * 0.6}px`);
    }

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

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(createLiveGradientCircles, { timeout: 2000 });
  } else {
    window.setTimeout(createLiveGradientCircles, 1200);
  }
}
