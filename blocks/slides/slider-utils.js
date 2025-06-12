import state from './slider-state.js';
import { sendNotice } from '../../scripts/toast/toast.js';

export function normalizeSpaces(str) {
  // Replace multiple spaces with a single space
  return str.replace(/\s+/g, ' ').trim();
}

export function setPreference(key, value) {
  if (typeof Storage === 'undefined') {
    return;
  }

  const preferences = JSON.parse(localStorage.getItem('experienceleague') || '{}');
  preferences.slide = {
    ...preferences.slide,
    [key]: value,
  };
  localStorage.setItem('experienceleague', JSON.stringify(preferences));
}

export function getPreference(key) {
  if (typeof Storage === 'undefined') {
    return null;
  }
  const preferences = JSON.parse(localStorage.getItem('experienceleague') || '{}');

  if (preferences?.slide) {
    return preferences.slide[key];
  }
  return null;
}

export async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function getNextStep(block, currentStep) {
  const steps = [...block.querySelectorAll('[data-step]')] || [];
  const currentIndex = steps.findIndex((step) => step.dataset.step === currentStep);

  if (currentIndex !== -1 && currentIndex < steps.length - 1) {
    const nextStep = steps[currentIndex + 1];
    return nextStep.dataset.step;
  }

  return null; // No next step found
}

export function getPreviousStep(block, currentStep) {
  const steps = [...block.querySelectorAll('[data-step]')] || [];
  const currentIndex = steps.findIndex((step) => step.dataset.step === currentStep);

  if (currentIndex > 0) {
    const previousStep = steps[currentIndex - 1];
    return previousStep.dataset.step;
  }

  return null; // No previous step found
}

function updateContentButtonPosition(step) {
  const contentButton = step.querySelector('.content button');
  if (contentButton) {
    const width = contentButton.offsetWidth;
    contentButton.style.setProperty('--content-left-position', `${width}px`);
  }
}

export function addCallouts(step) {
  const picture = step.querySelector('picture');
  const image = step.querySelector('img');

  if (!picture && !image) {
    return;
  }

  if (image.naturalWidth) {
    const imageIsPortrait = image.naturalWidth < image.naturalHeight;
    if (imageIsPortrait) {
      image.style.aspectRatio = 'auto';
    }
  }

  let largestImage;

  const setupCallout = () => {
    // Access the naturalWidth property of the loaded image
    // const naturalWidth = largestImage.naturalWidth;
    // const naturalHeight = largestImage.naturalHeight;

    new ResizeObserver((imageResize) => {
      if (image.complete && image.naturalWidth > 0) {
        step.querySelectorAll('[data-callout]').forEach((callout) => {
          callout.classList.add('visible');

          const indicator = callout.querySelector('[data-callout-indicator]');
          const button = callout.querySelector('[data-callout-button]');
          const tooltip = callout.querySelector('[data-callout-tooltip]');

          const imageHeight = imageResize[0].borderBoxSize[0].blockSize;
          const imageWidth = imageResize[0].borderBoxSize[0].inlineSize;

          const scaleX = imageWidth / largestImage.naturalWidth;
          const scaleY = imageHeight / largestImage.naturalHeight;

          const width = parseInt(indicator.dataset.calloutIndicatorWidth, 10) || 100;
          const height = parseInt(indicator.dataset.calloutIndicatorHeight, 10) || width;
          const left = parseInt(indicator.dataset.calloutIndicatorX, 10);
          const top = parseInt(indicator.dataset.calloutIndicatorY, 10);

          const indicatorLeft = ((left - width / 2) * scaleX) / imageWidth;
          const indicatorTop = ((top - height / 2) * scaleY) / imageHeight;
          const indicatorWidth = (width * scaleX) / imageWidth;
          const indicatorHeight = (height * scaleY) / imageHeight;

          indicator.style.left = `${indicatorLeft * 100}%`;
          indicator.style.top = `${indicatorTop * 100}%`;
          indicator.style.width = `${indicatorWidth * 100}%`;
          indicator.style.height = `${indicatorHeight * 100}%`;

          if (button) {
            new ResizeObserver((buttonResize) => {
              // eslint-disable-next-line no-restricted-syntax
              const borderBox = buttonResize[0].borderBoxSize[0];

              button.style.left = '50%';
              button.style.top = '50%';
              button.style.marginTop = `${-1 * ((borderBox?.blockSize || button.offsetHeight) / 2)}px`;
              button.style.marginLeft = `${-1 * ((borderBox?.inlineSize || button.offsetWidth) / 2)}px`;
            }).observe(button);

            indicator.style.left = 'unset';
            indicator.style.top = 'unset';
            indicator.style.width = `${button.offsetWidth * 1.5}px`;
            indicator.style.height = indicator.style.width;
          }

          if (tooltip) {
            const tooltipAdjust = 50;
            const tooltipLeft = ((left - tooltipAdjust) * scaleX) / imageWidth;
            const tooltipTop = ((top + tooltipAdjust) * scaleY) / imageHeight;

            tooltip.style.left = `${tooltipLeft * 100}%`;
            tooltip.style.top = `${tooltipTop * 100}%`;
          }
        });
      }
    }).observe(image);
  };

  if (!picture) {
    largestImage = image;
    setupCallout();
  } else {
    // Find the <source> tag with the media query "(min-width: 600px)"
    const sourceElement = picture.querySelector('source[media="(min-width: 600px)"]');
    // Create a new Image element
    largestImage = new Image();
    // eslint-disable-next-line prefer-destructuring
    largestImage.src = sourceElement.getAttribute('srcset').split(' ')[0];
    // Listen for the load event of the Image element
    largestImage.onload = setupCallout;
  }
}

