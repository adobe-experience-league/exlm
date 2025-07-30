import { sendNotice } from '../../scripts/toast/toast.js';
import { pushGuidePlayEvent } from '../../scripts/analytics/lib-analytics.js';

// Track if audio is being played by autoplay
let isAutoplayTriggered = false;

export const state = {
  currentStep: 0,
};

// Helper function to format guide title
function formatGuideTitle(block, stepId) {
  const container = block.querySelector('.container');
  const blockTitle = container.querySelector('.title').textContent;
  const step = block.querySelector(`[data-step="${stepId}"]`);
  const stepNumber = step.querySelector('.step-counter').textContent.split('/')[0].trim();
  const slideTitle = step.querySelector('.step-name-title').textContent.trim();

  return `${blockTitle}:${stepNumber}:${slideTitle}`;
}

// Helper function to get total steps
function getTotalSteps(block) {
  const firstStep = block.querySelector('.step');
  return firstStep.querySelector('.step-counter').textContent.split('/')[1].trim();
}

export const isDesktopView = () => window.matchMedia('(min-width: 768px)').matches;

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

  // Initialize preferences.slide if it doesn't exist
  if (!preferences.slide) {
    preferences.slide = {};
  }

  // For autoplayAudio, default to true if not set
  if (key === 'autoplayAudio' && preferences.slide[key] === undefined) {
    preferences.slide[key] = true;
    localStorage.setItem('experienceleague', JSON.stringify(preferences));
  }

  return preferences.slide[key];
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
  const image = step.querySelector('img');

  new ResizeObserver(() => {
    // image loaded, show the coachmark
    if (image.complete) {
      step.querySelectorAll('exl-coachmark').forEach((coachmark) => {
        coachmark.show();

        const attObject = [...coachmark.attributes].reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {});

        const { type } = attObject;
        if (type === 'circle') {
          const { x, y, r } = attObject;
          coachmark.style.left = `calc(${x}% - ${r / 2}%)`;
          coachmark.style.top = `calc(${y}% - ${r}%)`;
          coachmark.style.width = `${r}%`;
          coachmark.style.aspectRatio = '1 / 1';
        } else if (type === 'rectangle') {
          const { x1, y1, x2, y2 } = attObject;
          coachmark.style.left = `${x1}%`;
          coachmark.style.top = `${y1}%`;
          coachmark.style.width = `${x2 - x1}%`;
          coachmark.style.height = `${y2 - y1}%`;
        }
        requestAnimationFrame(() => {
          coachmark.reset();
        });
      });
    }
  }).observe(image);
}

