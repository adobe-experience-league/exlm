import state from './state.js';

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

export function addCallouts(step) {
  const picture = step.querySelector('picture');
  const image = step.querySelector('img');

  if (!picture && !image) {
    return;
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
          const txt = li.textContent.trim();
          // extract the "[…]" tooltip
          const tooltip = txt.match(/^\[(.+?)\]/)?.[1] ?? null;
          // pull out all key="value" pairs from the "{…}"
          const props = Object.fromEntries(
            [...txt.matchAll(/(\w+)="([^"]+)"/g)].map(([, k, v]) => [k, Number.isNaN(v) ? v : +v]),
          );
          const { x, y, r, height, width } = props;
          return {
            toast: null,
            button: null,
            width: width || r * 2, // TODO:: Hardcoding for now.
            height: height || r * 2, // TODO:: Hardcoding for now.
            x,
            y,
            tooltip,
            clickable: null, // TODO:: Hardcoding for now.
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

export async function activateStep(block, stepIndex, direction = 'next') {
  // There should only be 1 match, but the forEach guards against no matches as well
  const step = block.querySelector(`[data-step="${stepIndex}"]`);

  step.classList.add('active');

  step.querySelectorAll('[data-callout] ~ :is(picture > img, img)').forEach((image) => {
    if (image.complete && image.naturalWidth > 0) {
      addCallouts(step);
    } else {
      image.addEventListener('load', () => {
        addCallouts(step);
      });
    }
  });

  const audio = step.querySelector('audio');

  const autoplayAudio = direction === 'next' && getPreference('autoplayAudio') && getPreference('view') !== 'as-docs';

  if (stepIndex === state.currentStep && autoplayAudio) {
    try {
      await audio.play();
    } catch (error) {
      // Its fine if the audio doesn't play
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

export async function getAudioFilename(content) {
  let text = [...content.querySelectorAll(':scope > *')]
    .filter((el) => !el.matches('h1,h2,h3,h4'))
    .map((el) => {
      if (el.tagName === 'UL' || el.tagName === 'OL') {
        const items = [...el.querySelectorAll('li')].map((li) => li.textContent);
        return items.length > 1
          ? `${items.slice(0, -1).join(', ') + (items.length > 2 ? ',' : '')} and ${items.slice(-1)}`
          : items.join('');
      }
      return el.textContent;
    })
    .join(' ');
  text = normalizeSpaces(text);

  return `${text.length}-${await sha256(normalizeSpaces(text))}`;
}
