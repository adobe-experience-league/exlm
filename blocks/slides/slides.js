import { decorateIcons } from '../../scripts/lib-franklin.js';
import { decoratePlaceholders, fetchLanguagePlaceholders } from '../../scripts/scripts.js';

import {
  generateVisualConfig,
  preferences,
  showAllSteps,
  showStep,
  addEventHandlers,
  isDesktopView,
  state,
} from './slider-utils.js';

function html(content, placeholders) {
  const isDesktopUI = isDesktopView();
  const initialView = isDesktopUI ? preferences.get('view') || 'as-slides' : 'as-docs';

  const autoplayAudio = preferences.get('autoplayAudio') !== undefined ? preferences.get('autoplayAudio') : true;
  const muted = preferences.get('muteStatus') || false;

  return `
        <div class="container ${initialView}" data-block-id="${content.id}">

            <div class="header">
                <h2 class="title">${content.title}</h2>

                <div class="display-toggles">
                    <button class="as-slides button secondary" data-toggle-view="as-slides">${
                      placeholders.viewAsSlidesLabel || 'View as slides'
                    }</button>
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

                      <!-- Visuals -->
                      <div class="visual-wrapper">
                        <span class="step-counter">${stepIndex + 1}<span class="slash">/</span>${
                          section.steps.length
                        }</span>
                        <div class="visual ${step.visual.code ? 'code' : 'image'}">

                            ${
                              step.visual.image
                                ? `
                                <!-- Image visual -->
                                ${step.visual.callouts
                                  ?.filter((callout) => !callout.toast)
                                  .map(
                                    (callout) => `
                                    <exl-coachmark  ${Object.entries(callout.attributes)
                                      .map(([key, value]) => `${key}="${value}"`)
                                      .join(' ')}>
                                        <span slot="title">${callout.tooltip}</span>
                                      </exl-coachmark>
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
                      <div class="content-info doc-content-info">
                       <label class="step-label">${
                         placeholders.slidesStepProgress
                           ? `${placeholders.slidesStepProgress
                               .replace('{}', step.number)
                               .replace('{}', section.steps.length)}`
                           : `Step ${step.number} of ${section.steps.length}`
                       }</label>
                        <div class="copy-icon" data-copystep="${step.id}">
                            <span class="icon icon-copy-link"></span>
                            <span data-placeholder="userActionCopylinkLabel">Copy link</span>
                        </div>
                      </div>
                      <!-- Slide Controls -->
                      <div class="controls">
                          <div class="controls-bar">
                              <button class="previous-button secondary" data-previous-step="previous-button">
                                <span data-placeholder="playlistPreviousLabel">Previous</span>
                              </button>
                              <button class="next-button" data-next-step="next-button">
                                <span data-placeholder="playlistNextLabel">Next</span>
                              </button>

                              <audio 
                                  class="audio-player" data-audio-controls
                                  src="${step.audio}" controls preload controlslist="nodownload"
                                  muted="${muted}"
                              >
                                  <source src="${step.audio} type="audio/wav">
                                  Your browser does not support the audio element.
                              </audio>

                              <span class="auto-play">
                                
                                <button
                                  name="auto-play"
                                  class="auto-play-button"
                                  data-auto-play-audio="${autoplayAudio}"
                                  aria-pressed="${autoplayAudio}"
                                  title=${
                                    placeholders.autoplayStepsTitle ||
                                    'Turn autoplay on to automatically advance through the steps.'
                                  }
                                >
                                  <span class="auto-play-thumb"></span>
                                </button>
                                <label class="auto-play-label">
                                  <span data-placeholder="autoPlayLabel">Autoplay</span>
                                </label>
                              </span>

                          </div >
                          
                          <div class="content-info slides-content-info">
                            <label class="step-label">${
                              placeholders.slidesStepProgress
                                ? `${placeholders.slidesStepProgress
                                    .replace('{}', step.number)
                                    .replace('{}', section.steps.length)}`
                                : `Step ${step.number} of ${section.steps.length}`
                            }</label>
                            <div class="copy-icon" data-copystep="${step.id}">
                                <span class="icon icon-copy-link"></span>
                                <label>
                                  <span data-placeholder="userActionCopylinkLabel">Copy link</span>
                                </label>
                            </div>
                          </div>
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


                              <div class="step-name-title" aria-label="Current step">
                                ${step.title}
                              </div>
                            
                          </div>
                      </div>

                      <h4 id="${step.id}" class="title">${section.number ? `${section.number}.` : ''}${step.number}. ${
                        step.title
                      }</h4>
              
                      <!-- Step body -->
                      <div class="content" itemprop="description">
                          ${step.body}
                          <button class="button secondary" data-toggle-view="as-docs">
                            <span data-placeholder="expandAllStepsLabel">Expand all steps</span>
                          </button>
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

export default async function decorate(block) {
  import('../../scripts/coachmark/coachmark.js'); // async load it.

  // Set default autoplay preference if not already set
  if (preferences.get('autoplayAudio') === undefined) {
    preferences.set('autoplayAudio', true);
  }

  const placeHolderPromise = fetchLanguagePlaceholders();
  const [firstChildBlock, ...restOfBlock] = block.children;
  const baseHeadingElement = firstChildBlock.querySelector('h2');
  let blockId = '';
  if (baseHeadingElement) {
    blockId = baseHeadingElement.id || baseHeadingElement.textContent.toLowerCase().split(' ').join('-');
    baseHeadingElement.id = blockId;
  }
  const bodyElement = firstChildBlock.querySelector(':scope > div');
  const content = {
    id: blockId,
    title: baseHeadingElement?.textContent || '',
    body: Array.from(bodyElement?.children || [])
      .filter((el) => !el.matches('h2'))
      .map((el) => el.outerHTML)
      .join(''),
  };

  const sections = [];
  let section = {
    id: null,
    steps: [],
  };

  block.style.visibility = 'hidden';

  // Process rows 2 to n; these may be sections or steps
  restOfBlock.forEach((row) => {
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
      // const visual = row.querySelector(':scope > div:last-child');
      const slideWrapper = row.querySelector(':scope > div');
      const children = Array.from(slideWrapper?.children || []);

      // Check if the second element is a UL (callout)
      const hasCallout = children.length > 1 && children[1].tagName === 'UL';

      // Directly destructure based on whether there's a callout
      let audioP;
      let titleElement;
      let rest;
      if (hasCallout) {
        [, , audioP, titleElement, ...rest] = children;
      } else {
        [, audioP, titleElement, ...rest] = children;
      }

      const titleId = titleElement?.id || titleElement?.textContent?.split(' ')?.join('-')?.toLowerCase() || '';
      if (titleElement) {
        titleElement.id = titleId;
      }

      const stepId = section.id ? `${section.id}__${titleId}` : titleId;

      const audio = audioP ? `${audioP.querySelector('a')?.href}` || '' : '';
      if (audioP) {
        audioP.remove();
      }

      section.steps.push({
        id: stepId,
        number: null, // Must be computed after all steps are collected
        active: window.location.hash === `#${blockId}=${stepId}`,
        title: titleElement?.textContent,
        body: Array.from(rest)
          .filter((el) => !el.matches('h3, h4'))
          .map((el) => el.outerHTML)
          .join(' '),
        visual: generateVisualConfig(slideWrapper),
        audio,
      });
    }
  });

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

  await customElements.whenDefined('exl-coachmark');

  content.sections = sections || [];
  const placeholders = await placeHolderPromise;
  block.innerHTML = html(content, placeholders);
  block.querySelectorAll('.step .image img').forEach((imgElement) => {
    imgElement.loading = 'eager';
  });

  addEventHandlers(block, placeholders);

  state.currentStep = content.sections.flatMap((sec) => sec.steps).find((step) => step.active).id;

  if (preferences.get('view') === 'as-docs' || !isDesktopView()) {
    showAllSteps(block);
  } else {
    showStep(block, state.currentStep);
  }

  block.style.display = 'block';
  block.style.visibility = '';
  decorateIcons(block);
  decoratePlaceholders(block);
  return block;
}