export function generateVisualConfig(cell) {
  const visual = {};
  const [pictureWrapper, calloutWrapper] = cell?.children || [];
  const pictureElement = pictureWrapper.querySelector(':scope picture') || pictureWrapper.querySelector(':scope img');
  if (pictureElement) {
    // image
    visual.image = pictureElement.outerHTML;
    if (calloutWrapper) {
      visual.callouts = Array.from(calloutWrapper.querySelectorAll(':scope > li > span')).map((span) => {
        const attributes = Object.fromEntries(
          [...span.attributes].map(({ name, value }) => {
            const num = Number(value);
            return [name, Number.isNaN(num) ? value : num];
          }),
        );

        return {
          toast: null,
          button: null,
          tooltip: span.textContent.trim(),
          attributes,
        };
      });
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

export async function activateStep(block, stepIndex, skipAutoplay = false) {
  // There should only be 1 match, but the forEach guards against no matches as well
  const step = block.querySelector(`[data-step="${stepIndex}"]`);

  step.classList.add('active');

  step.querySelectorAll(':is([exl-coachmark] ~ img, exl-coachmark ~ picture > img)').forEach((image) => {
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
  const autoplayAudio = getPreference('autoplayAudio') && getPreference('view') !== 'as-docs';
  audio.muted = getPreference('muteStatus') || false;
  const playbackRate = getPreference('playbackRate');
  if (playbackRate) {
    audio.playbackRate = playbackRate;
  }
  audio.currentTime = 0; // Reset the timeStamp so that it will always from start.

  if (stepIndex === state.currentStep && autoplayAudio && !skipAutoplay) {
    try {
      await waitForAudioReady(audio);

      // Only trigger autoplay event if the slides are in slide view mode (not docs view)
      const container = block.querySelector('.container');
      const isSlideMode = !container.classList.contains('as-docs');

      if (isSlideMode) {
        // Trigger autoplay event when autoplay is enabled on page load
        const audioOn = !audio.muted;
        pushGuidePlayEvent(
          {
            title: formatGuideTitle(block, stepIndex),
            trigger: 'autoplay',
            steps: getTotalSteps(block),
          },
          audioOn,
        );

        // Set the flag to indicate that audio is being played by autoplay
        isAutoplayTriggered = true;
      }

      audio.play();
    } catch (error) {
      // Its fine if the audio doesn't play
    }
  } else {
    await audio.pause();
  }
}

export function showStep(block, stepId, skipAutoplay = false) {
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
  activateStep(block, stepId, skipAutoplay);
}

export function showAllSteps(block) {
  block.querySelectorAll('[data-step]').forEach(async (step) => {
    await step.querySelector('audio')?.pause();
    activateStep(block, step.dataset.step, true); // Pass true to skip autoplay when showing all steps
  });
}

export function getStepFromWindowLocation(block) {
  const [blockId, stepId] = ((window.location?.hash ?? '').replace('#', '') ?? '').split('=');

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

export async function addEventHandlers(block, placeholders) {
  block.querySelectorAll('[data-toggle-view]').forEach((button) => {
    button.addEventListener('click', () => {
      block.querySelector('.container').classList.toggle('as-docs');

      if (button.dataset.toggleView === 'as-docs') {
        setPreference('view', 'as-docs');
        showAllSteps(block);
      } else {
        setPreference('view', 'as-slides');
        showStep(block, state.currentStep, true); // Pass true to skip autoplay when switching view modes
      }
    });
  });

  block.querySelectorAll('[data-previous-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const previousStep = getPreviousStep(block, state.currentStep);

      if (previousStep && getPreference('view') !== 'as-docs') {
        state.currentStep = previousStep;
        updateWindowLocation(block, state.currentStep);
        showStep(block, state.currentStep);

        // Add analytics tracking for previous button
        const audio = block.querySelector(`[data-step="${state.currentStep}"] audio`);
        const audioOn = !audio.muted;

        pushGuidePlayEvent(
          {
            title: formatGuideTitle(block, state.currentStep),
            trigger: 'previous',
            steps: getTotalSteps(block),
          },
          audioOn,
        );
      }
    });
  });

  block.querySelectorAll('[data-next-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextStep = getNextStep(block, state.currentStep);

      if (nextStep && getPreference('view') !== 'as-docs') {
        // Get audio status
        const audio = block.querySelector(`[data-step="${state.currentStep}"] audio`);
        const audioOn = !audio.muted;

        // Add analytics tracking for next button - always use 'next' as trigger
        pushGuidePlayEvent(
          {
            title: formatGuideTitle(block, nextStep),
            trigger: 'next',
            steps: getTotalSteps(block),
          },
          audioOn,
        );

        // Update the step after tracking the event
        state.currentStep = nextStep;
        updateWindowLocation(block, state.currentStep);
        showStep(block, state.currentStep);
      }
    });
  });

  block.querySelectorAll('[data-section-select]').forEach((select) => {
    select.addEventListener('change', () => {
      state.currentStep = select.value;
      updateWindowLocation(block, state.currentStep);
      showStep(block, state.currentStep);
      block.querySelectorAll('[data-option-force-active="true"]').forEach((option) => {
        option.selected = true;
      });

      // Add analytics tracking for section navigation
      const audio = block.querySelector(`[data-step="${state.currentStep}"] audio`);
      const audioOn = !audio.muted;

      pushGuidePlayEvent(
        {
          title: formatGuideTitle(block, state.currentStep),
          trigger: 'next', // Section navigation is treated as "next"
          steps: getTotalSteps(block),
        },
        audioOn,
      );
    });
  });

  block.querySelectorAll('audio').forEach((audio) => {
    // Add event listener for the play button on the audio element
    audio.addEventListener('play', () => {
      // Only trigger play event if it's not triggered by autoplay
      if (!isAutoplayTriggered) {
        const audioOn = !audio.muted;
        const currentStepId = audio.closest('[data-step]').dataset.step;

        // Track this as a "play" event when manually played
        pushGuidePlayEvent(
          {
            title: formatGuideTitle(block, currentStepId),
            trigger: 'play',
            steps: getTotalSteps(block),
          },
          audioOn,
        );
      }

      // Reset the flag after handling the event
      isAutoplayTriggered = false;
    });

    audio.addEventListener('ended', () => {
      setTimeout(() => {
        if (getPreference('autoplayAudio')) {
          const nextStep = getNextStep(block, state.currentStep);
          if (nextStep) {
            const audioOn = !audio.muted;

            // Add analytics tracking for autoplay
            pushGuidePlayEvent(
              {
                title: formatGuideTitle(block, nextStep),
                trigger: 'autoplay',
                steps: getTotalSteps(block),
              },
              audioOn,
            );
          }

          audio.closest('[data-step]').querySelector('[data-next-step]').click();
        }
      }, 2000);
    });

    audio.addEventListener('volumechange', () => {
      setPreference('muteStatus', audio.muted);
    });

    audio.addEventListener('ratechange', () => {
      setPreference('playbackRate', audio.playbackRate);
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
