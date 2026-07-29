const STORAGE_KEY = 'exlm-gradient-color-picker';

function rgbStringToHex(colorString, fallback) {
  const trimmed = colorString?.trim();
  if (!trimmed) return fallback;
  // Custom properties return the raw declared value (not normalized like computed
  // properties are), so a theme that declares hex already comes through as hex.
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase();
  const match = trimmed.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (!match) return fallback;
  const toHex = (n) => Number(n).toString(16).padStart(2, '0');
  return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
}

function readState(defaults) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {
    /* ignore malformed storage */
  }
  return { ...defaults };
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore storage errors (e.g. private browsing) */
  }
}

export default function initGradientColorPicker() {
  const { body } = document;
  if (!body?.classList.contains('page-bg-gradient') || document.getElementById('gradient-color-picker')) return;

  const computed = getComputedStyle(body);
  const defaults = {
    baseBg: rgbStringToHex(computed.getPropertyValue('--gradient-base-bg'), '#f0f1f6'),
    primary: rgbStringToHex(computed.getPropertyValue('--gradient-primary'), '#b5deff'),
    secondary: rgbStringToHex(computed.getPropertyValue('--gradient-secondary'), '#fa4aa2'),
    accent: rgbStringToHex(computed.getPropertyValue('--gradient-accent'), '#ff7c65'),
    opacityPrimary: 50,
    opacitySecondary: 30,
    opacityAccent: 30,
    blur: 120,
    duration: 8,
  };

  const state = readState(defaults);

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #gradient-color-picker {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      z-index: 9999;
      font-family: system-ui, sans-serif;
      font-size: 12px;
      background: rgb(255 255 255 / 95%);
      border: 1px solid rgb(0 0 0 / 12%);
      border-right: none;
      border-radius: 8px 0 0 8px;
      box-shadow: -4px 0 16px rgb(0 0 0 / 15%);
      padding: 10px 12px;
      min-width: 210px;
      max-height: 85vh;
      overflow-y: auto;
    }
    #gradient-color-picker h3 {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 600;
      color: #333;
    }
    #gradient-color-picker .row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    #gradient-color-picker .row label { flex: 0 0 84px; color: #444; }
    #gradient-color-picker .row input[type="range"] { flex: 1; min-width: 0; }
    #gradient-color-picker .row input[type="color"] { flex: 1; height: 22px; padding: 0; border: 1px solid rgb(0 0 0 / 15%); }
    #gradient-color-picker .row .val { flex: 0 0 32px; text-align: right; color: #666; }
    #gradient-color-picker-toggle {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      z-index: 9998;
      width: 28px;
      height: 56px;
      border: 1px solid rgb(0 0 0 / 12%);
      border-right: none;
      border-radius: 6px 0 0 6px;
      background: rgb(248 248 248);
      cursor: pointer;
    }
    #gradient-color-picker-clear {
      width: 100%;
      margin-top: 10px;
      padding: 6px 10px;
      font-size: 12px;
      color: #333;
      background: rgb(240 240 240);
      border: 1px solid rgb(0 0 0 / 15%);
      border-radius: 4px;
      cursor: pointer;
    }
  `;
  document.head.append(styleEl);

  function applyState() {
    body.style.setProperty('--gradient-base-bg', state.baseBg);
    body.style.setProperty('--gradient-primary', state.primary);
    body.style.setProperty('--gradient-secondary', state.secondary);
    body.style.setProperty('--gradient-accent', state.accent);
    body.style.setProperty('--gradient-blur', `${state.blur}px`);
    body.style.setProperty('--gradient-duration-primary', `${state.duration}s`);
    body.style.setProperty('--gradient-duration-secondary', `${state.duration}s`);
    body.style.setProperty('--gradient-duration-accent', `${state.duration}s`);

    const primaryCircle = document.querySelector('.gradient-circle-primary');
    const secondaryCircle = document.querySelector('.gradient-circle-secondary');
    const accentCircle = document.querySelector('.gradient-circle-accent');
    if (primaryCircle) primaryCircle.style.opacity = state.opacityPrimary / 100;
    if (secondaryCircle) secondaryCircle.style.opacity = state.opacitySecondary / 100;
    if (accentCircle) accentCircle.style.opacity = state.opacityAccent / 100;
  }

  function addRow(parent, label, input, valSpan) {
    const row = document.createElement('div');
    row.className = 'row';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    row.append(labelEl, input);
    if (valSpan) row.append(valSpan);
    parent.append(row);
    return row;
  }

  function addColorInput(parent, label, key) {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = state[key];
    input.addEventListener('input', () => {
      state[key] = input.value;
      applyState();
      writeState(state);
    });
    addRow(parent, label, input);
  }

  function addSlider(parent, label, key, min, max, suffix = '') {
    const valSpan = document.createElement('span');
    valSpan.className = 'val';
    valSpan.textContent = state[key] + suffix;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.value = String(state[key]);
    input.addEventListener('input', () => {
      state[key] = Number(input.value);
      valSpan.textContent = state[key] + suffix;
      applyState();
      writeState(state);
    });
    addRow(parent, label, input, valSpan);
  }

  const panel = document.createElement('div');
  panel.id = 'gradient-color-picker';

  const heading = document.createElement('h3');
  heading.textContent = 'Page gradient colors';
  panel.append(heading);

  addColorInput(panel, 'Base BG', 'baseBg');
  addColorInput(panel, 'Primary', 'primary');
  addSlider(panel, 'Primary op.', 'opacityPrimary', 0, 100, '%');
  addColorInput(panel, 'Secondary', 'secondary');
  addSlider(panel, 'Secondary op.', 'opacitySecondary', 0, 100, '%');
  addColorInput(panel, 'Accent', 'accent');
  addSlider(panel, 'Accent op.', 'opacityAccent', 0, 100, '%');
  addSlider(panel, 'Blur', 'blur', 20, 200, 'px');
  addSlider(panel, 'Anim speed', 'duration', 3, 30, 's');

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.id = 'gradient-color-picker-toggle';
  toggleBtn.setAttribute('aria-label', 'Toggle gradient color picker');
  toggleBtn.textContent = '◀';
  let visible = true;
  toggleBtn.addEventListener('click', () => {
    visible = !visible;
    panel.style.display = visible ? '' : 'none';
    toggleBtn.textContent = visible ? '◀' : '▶';
  });

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.id = 'gradient-color-picker-clear';
  clearBtn.textContent = 'Reset to defaults';
  clearBtn.addEventListener('click', () => {
    // Color defaults are read from computed style, which still reflects these inline
    // overrides until removed — otherwise the "reset" just re-reads the dirty values.
    ['--gradient-base-bg', '--gradient-primary', '--gradient-secondary', '--gradient-accent'].forEach((prop) =>
      body.style.removeProperty(prop),
    );
    localStorage.removeItem(STORAGE_KEY);
    panel.remove();
    toggleBtn.remove();
    styleEl.remove();
    // eslint-disable-next-line no-use-before-define
    initGradientColorPicker();
  });
  panel.append(clearBtn);

  document.body.append(toggleBtn, panel);

  // Circles are created asynchronously by page-bg-gradient.js (requestIdleCallback/setTimeout),
  // so wait for them to exist before applying opacity to them.
  const applyWhenCirclesExist = () => {
    if (document.querySelector('.gradient-circle-primary')) {
      applyState();
      return;
    }
    setTimeout(applyWhenCirclesExist, 200);
  };
  applyWhenCirclesExist();
}
