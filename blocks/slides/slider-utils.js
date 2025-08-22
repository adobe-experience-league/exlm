import { sendNotice } from '../../scripts/toast/toast.js';
import { pushGuidePlayEvent, pushGuideAutoPlayEvent } from '../../scripts/analytics/lib-analytics.js';
import PreferenceStore from '../../scripts/preferences/preferences.js';

export const preferences = new PreferenceStore('slides');

export const state = {
  currentStep: 0,
  isAutoPlaying: false,
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

export const isDesktopView = () => window.matchMedia('(min-width: 900px)').matches;

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

async function showCoachmarks(step) {
  const image = step.querySelector('img');
  if (!image.complete) {
    await new Promise((resolve) => {
      image.addEventListener('load', resolve);
      image.addEventListener('error', resolve);
    });
  }
  const coachmarks = step.querySelectorAll('exl-coachmark');
  coachmarks.forEach((coachmark) => {
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

export function addCallouts(step) {
  const image = step.querySelector('img');

  showCoachmarks(step);

  new ResizeObserver(() => {
    showCoachmarks(step);
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

export async function activateStep(block, stepIndex, skipAutoplay = false) {
  // There should only be 1 match, but the forEach guards against no matches as well
  const step = block.querySelector(`[data-step="${stepIndex}"]`);

  step.classList.add('active');

  addCallouts(step);

  const audio = step.querySelector('audio');
  const autoplayAudio = preferences.get('autoplayAudio') && preferences.get('view') !== 'as-docs';
  audio.muted = preferences.get('muteStatus') || false;
  const playbackRate = preferences.get('playbackRate');
  if (playbackRate) {
    audio.playbackRate = playbackRate;
  }
  audio.currentTime = 0; // Reset the timeStamp so that it will always from start.

  if (stepIndex === state.currentStep && autoplayAudio && !skipAutoplay) {
    try {
      // Only trigger autoplay event if the slides are in slide view mode (not docs view)
      const container = block.querySelector('.container');
      const isSlideMode = !container.classList.contains('as-docs');

      if (isSlideMode) {
        // Trigger autoplay event when autoplay is enabled on page load
        const audioOn = !audio.muted;
        state.isAutoPlaying = true;
        pushGuideAutoPlayEvent(
          {
            title: formatGuideTitle(block, stepIndex),
            trigger: 'autoplay',
            steps: getTotalSteps(block),
          },
          audioOn,
        );
      }

      // Handle autoplay promise properly
      audio.play().then(() => {
        // Autoplay succeeded
      }).catch(() => {
        // If autoplay fails (e.g., no user interaction), reset the flag
        state.isAutoPlaying = false;
      });
    } catch (error) {
      // Its fine if the audio doesn't play
      // Reset the autoplay flag if autoplay fails
      state.isAutoPlaying = false;
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

function switchView(block, view) {
  block.querySelector('.container').classList.toggle('as-docs');

  if (view === 'as-docs') {
    preferences.set('view', 'as-docs');
    showAllSteps(block);
  } else {
    preferences.set('view', 'as-slides');
    showStep(block, state.currentStep, true); // Pass true to skip autoplay when switching view modes
  }
}

export async function addEventHandlers(block, placeholders) {
  block.querySelectorAll('[data-toggle-view]').forEach((button) => {
    button.addEventListener('click', () => {
      switchView(block, button.dataset.toggleView);
    });
  });

  block.querySelectorAll('[data-previous-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const previousStep = getPreviousStep(block, state.currentStep);

      if (previousStep && preferences.get('view') !== 'as-docs') {
        state.currentStep = previousStep;
        updateWindowLocation(block, state.currentStep);

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

        showStep(block, state.currentStep);
      }
    });
  });

  block.querySelectorAll('[data-next-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextStep = getNextStep(block, state.currentStep);

      if (nextStep && preferences.get('view') !== 'as-docs') {
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
      const audioOn = !audio.muted;
      const currentStepId = audio.closest('[data-step]').dataset.step;

      // Only track as a "play" event when manually played (not autoplay)
      if (!state.isAutoPlaying) {
        pushGuidePlayEvent(
          {
            title: formatGuideTitle(block, currentStepId),
            trigger: 'play',
            steps: getTotalSteps(block),
          },
          audioOn,
        );
      }
      
      // Reset the autoplay flag after the play event
      state.isAutoPlaying = false;
    });

    audio.addEventListener('ended', () => {
      setTimeout(() => {
        if (preferences.get('autoplayAudio')) {
          const nextStep = getNextStep(block, state.currentStep);
          if (nextStep) {
            const audioOn = !audio.muted;

            // Add analytics tracking for autoplay
            state.isAutoPlaying = true;
            pushGuideAutoPlayEvent(
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
      preferences.set('muteStatus', audio.muted);
    });

    audio.addEventListener('ratechange', () => {
      preferences.set('playbackRate', audio.playbackRate);
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

      preferences.set('autoplayAudio', !autoPlayAudio);
    });
  });
}
