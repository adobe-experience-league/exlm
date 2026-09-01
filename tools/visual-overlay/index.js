// eslint-disable-next-line import/no-relative-packages
import { OVERLAY, VIEWPORTS } from '../visual-tests/config.js';

class VisualOverlay {
  constructor() {
    this.isActive = false;
    this.opacity = 0.5;
    this.position = { x: 0, y: 0 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.overlayContainer = null;
    this.toolbar = null;
    this.viewportConfig = VIEWPORTS || [
      { width: '320px', height: '568px', label: 'mobile' },
      { width: '768px', height: '1024px', label: 'tablet' },
      { width: '1024px', height: '768px', label: 'desktop' },
      { width: '1440px', height: '900px', label: 'large' },
    ];
    this.imageRoot = OVERLAY.imageRoot || '/tools/visual-tests/blocks';
    this.setImageDimensions();
  }

  // eslint-disable-next-line class-methods-use-this
  getComponentStyles() {
    const componentContainer = document.querySelector('main.sidekick-library > div.section[data-section-status="loaded"] > div');
    const computedStyle = window.getComputedStyle(componentContainer);
    return {
      width: computedStyle.width,
      height: computedStyle.height,
      paddingLeft: computedStyle.paddingLeft,
      paddingRight: computedStyle.paddingRight,
      paddingTop: computedStyle.paddingTop,
      paddingBottom: computedStyle.paddingBottom,
      marginTop: computedStyle.marginTop,
      marginLeft: computedStyle.marginLeft,
      marginBottom: computedStyle.marginBottom,
      marginRight: computedStyle.marginRight,
    };
  }

  updateOverlayStyles() {
    const visualOverlay = document.getElementById('visual-overlay-container');
    if (!visualOverlay) return;

    const picture = visualOverlay.querySelector('picture');
    const img = picture?.querySelector('img');
    if (!picture || !img) return;

    const {
      width: containerWidth,
      height: containerHeight,
      marginBottom,
      marginLeft,
      marginRight,
      marginTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
      paddingTop,
    } = this.getComponentStyles();

    // Set picture styles
    picture.style.cssText = `
      position: absolute;
      top: ${marginTop};
      right: ${marginRight};
      bottom: ${marginBottom};
      left: ${marginLeft};
      padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft};
      width: ${containerWidth};
      height: ${containerHeight};
      pointer-events: none;
    `;

    // Set image size
    img.style.width = containerWidth;
    img.style.height = containerHeight;
  }

  setImageDimensions() {
    this.spActionGroup = window.parent?.document
      ?.querySelector('sidekick-library')?.shadowRoot
      ?.querySelector('sp-theme')
      ?.querySelector('plugin-renderer')?.shadowRoot
      ?.querySelector('sp-action-group');

    this.spActionGroup?.querySelectorAll('sp-action-button').forEach((button) => {
      button.addEventListener('click', () => {
        setTimeout(() => {
          this.updateOverlayStyles();
        }, 200);
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getComponentName() {
    return window.parent?.window?.location?.search?.split('path=')[1]?.split('&')[0]?.split('/')?.pop();
  }

  // eslint-disable-next-line class-methods-use-this
  getVariationIndex() {
    // Extract the variation index from the query string after 'path='
    const query = window.parent?.window?.location?.search?.split('path=')[1];
    if (query) {
      const params = query.split('&');
      for (let i = 0; i < params.length; i += 1) {
        if (params[i].startsWith('index=')) {
          return params[i].split('=')[1];
        }
      }
    }
    return '0';
  }

  // eslint-disable-next-line class-methods-use-this
  getCurrentViewport() {
    const themeRoot = window.parent?.window?.document?.querySelector('sidekick-library')?.shadowRoot.querySelector('sp-theme');
    const activeButton = themeRoot?.querySelector('plugin-renderer')?.shadowRoot.querySelector('sp-action-button[aria-pressed="true"]');
    return activeButton?.getAttribute('data-viewport') || 'desktop';
  }

  createToggleButton() {
    const button = document.createElement('button');
    button.id = 'visual-overlay-toggle';
    button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 202.83 202.83" style="color: inherit; animation: auto ease 0s 1 normal none running none;">
        <path d="M198.933 66.346h-62.345V4.001c0-2.152-1.743-3.897-3.897-3.897H4.105C1.951.105.208 1.85.208 4.001v37.958a3.9 3.9 0 000 2.502v88.126c0 2.152 1.743 3.897 3.897 3.897H66.45v62.345c0 2.152 1.743 3.897 3.897 3.897h128.586c2.154 0 3.897-1.745 3.897-3.897V70.243c-.001-2.152-1.744-3.897-3.897-3.897zm-70.138-17.2l-17.2 17.2h-35.74l52.939-52.938v35.738zm-6.18 17.2l6.18-6.18v6.18h-6.18zm6.18 7.793v54.552H74.243V74.139h54.552zM8.002 7.898h25.66L8.002 33.56V7.898zm0 36.682L43.927 8.653c.223-.223.344-.497.502-.755h32.096L8.002 76.42V44.58zm58.448 84.111h-6.18l6.18-6.18v6.18zm0-17.199l-17.2 17.2H13.51l52.94-52.939v35.739zM8.002 123.179V87.18c.265-.16.547-.286.776-.516L86.762 8.68c.231-.231.358-.515.519-.782h36.003L8.002 123.179zm187.034 71.753H74.243v-58.448h58.448c2.154 0 3.897-1.745 3.897-3.897V74.139h58.448v120.793z" fill="currentColor"/>
    </svg>
    Toggle Overlay
    `;
    button.style.cssText = `
      background: none;
      border: 1px solid var(--spectrum-global-color-gray-700);
      cursor: pointer;
      padding: 8px;
      color: var(--spectrum-global-color-gray-700);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
      margin-left: 10px;
    `;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggleOverlay();
    });
    return button;
  }

  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'visual-overlay-toolbar';
    toolbar.style.cssText = `
              position: fixed;
      top: 20px;
      left: 20px;
      background: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      z-index: 10000;
      cursor: default;
    `;

    // Grab icon (drag handle)
    const grabHandle = document.createElement('span');
    grabHandle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="5" r="1"></circle>
        <circle cx="9" cy="12" r="1"></circle>
        <circle cx="9" cy="19" r="1"></circle>
        <circle cx="15" cy="5" r="1"></circle>
        <circle cx="15" cy="12" r="1"></circle>
        <circle cx="15" cy="19" r="1"></circle>
      </svg>
    `;
    grabHandle.style.cssText = `
      cursor: grab;
      display: flex;
      align-items: center;
      user-select: none;
      margin-right: 4px;
    `;

    // Opacity slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = this.opacity;
    slider.style.cssText = `
      width: 100px;
      margin: 0 10px;
      accent-color: #888;
      /* fallback for browsers that support accent-color */
    `;

    // Add custom slider styles for thumb and fill (track before thumb)
    if (!document.getElementById('visual-overlay-slider-style')) {
      const style = document.createElement('style');
      style.id = 'visual-overlay-slider-style';
      style.textContent = `
        #visual-overlay-toolbar input[type="range"] {
          outline: none;
          background: transparent;
          height: 24px;
          /* Ensures enough height for centering the thumb */
        }
        #visual-overlay-toolbar input[type="range"]::-webkit-slider-thumb {
          background: #888;
          border: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          margin-top: -6px; /* Center thumb on 4px track */
          box-shadow: 0 0 1px #888;
        }
        #visual-overlay-toolbar input[type="range"]::-webkit-slider-runnable-track {
          background: linear-gradient(to right, #888 0%, #888 var(--value, 50%), #e0e0e0 var(--value, 50%), #e0e0e0 100%);
          height: 4px;
          border-radius: 2px;
        }
        #visual-overlay-toolbar input[type="range"]::-moz-range-thumb {
          background: #888;
          border: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          box-shadow: 0 0 1px #888;
        }
        #visual-overlay-toolbar input[type="range"]::-moz-range-track {
          background-color: #e0e0e0;
          height: 4px;
          border-radius: 2px;
        }
        #visual-overlay-toolbar input[type="range"]::-moz-range-progress {
          background-color: #888;
          height: 4px;
          border-radius: 2px;
        }
        #visual-overlay-toolbar input[type="range"]::-ms-thumb {
          background: #888;
          border: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          box-shadow: 0 0 1px #888;
        }
        #visual-overlay-toolbar input[type="range"]::-ms-fill-lower {
          background-color: #888;
          height: 4px;
          border-radius: 2px;
        }
        #visual-overlay-toolbar input[type="range"]::-ms-fill-upper {
          background-color: #e0e0e0;
          height: 4px;
          border-radius: 2px;
        }
        #visual-overlay-toolbar input[type="range"]:focus {
          outline: none;
        }
        /* Remove default focus outline for WebKit */
        #visual-overlay-toolbar input[type="range"]::-webkit-focus-outer-border {
          border: 0;
        }
      `;
      document.head.appendChild(style);
    }

    // Opacity label
    const label = document.createElement('span');
    label.textContent = `${Math.round(this.opacity * 100)}%`;
    label.style.cssText = `
      font-size: 12px;
      color: var(--spectrum-global-color-gray-700);
      min-width: 40px;
    `;

    // Eye icon (toggle overlay visibility)
    const eyeBtn = document.createElement('button');
    eyeBtn.type = 'button';
    eyeBtn.setAttribute('aria-label', 'Toggle overlay visibility');
    eyeBtn.style.cssText = `
      border-radius: 4px;
      border: 1px solid #b1b1b1;
      background: none;
      cursor: pointer;
      margin: 0;
      padding: 4px;
      color: var(--spectrum-global-color-gray-600);
      display: flex;
      align-items: center;
    `;
    // SVGs for open and closed eye (new icons)
    const openEyeSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.30147 15.5771C4.77832 14.2684 3.6904 12.7726 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C14.1843 6 16.1261 7.07185 17.6986 8.42294C19.2218 9.73158 20.3097 11.2274 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18C9.81574 18 7.87402 16.9282 6.30147 15.5771ZM12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C2.00757 13.8624 3.23268 15.5772 4.99812 17.0941C6.75717 18.6054 9.14754 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C21.9925 10.1376 20.7674 8.42276 19.002 6.90595C17.2429 5.39462 14.8525 4 12 4ZM10 12C10 10.8954 10.8955 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8955 14 10 13.1046 10 12ZM12 8C9.7909 8 8.00004 9.79086 8.00004 12C8.00004 14.2091 9.7909 16 12 16C14.2092 16 16 14.2091 16 12C16 9.79086 14.2092 8 12 8Z" fill="currentColor"></path>
      </svg>
    `;
    const closedEyeSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M19.7071 5.70711C20.0976 5.31658 20.0976 4.68342 19.7071 4.29289C19.3166 3.90237 18.6834 3.90237 18.2929 4.29289L14.032 8.55382C13.4365 8.20193 12.7418 8 12 8C9.79086 8 8 9.79086 8 12C8 12.7418 8.20193 13.4365 8.55382 14.032L4.29289 18.2929C3.90237 18.6834 3.90237 19.3166 4.29289 19.7071C4.68342 20.0976 5.31658 20.0976 5.70711 19.7071L9.96803 15.4462C10.5635 15.7981 11.2582 16 12 16C14.2091 16 16 14.2091 16 12C16 11.2582 15.7981 10.5635 15.4462 9.96803L19.7071 5.70711ZM12.518 10.0677C12.3528 10.0236 12.1792 10 12 10C10.8954 10 10 10.8954 10 12C10 12.1792 10.0236 12.3528 10.0677 12.518L12.518 10.0677ZM11.482 13.9323L13.9323 11.482C13.9764 11.6472 14 11.8208 14 12C14 13.1046 13.1046 14 12 14C11.8208 14 11.6472 13.9764 11.482 13.9323ZM15.7651 4.8207C14.6287 4.32049 13.3675 4 12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C1.92276 13.7326 2.86706 15.0637 4.21194 16.3739L5.62626 14.9596C4.4555 13.8229 3.61144 12.6531 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C12.7719 6 13.5135 6.13385 14.2193 6.36658L15.7651 4.8207ZM12 18C11.2282 18 10.4866 17.8661 9.78083 17.6334L8.23496 19.1793C9.37136 19.6795 10.6326 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C22.0773 10.2674 21.133 8.93627 19.7881 7.62611L18.3738 9.04043C19.5446 10.1771 20.3887 11.3469 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18Z" fill="currentColor"></path>
      </svg>
    `;
    eyeBtn.innerHTML = openEyeSVG;

    // Make toolbar draggable only by grab handle
    grabHandle.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      toolbar.style.cursor = 'grabbing';
      this.dragStart = {
        x: e.clientX - toolbar.offsetLeft,
        y: e.clientY - toolbar.offsetTop,
      };
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const x = e.clientX - this.dragStart.x;
        const y = e.clientY - this.dragStart.y;
        toolbar.style.left = `${x}px`;
        toolbar.style.top = `${y}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        toolbar.style.cursor = 'default';
      }
    });

    // Slider updates overlay opacity and label in real time
    slider.addEventListener('input', (e) => {
      this.opacity = parseFloat(e.target.value);
      this.updateOverlayOpacity();
      label.textContent = `${Math.round(this.opacity * 100)}%`;
      // For WebKit browsers, update the --value CSS variable
      slider.style.setProperty('--value', `${this.opacity * 100}%`);
    });
    // Set initial value for --value
    slider.style.setProperty('--value', `${this.opacity * 100}%`);

    // Eye button toggles overlay visibility only
    eyeBtn.addEventListener('click', () => {
      const overlay = document.getElementById('visual-overlay');
      if (overlay) {
        if (overlay.style.display === 'none') {
          overlay.style.display = '';
          eyeBtn.innerHTML = openEyeSVG;
        } else {
          overlay.style.display = 'none';
          eyeBtn.innerHTML = closedEyeSVG;
        }
      }
    });

    toolbar.appendChild(grabHandle);
    toolbar.appendChild(slider);
    toolbar.appendChild(label);
    toolbar.appendChild(eyeBtn);
    return toolbar;
  }

  createOverlay() {
    const container = document.createElement('div');
    const {
      width: containerWidth,
      height: containerHeight,
      marginBottom,
      marginLeft,
      marginRight,
      marginTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
      paddingTop,
    } = this.getComponentStyles();
    container.id = 'visual-overlay-container';
    // Set container styles
    container.style.cssText = `
      position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
      z-index: 9999;
    `;

    const overlay = document.createElement('div');
    overlay.id = 'visual-overlay';
    overlay.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
            pointer-events: none;
          `;

    // Create picture element with media queries
    const picture = document.createElement('picture');
    picture.style.cssText = `
            position: absolute;
            top: ${marginTop};
            right: ${marginRight};
            bottom: ${marginBottom};
            left: ${marginLeft};
            padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft};
            width: ${containerWidth};
            height: ${containerHeight};
            pointer-events: none;
          `;

    const component = this.getComponentName();
    if (!component) {
      console.error('No component name found');
      return container;
    }

    // Add source elements for each viewport
    const sortedViewports = this.viewportConfig.sort((a, b) => {
      const widthA = a.width === '100%' ? Infinity : parseInt(a.width.split('px')[0], 10);
      const widthB = b.width === '100%' ? Infinity : parseInt(b.width.split('px')[0], 10);
      return widthB - widthA;
    });
    sortedViewports.forEach((viewport, index) => {
      const source = document.createElement('source');
      // Use getVariationIndex method
      const variationIndex = this.getVariationIndex();
      const imageName = `${component}-${variationIndex}-${viewport.label}.png`;
      const imagePath = `${this.imageRoot}/${component}/${component}.spec.js-snapshots/${imageName}`;

      if (index === 0) {
        // First viewport (largest) - no min-width
        source.media = `(min-width: ${viewport.width})`;
      } else {
        // Other viewports - min-width from previous viewport
        const prevWidth = sortedViewports[index - 1].width;
        const maxWidth = prevWidth.includes('px') ? ` and (max-width: ${parseInt(prevWidth, 10) - 1}px)` : '';
        source.media = `(min-width: ${viewport.width})${maxWidth}`;
      }

      source.srcset = imagePath;
      picture.appendChild(source);
    });

    // Add fallback img element
    const img = document.createElement('img');
    const fallbackImageName = `${component}-mobile.png`;
    const fallbackImagePath = `${this.imageRoot}/visual.spec.js-snapshots/${fallbackImageName}`;
    img.src = fallbackImagePath;
    img.style.cssText = `
            width: ${containerWidth};
            height: ${containerHeight};
            object-fit: fill;
          `;
    picture.appendChild(img);

    overlay.appendChild(picture);
    container.appendChild(overlay);
    return container;
  }

  updateOverlayOpacity() {
    const overlay = document.getElementById('visual-overlay');
    if (overlay) {
      overlay.style.opacity = this.opacity;
    }
  }

  toggleOverlay() {
    if (!this.overlayContainer) {
      this.overlayContainer = this.createOverlay();
      this.toolbar = this.createToolbar();
      document.body.appendChild(this.overlayContainer);
      document.body.appendChild(this.toolbar);
    }

    this.isActive = !this.isActive;
    this.overlayContainer.style.display = this.isActive ? 'block' : 'none';
    this.toolbar.style.display = this.isActive ? 'flex' : 'none';
  }
}

// Initialize the overlay
export default function initializeVisualOverlay() {
  const themeRoot = window.parent?.window?.document?.querySelector('sidekick-library')?.shadowRoot.querySelector('sp-theme');
  const actionGroup = themeRoot?.querySelector('plugin-renderer')?.shadowRoot.querySelector('sp-action-group');

  // Remove existing button if present to avoid duplicates
  const existingButton = actionGroup?.querySelector('#visual-overlay-toggle');
  if (existingButton) {
    existingButton.remove();
  }

  const overlay = new VisualOverlay();
  const button = overlay.createToggleButton();

  // Add button to action group
  const loader = actionGroup.querySelector('[data-vtest-loader]');
  if (actionGroup) {
    if (loader) {
      loader.insertAdjacentElement('beforebegin', button);
    } else {
      actionGroup.appendChild(button);
    }
  }

  return overlay;
}

// Only add the event listener once
if (!window.parent?.window?.visualOverlayPopstateListenerAdded) {
  window.parent.window.addEventListener('popstate', initializeVisualOverlay);
  window.parent.window.visualOverlayPopstateListenerAdded = true;
}

// Only initialize if not already initialized
initializeVisualOverlay();