export function parseCallout(calloutParams = '') {
  const params = calloutParams.split('|') || [];

  const callout = {};

  callout.toast = params.find((value) => value?.startsWith('toast='))?.split('=')[1] || null;

  if (callout.toast) {
    return callout;
  }

  callout.button = params.find((value) => value?.startsWith('button='))?.split('=')[1] || null;

  callout.width = parseInt(params[0], 10);
  callout.height = callout.width;
  callout.x = parseInt(params[1], 10);
  callout.y = parseInt(params[2], 10);

  if (['width', 'height', 'x', 'y'].find((prop) => Number.isNaN(callout[prop])) !== undefined) {
    if (callout.button) {
      callout.position = 'middle';
      callout.x = 'unset';
      callout.y = 'unset';
    } else {
      return null;
    }
  }

  callout.tooltip = params.find((value) => value?.startsWith('tooltip='))?.split('=')[1] || null;
  callout.clickable = params.find((value) => value === 'next') ? 'next' : false;
  if (!callout.clickable) {
    callout.clickable = params.find((value) => value?.startsWith('click='))?.split('=')[1] || false;
  }

  return callout;
}

export function getVisual(cell) {
  const visual = {};

  if (cell.querySelector(':scope picture')) {
    // image
    visual.image = cell.querySelector(':scope picture').outerHTML;
    visual.callouts = Array.from(cell.querySelectorAll(':scope > ul > li'))
      .map((li) => {
        const txt = li.textContent.trim();
        // extract the "[…]" tooltip
        const tooltip = txt.match(/^\[(.+?)\]/)?.[1] ?? null;
        // pull out all key="value" pairs from the "{…}"
        const props = Object.fromEntries(
          [...txt.matchAll(/(\w+)="([^"]+)"/g)].map(([, k, v]) => [k, Number.isNaN(v) ? v : +v]),
        );
        const { x, y, r } = props;
        return {
          toast: null,
          button: null,
          width: r * 2,
          height: r * 2,
          x,
          y,
          tooltip,
          clickable: null,
        };
      })
      .filter((o) => o.tooltip !== null);
    // visual.callouts = [...cell.querySelectorAll(':scope > ul > li')].map((li) => parseCallout(li.textContent)).filter((item) => item !== null);
  } else if (cell.querySelector(':scope > pre')) {
    // code
    visual.code = cell.querySelector(':scope > pre').outerHTML;
    visual.body = [...cell.querySelectorAll(':scope > *')]
      .filter((el) => !el.matches('pre'))
      .map((el) => el.outerHTML)
      .join('');
  }

  return visual;
}

