import state from './state.js';
import {
  getPreference,
  setPreference,
  getVisual,
  getAudioFilename,
  getNextStep,
  getPreviousStep,
  showAllSteps,
  showStep,
  getStepFromWindowLocation,
  updateWindowLocation,
} from './utils.js';

function html(content) {
  const initialView = getPreference('view') || 'as-slides';
  const autoplayAudio = getPreference('autoplayAudio') || false;

  return `
        <div class="container ${initialView}" data-block-id="${content.id}">

            <div class="header">
                <h2 class="title">${content.title}</h2>

                <div class="display-toggles">
                    <button class="as-docs button secondary" data-toggle-view="as-docs">View as docs</button>
                    <button class="as-slides button secondary" data-toggle-view="as-slides">View as slides</button>
                </div>
            </div>
        
            <div class="intro">
                ${content.body}
            </div>

            ${content.sections
              .map(
                (section) => `
            <div class="sections">
              <div class="steps" itemscope itemtype="http://schema.org/ImageGallery">
              ${section.steps
                .map(
                  (step, stepIndex) => `
                  <div class="step" data-step="${step.id}" class="${step.active ? 'active' : ''}" 
                      itemprop="associatedMedia" itemscope itemtype="http://schema.org/ImageObject">

                      <meta itemprop="caption" content="${step.title}">
                      <meta itemprop="representativeOfPage" content="${stepIndex === 0 ? 'true' : 'false'}">
        
                      <h4 id="${step.id}" class="title">${section.number ? `${section.number}.` : ''}${step.number}. ${
                        step.title
                      }</h4>

                      <!-- Visuals -->
                      <div class="visual-wrapper">
                        <div class="visual ${step.visual.code ? 'code' : 'image'}">
                            <span class="step-counter">${stepIndex + 1}<span class="slash">/</span>${
                              section.steps.length
                            }</span>

                            ${
                              step.visual.image
                                ? `
                                <!-- Image visual -->
                                ${step.visual.callouts
                                  ?.filter((callout) => !callout.toast)
                                  .map(
                                    (callout) => `
                                    <span class="callout" data-callout>
                                        <span class="indicator ${callout.clickable ? 'clickable' : ''}" 
                                                ${
                                                  !callout.button && callout.clickable === 'next'
                                                    ? 'data-next-step'
                                                    : ''
                                                } 
                                                data-callout-indicator
                                                data-callout-indicator-width="${callout.width}"
                                                data-callout-indicator-height="${callout.height}"
                                                data-callout-indicator-x="${callout.x}"
                                                data-callout-indicator-y="${callout.y}">
                                                    <i></i>
                                                    ${
                                                      callout.button
                                                        ? `<button ${
                                                            callout.clickable === 'next' ? 'data-next-step' : ''
                                                          } data-callout-button>${callout.button}</button>`
                                                        : ''
                                                    }
                                        </span>
                                        ${
                                          callout.tooltip
                                            ? `<p class="tooltip" data-callout-tooltip>${callout.tooltip}</p>`
                                            : ''
                                        }
                                      
                                    </span>
                                `,
                                  )
                                  .join('')}                
                                ${step.visual.image}`
                                : ''
                            }

                            ${
                              step.visual.code
                                ? `
                                <!-- Code visual -->
                                <div class="body">${step.visual.body}</div>
                                ${step.visual.code}`
                                : ''
                            }      
                                
                            ${
                              step.visual.callouts?.find((callout) => callout.toast)
                                ? `
                                <div class="toast">${step.visual.callouts?.find((callout) => callout.toast).toast}</div>
                            `
                                : ''
                            }

                        </div>            
                      </div>

                      <!-- Slide Controls -->
                      <div class="controls">
                          <div class="controls-bar">
                              <button class="previous-button" data-previous-step="previous-button">Previous</button>
                              <button class="next-button" data-next-step="next-button">Next</button>

                              <span class="auto-play">
                                  <label for="auto-play" class="auto-play-label">Autoplay</label>
                                  <button 
                                      name="auto-play" 
                                      class="auto-play-button" 
                                      data-auto-play-audio="${autoplayAudio}" 
                                      title="Turn autoplay on to automatically advance through the steps."></button>
                              </span>

                              <audio 
                                  class="audio-player" data-audio-controls
                                  src="${step.audio}" controls preload controlslist="nodownload">
                                  <source src="${step.audio} type="audio/wav">
                                  Your browser does not support the audio element.
                              </audio>
                          </div >

                          <div class="step-name" data-step-name>

                              ${
                                content.sections.length > 1
                                  ? `
                              <select class="section-title" data-section-select aria-label="Current section">
                                ${content.sections
                                  .map(
                                    (sectionOption) => `<option 
                                  ${section.id === sectionOption.id ? 'selected' : ''}
                                  data-option-force-active="${section.id === sectionOption.id ? 'true' : 'false'}"
                                  value="${sectionOption.steps[0].id}">${sectionOption.title}</option>`,
                                  )
                                  .join('')}
                              </select>
                            
                              <div class="section-description"></div>`
                                  : ''
                              }


                              <select class="step-name-select" data-step-name-select aria-label="Current step">
                                ${section.steps
                                  .map(
                                    (stepOption, stepOptionIndex) =>
                                      `<option value="${stepOption.id}">${stepOptionIndex + 1}. ${
                                        stepOption.title
                                      }</option>`,
                                  )
                                  .join('')}
                              </select>
                            
                          </div>
                      </div>
              
                      <!-- Step body -->
                      <div class="content" itemprop="description">
                          ${step.body}
                      </div>
                  </div>`,
                )
                .join('')} <!-- End steps -->
                </div>`,
              )
              .join('')} <!-- End sections -->
            </div>
        </div>`;
}

