export default function initLiveGradientBackground() {
  const { body } = document;
  const main = document.querySelector('main');

  if (!body?.classList.contains('page-bg-gradient') || !main) return;

  const isLowEnd = (navigator.hardwareConcurrency ?? 8) <= 4 || (navigator.deviceMemory ?? 8) <= 4;
  if (isLowEnd) body.classList.add('low-gpu');

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

  const createControlPanel = () => {
    if (body.querySelector('.gradient-control-panel')) return;

    const CIRCLES = [
      { key: 'blue', label: 'Blue', defaultDuration: 2 },
      { key: 'pink', label: 'Pink', defaultDuration: 4 },
      { key: 'orange', label: 'Orange', defaultDuration: 6 },
    ];

    const panel = document.createElement('div');
    panel.className = 'gradient-control-panel';

    // Header tab (always visible, acts as toggle)
    const header = document.createElement('div');
    header.className = 'gradient-control-header';

    const title = document.createElement('span');
    title.className = 'gradient-control-title';
    title.textContent = 'Controls';

    const toggle = document.createElement('button');
    toggle.className = 'gradient-control-toggle';
    toggle.setAttribute('aria-label', 'Toggle animation controls panel');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.textContent = '›';

    header.appendChild(title);
    header.appendChild(toggle);
    panel.appendChild(header);

    // Content area
    const content = document.createElement('div');
    content.className = 'gradient-control-content';

    const addSection = (label) => {
      const section = document.createElement('p');
      section.className = 'gradient-control-section';
      section.textContent = label;
      content.appendChild(section);
    };

    const addSlider = ({ label, min, max, step, defaultValue, onInput }) => {
      const group = document.createElement('div');
      group.className = 'gradient-control-group';

      const labelEl = document.createElement('label');
      labelEl.className = 'gradient-control-label';

      const nameEl = document.createElement('span');
      nameEl.textContent = label;

      const valueEl = document.createElement('span');
      valueEl.className = 'gradient-control-value';

      labelEl.appendChild(nameEl);
      labelEl.appendChild(valueEl);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = min;
      slider.max = max;
      slider.step = step;
      slider.value = defaultValue;
      slider.className = 'gradient-control-slider';

      const update = () => {
        valueEl.textContent = onInput(parseFloat(slider.value));
      };

      update(); // Sync display on init
      slider.addEventListener('input', update);

      group.appendChild(labelEl);
      group.appendChild(slider);
      content.appendChild(group);
    };

    // Speed controls
    addSection('Speed');
    CIRCLES.forEach(({ key, label, defaultDuration }) => {
      addSlider({
        label,
        min: 2,
        max: 20,
        step: 1,
        defaultValue: defaultDuration,
        onInput: (seconds) => {
          body.style.setProperty(`--lg-anim-duration-${key}`, `${seconds}s`);
          return `${seconds}s`;
        },
      });
    });

    // Blur control
    addSection('Blur');
    addSlider({
      label: 'Intensity',
      min: 0,
      max: 200,
      step: 5,
      defaultValue: 120,
      onInput: (value) => {
        body.style.setProperty('--lg-blur', `${value}px`);
        return `${value}px`;
      },
    });

    panel.appendChild(content);

    // Toggle handler
    header.addEventListener('click', () => {
      const isCollapsed = panel.hasAttribute('data-collapsed');
      if (isCollapsed) {
        panel.removeAttribute('data-collapsed');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.textContent = '›';
      } else {
        panel.setAttribute('data-collapsed', '');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '‹';
      }
    });

    body.appendChild(panel);
  };

  updateCircleSize();

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(
      () => {
        createLiveGradientCircles();
        createControlPanel();
      },
      { timeout: 2000 },
    );
  } else {
    window.setTimeout(() => {
      createLiveGradientCircles();
      createControlPanel();
    }, 1200);
  }
}