export function generateVisualConfig(cell) {
  const visual = {};
  const [pictureWrapper, calloutWrapper] = cell?.children || [];
  const pictureElement = pictureWrapper.querySelector(':scope picture') || pictureWrapper.querySelector(':scope img');
  if (pictureElement) {
    // image
    visual.image = pictureElement.outerHTML;
    if (calloutWrapper) {
      visual.callouts = Array.from(calloutWrapper.querySelectorAll(':scope > li'))
        .map((li) => {
          const span = li.querySelector(':scope > span');
          if (span) {
            const x = Number(span.getAttribute('x'));
            const y = Number(span.getAttribute('y'));
            const r = Number(span.getAttribute('r'));
            const width = Number(span.getAttribute('width')) || r * 2;
            const height = Number(span.getAttribute('height')) || r * 2;
            const tooltip = span.textContent.trim();
            const clickable = span.getAttribute('clickable') || null;
            const type = span.getAttribute('type') || '';

            return { toast: null, button: null, width, height, x, y, tooltip, clickable, type };
          }

          // Case 2: no span child—extract from li.textContent + key="value" pairs
          const txt = li.textContent.trim();
          const tooltip = txt.match(/^\[(.+?)\]/)?.[1] ?? null;

          const props = Object.fromEntries(
            [...txt.matchAll(/(\w+)="([^"]+)"/g)].map(([, k, v]) => {
              const num = Number(v);
              return [k, Number.isNaN(num) ? v : num];
            }),
          );

          const { x = 0, y = 0, r = 0, width: wProp, height: hProp, clickable: clickableProp = null } = props;

          const width = wProp ?? r * 2;
          const height = hProp ?? r * 2;

          return {
            toast: null,
            button: null,
            width,
            height,
            x: Number(x),
            y: Number(y),
            tooltip,
            clickable: clickableProp,
          };
        })
        .filter((o) => o.tooltip !== null);
    }
  } else if (cell.querySelector(':scope > pre')) {
    // code
    visual.code = cell.querySelector(':scope > pre').outerHTML;
    visual.body = [...cell.querySelectorAll(':scope > *')]
      .filter((el) => !el.matches('pre'))
      .map((el) => el.outerHTML)
      .join('');
  }

  return visual;
}

function waitForAudioReady(audioEl) {
  return new Promise((resolve, reject) => {
    function onReady() {
      resolve();
    }

    function onError() {
      reject(new Error('Audio failed to load.'));
    }

    if (audioEl.readyState >= 3) {
      onReady();
      return;
    }

    audioEl.addEventListener('canplay', onReady, { once: true });
    audioEl.addEventListener('error', onError, { once: true });
  });
}

export async function activateStep(block, stepIndex, direction = 'next') {
  // There should only be 1 match, but the forEach guards against no matches as well
  const step = block.querySelector(`[data-step="${stepIndex}"]`);

  step.classList.add('active');

  step.querySelectorAll(':is([data-callout] ~ img, [data-callout] ~ picture > img)').forEach((image) => {
    if (image.complete && image.naturalWidth > 0) {
      updateContentButtonPosition(step);
      addCallouts(step);
    } else {
      image.addEventListener('load', () => {
        updateContentButtonPosition(step);
        addCallouts(step);
      });
    }
  });

  const audio = step.querySelector('audio');

  const autoplayAudio = direction === 'next' && getPreference('autoplayAudio') && getPreference('view') !== 'as-docs';

  if (stepIndex === state.currentStep && autoplayAudio) {
    try {
      await waitForAudioReady(audio);
      audio.play();
    } catch (error) {
      // Its fine if the audio doesn't play
      console.error('audio:auto-play failed with error', error);
    }
  } else {
    await audio.pause();
  }
}

export function showStep(block, stepId, direction = 'next') {
  const step = block.querySelector(`[data-step="${stepId}"]`);

  const previousButton = step.querySelector('[data-previous-step="previous-button"]');
  const nextButton = step.querySelector('[data-next-step="next-button"]');

  previousButton.removeAttribute('disabled');
  nextButton.removeAttribute('disabled');

  if (!getPreviousStep(block, stepId)) {
    previousButton.setAttribute('disabled', true);
  } else if (!getNextStep(block, stepId)) {
    nextButton.setAttribute('disabled', true);
  }

  // Pause any playing audio from all steps
  block.querySelectorAll('audio').forEach((audio) => {
    audio.pause();
    // TBD if we should reset the audio to the beginning
    // audio.currentTime = 0;
  });

  // Remove active from all steps
  block.querySelectorAll('[data-step]').forEach((s) => {
    s.classList.remove('active');
  });

  // Must come after the remove active above
  activateStep(block, stepId, direction);

  step.querySelectorAll('[data-step-name-select]').forEach((select) => {
    select.value = stepId;
  });
}

