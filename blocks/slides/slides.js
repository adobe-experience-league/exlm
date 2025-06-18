import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import state from './slider-state.js';
import { generateVisualConfig, getPreference, showAllSteps, showStep, addEventHandlers } from './slider-utils.js';

function html(content, placeholders) {
  const initialView = getPreference('view') || 'as-slides';
  const autoplayAudio = getPreference('autoplayAudio') || false;
  const muted = getPreference('muteStatus') || false;

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
                                    <span class="callout callout-${callout.type ?? ''}" data-callout>
                                        <span class="indicator ${callout.clickable ? 'clickable' : ''}" 
                                                ${
                                                  !callout.button && callout.clickable === 'next'
                                                    ? 'data-next-step'
                                                    : ''
                                                } 
                                                data-callout-indicator="${callout.type}"
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
                      <div class="content-info doc-content-info">
                        <label class="step-label">Step ${step.number} of ${section.steps.length}</label>
                        <div class="copy-icon" data-copystep="${step.id}">
                            <span class="icon icon-copy-link"></span>
                            <label>${placeholders?.userActionCopylinkLabel || 'Copy link'}</label>
                        </div>
                      </div>
                      <!-- Slide Controls -->
                      <div class="controls">
                          <div class="controls-bar">
                              <button class="previous-button secondary" data-previous-step="previous-button">${
                                placeholders.playlistPreviousLabel
                              }</button>
                              <button class="next-button" data-next-step="next-button">${
                                placeholders.playlistNextLabel
                              }</button>

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
                                <label class="auto-play-label">${placeholders?.autoPlayLabel || 'Autoplay'}</label>
                              </span>

                          </div >
                          
                          <div class="content-info slides-content-info">
                            <label class="step-label">${
                              placeholders.signupStepProgress
                                ? `${placeholders.signupStepProgress
                                    .replace('{}', step.number)
                                    .replace('{}', section.steps.length)}`
                                : `Step ${step.number} of ${section.steps.length}`
                            }</label>
                            <div class="copy-icon" data-copystep="${step.id}">
                                <span class="icon icon-copy-link"></span>
                                <label>${placeholders?.userActionCopylinkLabel || 'Copy link'}</label>
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
                          <button class="button secondary" data-toggle-view="as-docs">${
                            placeholders?.expandAllStepsLabel || 'Expand all steps'
                          }</button>
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
  const promise = Promise.all(
    restOfBlock.map(async (row) => {
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
        const [, , audioP, titleElement, ...rest] = slideWrapper?.children || [];
        const titleId = titleElement?.id || titleElement?.textContent?.split(' ')?.join('-')?.toLowerCase() || '';
        if (titleElement) {
          titleElement.id = titleId;
        }

        const stepId = section.id ? `${section.id}__${titleId}` : titleId;

        const audio = `${audioP?.querySelector('a')?.href}` || '';
        audioP.remove();

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
    }),
  );

  promise.then(async () => {
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
    const placeholders = await placeHolderPromise;
    block.innerHTML = html(content, placeholders);

    addEventHandlers(block, placeholders);

    state.currentStep = content.sections.flatMap((sec) => sec.steps).find((step) => step.active).id;

    if (getPreference('view') === 'as-docs') {
      showAllSteps(block);
    } else {
      showStep(block, state.currentStep);
    }

    block.style.display = 'block';
    block.style.visibility = '';
    decorateIcons(block);
  });

  return block;
}