function addEventHandlers(block) {
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

export default async function decorate(block) {
  const blockId = block.querySelector(':scope > div:first-child > div:first-child > h2').id;

  block.querySelector(':scope > div > div:first-child > h2').id = blockId;

  const content = {
    id: blockId,
    title: block.querySelector(':scope > div:first-child > div:first-child > h2').textContent,
    body: [...block.querySelectorAll(':scope > div:first-child > div:first-child > *')]
      .filter((el) => !el.matches('h2'))
      .map((el) => el.outerHTML)
      .join(''),
  };

  const sections = [];
  let section = {
    id: null,
    steps: [],
  };

  // Process rows 2 to n; these may be sections or steps
  await Promise.all(
    [...block.querySelectorAll(':scope > div:not(:first-child)')].map(async (row) => {
      // Every row except the first ...
      if (row.querySelector(':scope > div:last-child').innerHTML.trim() === '') {
        // Sections have nothing in the right/last cell
        if (section.id) {
          // the start of a new section marks the end of an old section
          sections.push(section);
        }
        // Row's with h3 are sections
        section = {
          id: row.querySelector(':scope > div:first-child > h3, h4').id,
          number: sections.length + 1,
          title: row.querySelector(':scope > div:first-child > h3, h4').textContent,
          description: [...row.querySelectorAll(':scope > div:first-child > :not(h3, h4)')]
            .map((el) => el.outerHTML)
            .join(''),
          steps: [],
        };
      } else {
        // Steps have something in the right/last cell
        const text = row.querySelector(':scope > div:first-child');
        const visual = row.querySelector(':scope > div:last-child');
        const stepId = section.id
          ? `${section.id}__${text.querySelector(':scope > h3, :scope > h4')?.id}`
          : text.querySelector(':scope h3, :scope > h4')?.id;

        section.steps.push({
          id: stepId,
          number: null, // Must be computed after all steps are collected
          active: window.location.hash === `#${blockId}=${stepId}`,
          title: text.querySelector(':scope > h3, :scope > h4')?.textContent,
          body: [...text.querySelectorAll(':scope > *')]
            .filter((el) => !el.matches('h3, h4'))
            .map((el) => el.outerHTML)
            .join(' '),
          visual: getVisual(visual),
          audio: `https://dxenablementbeta.blob.core.windows.net/exl-slides/audio/${await getAudioFilename(text)}.wav`,
        });
      }
    }),
  );

  if (section.steps.length > 0) {
    // Handle the last section
    sections.push(section);
  }

  // Handle the case where no step is active
  if (!sections.flatMap((sec) => sec.steps).some((step) => step.active)) {
    sections[0].steps[0].active = true;
  }

  sections.forEach((s) => {
    s.steps.forEach((step, index) => {
      step.number = index + 1;
    });
  });

  content.sections = sections || [];

  block.innerHTML = html(content);

  addEventHandlers(block, getStepFromWindowLocation(block));

  state.currentStep = content.sections.flatMap((sec) => sec.steps).find((step) => step.active).id;

  if (getPreference('view') === 'as-docs') {
    showAllSteps(block);
  } else {
    showStep(block, state.currentStep);
  }

  block.style.display = 'block';

  return block;
}
