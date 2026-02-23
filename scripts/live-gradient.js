(function liveGradientBackground() {
  const shouldCreate = () => {
    if (!document.body) return false;
    if (!document.body.classList.contains('live-gradient-bg')) return false;
    // Avoid on small viewports
    if (!window.matchMedia || !window.matchMedia('(min-width: 640px)').matches) return false;
    // Respect reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    // Already injected?
    if (document.body.querySelector('.bg-circle')) return false;
    return true;
  };

  const createCircles = () => {
    if (!shouldCreate()) return;

    const circleClasses = ['bg-blue', 'bg-pink', 'bg-orange'];

    circleClasses.forEach((cls) => {
      const div = document.createElement('div');
      div.className = `bg-circle ${cls}`;
      div.setAttribute('aria-hidden', 'true');
      div.setAttribute('role', 'presentation');
      document.body.appendChild(div);
    });
  };

  const scheduleCreation = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(createCircles, { timeout: 2000 });
    } else {
      // fallback: small delay after load
      setTimeout(createCircles, 1200);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleCreation, { once: true });
  } else {
    scheduleCreation();
  }
}());