export function showAllSteps(block) {
  block.querySelectorAll('[data-step]').forEach(async (step) => {
    await step.querySelector('audio')?.pause();
    activateStep(block, step.dataset.step, false);
  });
}

export function getStepFromWindowLocation(block) {
  // eslint-disable-next-line prefer-const
  let [blockId, stepId] = ((window.location?.hash ?? '').replace('#', '') ?? '').split('=');

  if (
    block.querySelector(`[data-block-id="${blockId}"] [data-step="${stepId}"], h2[id="${blockId}"] h4[id="${stepId}"]`)
  ) {
    return stepId;
  }

  return null;
}

export function updateWindowLocation(block, stepId) {
  const { blockId } = block.querySelector('[data-block-id]').dataset;

  if (blockId && stepId) {
    window.location.hash = `#${blockId}=${stepId}`;
  }
}

export function copyToClipboard({ text, toastText }) {
  try {
    navigator.clipboard.writeText(text);
    if (toastText) {
      sendNotice(toastText);
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error('Error copying link to clipboard:', err);
  }
}

export function addEventHandlers(block, placeholders) {
  block.querySelectorAll('[data-toggle-view]').forEach((button) => {
    button.addEventListener('click', () => {
      block.querySelector('.container').classList.toggle('as-docs');

      if (button.dataset.toggleView === 'as-docs') {
        setPreference('view', 'as-docs');
        showAllSteps(block);
      } else {
        setPreference('view', 'as-slides');
        showStep(block, state.currentStep);
      }
    });
  });

  block.querySelectorAll('[data-previous-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const previousStep = getPreviousStep(block, state.currentStep);

      if (previousStep && getPreference('view') !== 'as-docs') {
        state.currentStep = previousStep;
        updateWindowLocation(block, state.currentStep);
        showStep(block, state.currentStep, 'previous');
      }
    });
  });

  block.querySelectorAll('[data-next-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextStep = getNextStep(block, state.currentStep);

      if (nextStep && getPreference('view') !== 'as-docs') {
        state.currentStep = nextStep;
        updateWindowLocation(block, state.currentStep);
        showStep(block, state.currentStep, 'next');
      }
    });
  });

  block.querySelectorAll('[data-section-select]').forEach((select) => {
    select.addEventListener('change', () => {
      state.currentStep = select.value;
      updateWindowLocation(block, state.currentStep);
      showStep(block, state.currentStep, 'jump');
      block.querySelectorAll('[data-option-force-active="true"]').forEach((option) => {
        option.selected = true;
      });
    });
  });

  block.querySelectorAll('[data-step-name-select]').forEach((select) => {
    select.addEventListener('change', () => {
      state.currentStep = select.value;
      updateWindowLocation(block, state.currentStep);
      showStep(block, state.currentStep, 'jump');
    });
  });

  block.querySelectorAll('audio').forEach((audio) => {
    audio.addEventListener('ended', () => {
      setTimeout(() => {
        if (getPreference('autoplayAudio')) {
          audio.closest('[data-step]').querySelector('[data-next-step]').click();
        }
      }, 2000);
    });
  });

  block.querySelectorAll('.copy-icon').forEach((copyElement) => {
    copyElement.addEventListener('click', () => {
      const stepId = copyElement.dataset.copystep;
      const blockId = block.querySelector('[data-block-id]')?.dataset?.blockId;
      if (blockId && stepId) {
        copyToClipboard({
          text: `${window.location.origin}${window.location.pathname}#${blockId}=${stepId}`,
          toastText: placeholders.userActionCopylinkToastText,
        });
      }
    });
  });

  block.querySelectorAll('[data-auto-play-audio]').forEach((audioControls) => {
    audioControls?.addEventListener('click', () => {
      const autoPlayAudio = audioControls.dataset.autoPlayAudio === 'true';

      block.querySelectorAll('[data-auto-play-audio]').forEach((ac) => {
        ac.dataset.autoPlayAudio = !autoPlayAudio;
      });

      setPreference('autoplayAudio', !autoPlayAudio);
    });
  });
}
