import {
  decorateBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  loadBlock,
  loadBlocks,
  getMetadata,
} from './lib-franklin.js';
import { decorateRichtext } from './editor-support-rte.js';
import renderSEOWarnings from './editor-support-seo.js';
import { decorateMain, isPerspectivePage, loadArticles } from './scripts.js';
import { getExlmConfig } from './utils/premium-learning-utils.js';

// set aem content root
window.hlx.aemRoot = '/content/exlm/global';

// extract the visual state so we can restore it after applying updates
function getState(block) {
  const state = {};
  if (block.matches('.tabs')) state.activeTabId = block.querySelector('[aria-selected="true"]').dataset.tabId;
  if (block.matches('.carousel')) {
    const container = block.querySelector('.panel-container');
    state.scrollLeft = container.scrollLeft;
  }
  return state;
}

function restoreState(newBlock, state) {
  if (state.activeTabId) {
    newBlock.querySelector(`[data-tab-id="${state.activeTabId}"]`).click();
  }
  if (state.scrollLeft) {
    newBlock.querySelector('.panel-container').scrollTo({ left: state.scrollLeft, behavior: 'instant' });
  }
}

function setIdsforRTETitles(articleContentSection) {
  // find all titles with no id in the article content section
  articleContentSection
    .querySelectorAll('h1:not([id]),h2:not([id]),h3:not([id]),h4:not([id]),h5:not([id]),h6:not([id])')
    .forEach((title) => {
      title.id = title.textContent
        .toLowerCase()
        .trim()
        .replaceAll('[^a-z0-9-]', '-')
        .replaceAll('-{2,}', '-')
        .replaceAll('^-+', '')
        .replaceAll('-+$', '');
    });
}

function dedupeHeadingIds(root) {
  const headings = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const byId = new Map();
  headings.forEach((heading) => {
    const id = (heading.getAttribute('id') ?? '').trim();
    if (!id) {
      heading.classList.add('no-mtoc');
      return;
    }
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(heading);
  });
  byId.forEach((group) => {
    if (group.length <= 1) return;
    for (let i = 1; i < group.length; i += 1) {
      group[i].classList.add('no-mtoc');
    }
  });
}

// set the filter for an UE editable
function setUEFilter(element, filter) {
  element.dataset.aueFilter = filter;
}

/**
 * See:
 * https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/attributes-types#data-properties
 */
function updateUEInstrumentation() {
  const main = document.querySelector('main');

  // ----- if browse page, identified by theme
  if (document.querySelector('body[class^=browse-]')) {
    // if there is already a editable browse rail on the page
    const browseRailBlock = main.querySelector('div.browse-rail.block[data-aue-resource]');
    if (browseRailBlock) {
      // only more default sections can be added
      setUEFilter(main, 'main');
      // no more browse rails can be added
      setUEFilter(document.querySelector('.section.browse-rail-section'), 'empty');
    } else {
      // allow adding default sections and browse rail section
      setUEFilter(main, 'main-browse');
    }
    // Update available blocks for tab sections
    const tabSections = main.querySelectorAll('div[data-aue-model^="tab-section"]');
    if (tabSections) {
      tabSections.forEach((elem) => {
        setUEFilter(elem, 'tab-section');
      });
    }

    // Update available blocks for default sections excluding browse-rail-section, tab-section and premium-learning-section
    main
      .querySelectorAll(
        '.section:not(.browse-rail-section):not([data-aue-model^="tab-section"]):not([data-aue-model^="premium-learning-section"])',
      )
      .forEach((elem) => {
        setUEFilter(elem, 'section-browse');
      });

    return;
  }

  // ----- if article page, identified by theme
  if (getMetadata('theme') === 'articles') {
    // update available sections
    setUEFilter(main, 'main-article');
    main.querySelectorAll('div[data-aue-model^="article-content-section"]').forEach((el) => {
      el.classList.add('article-content-section');
    });
    // update available blocks for article content sections
    const articleContentSection = main.querySelector('.article-content-section');
    if (articleContentSection) {
      setUEFilter(articleContentSection, 'article-content-section');
      setIdsforRTETitles(articleContentSection);
    }
    // Update available blocks for tab sections
    const tabSections = main.querySelectorAll('div[data-aue-model^="tab-section"]');
    if (tabSections) {
      tabSections.forEach((elem) => {
        setUEFilter(elem, 'tab-section');
      });
    }

    // Update available blocks for default sections excluding article-header-section, article-content-section, tab-section and premium-learning-section
    main
      .querySelectorAll(
        '.section:not(.article-content-section):not(.article-header-section):not([data-aue-model^="tab-section"]):not([data-aue-model^="premium-learning-section"])',
      )
      .forEach((elem) => {
        setUEFilter(elem, 'section-article');
      });

    return;
  }

  // ----- if author bio page, identified by theme
  if (getMetadata('theme') === 'authors-bio-page') {
    // update available sections
    setUEFilter(main, 'empty');
    // update the only available default section
    const section = main.querySelector('.section');
    // if there is already an author bio block
    const authorBioBlock = main.querySelector('div.author-bio.block');
    if (authorBioBlock) {
      // no more blocks selectable
      setUEFilter(section, 'empty');
    } else {
      // only allow adding author bio blocks
      setUEFilter(section, 'section-author-bio');
    }
  }

  // ----- if header, identified by theme
  if (getMetadata('theme') === 'header') {
    // update available sections
    setUEFilter(main, 'empty');
    // update the only available default section
    const section = main.querySelector('.section');
    setUEFilter(section, 'section-header');
  }

  // ----- if footer, identified by theme
  if (getMetadata('theme') === 'footer') {
    // update available sections
    setUEFilter(main, 'empty');
    // update the only available default section
    const section = main.querySelector('.section');
    setUEFilter(section, 'section-footer');
  }

  // ----- if profile pages, identified by theme
  if (getMetadata('theme') === 'profile') {
    // update available sections
    setUEFilter(main, 'main-profile');
  }

  // ----- if signup-flow-modal pages, identified by theme
  if (getMetadata('theme') === 'signup') {
    // update available sections
    setUEFilter(main, 'main-signup');
    main.querySelectorAll('.section').forEach((elem) => {
      setUEFilter(elem, 'sign-up-flow-section');
    });
  }

  // ----- if courses page, identified by theme
  if (getMetadata('theme')?.includes('courses')) {
    // update available sections
    setUEFilter(main, 'main-courses');
  }

  // ----- if course hub page, identified by theme
  if (getMetadata('theme')?.includes('course-hub')) {
    // update available sections
    setUEFilter(main, 'main-course-hub');
  }
}

// Property name as exported into the <meta> tag by the page component —
// AEM exports jcr:content properties verbatim (case-sensitive) as
// meta[name="<propertyName>"], so this must match component-models.json's
// "name" value exactly. redpenScore is no longer written as a separate
// property — redpen-properties already carries final_score as part of the
// full response payload (see getRedpenProperty below).
const REDPEN_PROPERTIES_META_NAME = 'redpen-properties';

// Single source of truth for the gate — a `let`, not a `const`, so it can
// later be updated from exlm-config once fetched (step 2+ of the
// integration plan) without touching updatePublishGate itself.
let redpenPublishThreshold = 0;

const REDPEN_PUBLISH_THRESHOLD_CONFIG_KEY = 'redpenPublishThreshold';

/**
 * Fetches the author-configurable threshold from the exlm-config sheet
 * (same mechanism as plAllowedDomains) and updates redpenPublishThreshold.
 * Deliberately NOT called anywhere near module init's synchronous gate-set
 * sequence — see the call site at the bottom of this file for why. Only
 * ever updates the cached value for whichever updatePublishGate call
 * happens next (a later Score click or content edit) — never re-triggers
 * a gate decision itself, so there's no race with the proven-working
 * synchronous flow.
 */
async function primeRedpenPublishThreshold() {
  try {
    const raw = await getExlmConfig(REDPEN_PUBLISH_THRESHOLD_CONFIG_KEY);
    const threshold = Number(raw);
    redpenPublishThreshold = Number.isFinite(threshold) ? threshold : 0;
    // eslint-disable-next-line no-console
    console.log(
      '[RedPen] threshold config — key:',
      REDPEN_PUBLISH_THRESHOLD_CONFIG_KEY,
      'raw:',
      raw,
      '-> redpenPublishThreshold now:',
      redpenPublishThreshold,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[RedPen] threshold config fetch threw, keeping current value:', redpenPublishThreshold, err);
  }
}

/**
 * Reads a score value out of an arbitrary parsed document's <head> (used to
 * react to a freshly-fetched UE patch response before it's applied to the
 * live DOM — see the applyChanges() hook below).
 */
function getMetadataFromDoc(doc, name) {
  const meta = doc.head?.querySelector(`meta[name="${name}"]`);
  return meta ? meta.content : '';
}

/**
 * Extracts a named field out of the redpen-properties JSON blob (e.g.
 * "final_score", "clarity", "scoredAt") — there's no separate redpenScore
 * property anymore, Scoring.tsx writes everything as part of the single
 * redpen-properties payload. Returns '' (matching the existing "no score
 * yet" convention consumed by updatePublishGate) if the properties value
 * is missing, unparseable, or doesn't have that field.
 */
function getRedpenProperty(propertiesRaw, propertyName) {
  if (!propertiesRaw) return '';
  try {
    const value = JSON.parse(propertiesRaw)?.[propertyName];
    return value === undefined || value === null ? '' : String(value);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[RedPen] failed to parse redpen-properties for "${propertyName}", treating as missing:`, err);
    return '';
  }
}

/**
 * Ensures the Publish-gate <meta> tag always exists in <head>, so enabling
 * and disabling is always just a content toggle on the same element —
 * never conditional creation/removal.
 */
function ensurePublishGateMeta() {
  let meta = document.querySelector('meta[name="urn:adobe:aue:config:disable"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'urn:adobe:aue:config:disable';
    meta.content = 'publish';
    document.head.appendChild(meta);
  }
  return meta;
}

/**
 * Enables/disables Publish based on the RedPen score. Defaults to disabled
 * (score missing, unparsable, or below redpenPublishThreshold) — only
 * explicitly enables when a valid score meets or clears the threshold.
 * Safe to call repeatedly — it always toggles the same meta tag's content.
 */
function updatePublishGate(scoreRaw) {
  const score = Number(scoreRaw);
  const shouldDisable = scoreRaw === '' || Number.isNaN(score) || score < redpenPublishThreshold;
  const meta = ensurePublishGateMeta();

  // eslint-disable-next-line no-console
  console.log(
    '[RedPen] score:',
    scoreRaw,
    '-> publish',
    shouldDisable ? 'disabled' : 'enabled',
    `(threshold: ${redpenPublishThreshold})`,
  );

  meta.content = shouldDisable ? 'publish' : '';
}

/**
 * Event listener for aue:content-patch, edit of a component
 */

async function applyChanges(event) {
  // redecorate default content and blocks on patches (in the properties rail)
  const { detail } = event;

  const resource =
    detail?.request?.target?.resource || // update, patch components
    detail?.request?.target?.container?.resource || // update, patch, add to sections
    detail?.request?.to?.container?.resource; // move in sections
  if (!resource) return false;
  const updates = detail?.response?.updates;
  if (!updates?.length) return false;
  const { content } = updates[0];
  if (!content) return false;

  // TODO: remove this diagnostic logging block once RedPen publish gating
  // has been end-to-end validated in production — it dumps the full raw
  // patch payload and parsed <head> on every content-patch event.
  // eslint-disable-next-line no-console
  console.log('[UE applyChanges] resource:', resource);
  // eslint-disable-next-line no-console
  console.log(
    '[RedPen] patch type:',
    resource.endsWith('/jcr:content') ? 'RedPen metadata patch (redpenScore/redpen-properties)' : 'content patch',
  );
  // eslint-disable-next-line no-console
  console.log('[UE applyChanges] raw content:', content);

  const parsedUpdate = new DOMParser().parseFromString(content, 'text/html');
  // eslint-disable-next-line no-console
  console.log('[UE applyChanges] parsed <head>:', parsedUpdate.head.innerHTML);
  // eslint-disable-next-line no-console
  console.log(
    '[UE applyChanges] parsed <meta> tags:',
    [...parsedUpdate.querySelectorAll('meta')].map((m) => ({
      name: m.name,
      property: m.getAttribute('property'),
      content: m.content,
    })),
  );
  // TODO: end of diagnostic logging block to remove post-validation.

  // RedPen publish gating only applies on the "articles" theme — other
  // page types keep whatever Publish state UE gives them by default,
  // untouched by any of the logic below. This does NOT affect
  // isRedpenMetadataPatch's detection itself (that also guards the
  // generic reload-race avoidance for any page-metadata patch, not just
  // RedPen's), only the actual gate-mutating calls.
  const isArticlesTheme = getMetadata('theme') === 'articles';

  // Determine the RedPen reaction here (need parsedUpdate's <head>), but
  // DEFER actually calling updatePublishGate until after all the live-patch
  // work below completes — the meta tag update needs to happen LAST, after
  // applying changes, matching the order confirmed working before the
  // exlm-config threshold integration. Isolated in try/catch — this is
  // RedPen-specific and must never prevent the core content-patching logic
  // below from running for a real edit.
  let isRedpenMetadataPatch = false;
  let freshScoreForGate = '';
  try {
    isRedpenMetadataPatch = resource.endsWith('/jcr:content');
    const freshProperties = getMetadataFromDoc(parsedUpdate, REDPEN_PROPERTIES_META_NAME);
    if (freshProperties !== '') {
      // eslint-disable-next-line no-console
      console.log('[RedPen] redpen-properties updated:', freshProperties);
    }
    freshScoreForGate = getRedpenProperty(freshProperties, 'final_score');
  } catch (redpenErr) {
    // eslint-disable-next-line no-console
    console.error('[RedPen] failed to process metadata patch reaction (non-fatal):', redpenErr);
  }

  // Page-level metadata patches (bare .../jcr:content, no /root or deeper)
  // have no corresponding canvas element and nothing to re-render — the
  // fallback below would return false and trigger a full page reload,
  // which races the property write's server-side propagation and can read
  // back a stale/empty value, overwriting the correct gate update above
  // with an incorrect forced-disable. Apply the gate now (nothing else to
  // run after it for this branch) and report back to the caller.
  if (isRedpenMetadataPatch) {
    // Called unconditionally (even when freshScoreForGate is '') so a
    // missing/cleared score fails closed via updatePublishGate's own
    // default-disable handling, instead of silently leaving Publish in
    // whatever state the previous score left it.
    if (isArticlesTheme) {
      try {
        updatePublishGate(freshScoreForGate);
      } catch (redpenErr) {
        // eslint-disable-next-line no-console
        console.error('[RedPen] failed to update gate for metadata patch (non-fatal):', redpenErr);
      }
    }
    return true;
  }

  const element = document.querySelector(`[data-aue-resource="${resource}"]`);

  // Any patch reaching here is a genuine content change (component, block,
  // section, richtext, move, etc), not a RedPen metadata-only write — the
  // existing score no longer reflects the current content, so force
  // Publish disabled until the author re-runs RedPen scoring. Called right
  // before each return below — LAST, after the DOM patching above it has
  // completed — matching the order confirmed working before the
  // exlm-config threshold integration. Gated to the "articles" theme —
  // no-op on any other page type.
  const invalidateScoreForContentChange = () => {
    if (!isArticlesTheme) return;
    try {
      // eslint-disable-next-line no-console
      console.log('[RedPen] content changed — invalidating score, publish disabled until re-scored');
      updatePublishGate('');
    } catch (redpenErr) {
      // eslint-disable-next-line no-console
      console.error('[RedPen] failed to invalidate score on content change (non-fatal):', redpenErr);
    }
  };

  if (element) {
    if (element.matches('main')) {
      const newMain = parsedUpdate.querySelector(`[data-aue-resource="${resource}"]`);
      newMain.style.display = 'none';
      if (isPerspectivePage) {
        dedupeHeadingIds(element);
      }
      element.insertAdjacentElement('afterend', newMain);
      decorateMain(newMain);
      decorateRichtext(newMain);
      await loadBlocks(newMain);
      element.remove();
      loadArticles();
      newMain.style.display = null;
      // eslint-disable-next-line no-use-before-define
      attachEventListeners(newMain);
      invalidateScoreForContentChange();
      return true;
    }

    const block =
      element.parentElement?.closest('.block[data-aue-resource]') || element?.closest('.block[data-aue-resource]');
    if (block) {
      const state = getState(block);
      const blockResource = block.getAttribute('data-aue-resource');
      const newBlock = parsedUpdate.querySelector(`[data-aue-resource="${blockResource}"]`);
      if (newBlock) {
        newBlock.style.display = 'none';
        block.insertAdjacentElement('afterend', newBlock);
        decorateButtons(newBlock);
        decorateIcons(newBlock);
        decorateBlock(newBlock);
        decorateRichtext(newBlock);
        await loadBlock(newBlock);
        block.remove();
        newBlock.style.display = null;
        restoreState(newBlock, state);
        invalidateScoreForContentChange();
        return true;
      }
    } else {
      // sections and default content, may be multiple in the case of richtext
      const newElements = parsedUpdate.querySelectorAll(
        `[data-aue-resource="${resource}"],[data-richtext-resource="${resource}"]`,
      );
      if (newElements.length) {
        const { parentElement } = element;
        if (element.matches('.tabpanel')) {
          const [newSection] = newElements;
          element.style.display = 'none';
          element.insertAdjacentElement('afterend', newSection);
          newSection.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
            heading.classList.add('no-mtoc');
          });
          decorateButtons(newSection);
          decorateIcons(newSection);
          decorateSections(parentElement);
          decorateBlocks(parentElement);
          decorateRichtext(newSection);
          await loadBlocks(parentElement);
          element.innerHTML = newSection.innerHTML;
          newSection.remove();
          element.style.display = null;
          invalidateScoreForContentChange();
          return true;
        }
        if (element.matches('.section')) {
          let articleContentContainer;
          const [newSection] = newElements;
          newSection.style.display = 'none';
          element.insertAdjacentElement('afterend', newSection);
          decorateButtons(newSection);
          decorateIcons(newSection);
          if (document.querySelector('.article-content-container')) {
            articleContentContainer = document.querySelector('.article-content-container').cloneNode(true);
          }
          decorateSections(parentElement);
          decorateBlocks(parentElement);
          decorateRichtext(newSection);
          await loadBlocks(parentElement);
          element.remove();
          if (articleContentContainer && !parentElement.classList.contains('article-content-container')) {
            parentElement
              .querySelector('.article-content-container')
              .insertAdjacentElement('afterend', articleContentContainer);
            parentElement.querySelector('.article-content-container').remove();
          }
          newSection.style.display = null;
        } else {
          element.replaceWith(...newElements);
          if (element.closest('.tab-panel')) element.classList.add('no-mtoc');
          decorateButtons(parentElement);
          decorateIcons(parentElement);
          decorateRichtext(parentElement);
        }
        invalidateScoreForContentChange();
        return true;
      }
    }
  }

  return false;
}

/**
 * Event listener for aue:ui-select, selection of a component
 */
async function handleEditorSelect(event) {
  // we are only interested in the target
  if (!event.detail.selected) {
    return;
  }

  // handle flip card selection
  const { handleFlipCardSelection } = await import('./editor-support-blocks.js');
  handleFlipCardSelection(event);

  // if a tab panel was selected
  if (event.target.closest('.tabpanel')) {
    // switch to the selected tab
    const tabItem = event.target.closest('.tabpanel');
    // get the corresponding tabs button
    const buttonId = tabItem.getAttribute('aria-labelledby');
    const button = tabItem.closest('.tabs.block').querySelector(`button[id="${buttonId}"]`);
    // click it
    button.click();
  }

  // if a teaser in a carousel was selected
  if (event.target.closest('.panel-container')) {
    // switch to the selected carousel slide
    const carouselItem = event.target;
    carouselItem.parentElement.scrollTo({
      top: 0,
      left: carouselItem.offsetLeft - carouselItem.parentNode.offsetLeft,
      behavior: 'instant',
    });
  }
}

function attachEventListeners(main) {
  ['aue:content-patch', 'aue:content-update', 'aue:content-add', 'aue:content-move', 'aue:content-remove'].forEach(
    (eventType) =>
      main?.addEventListener(eventType, async (event) => {
        event.stopPropagation();
        const applied = await applyChanges(event);
        if (applied) {
          updateUEInstrumentation();
          renderSEOWarnings();
          if (main.querySelectorAll('.block.code').length > 0) {
            const { highlightCodeBlock } = await import('./editor-support-blocks.js');
            const updatedEl = event.detail?.element ?? main;
            await highlightCodeBlock(updatedEl);
          }
        } else {
          window.location.reload();
        }
      }),
  );

  main.addEventListener('aue:ui-select', handleEditorSelect);
}

attachEventListeners(document.querySelector('main'));

// temporary workaround until aue:ui-edit and aue:ui-preview events become available
// show/hide sign-up block when switching betweeen UE Edit mode and preview
const signUpBlock = document.querySelector('.block.sign-up');
if (signUpBlock) {
  const { handleSignUpBlock } = await import('./editor-support-blocks.js');
  await handleSignUpBlock(signUpBlock);
}

// update UE component filters on page load
updateUEInstrumentation();

// RedPen init is isolated in try/catch — a failure here must not prevent
// the rest of this module's top-level setup (above) from running. It also
// runs LAST, after the unrelated setup above, so a slow/failing
// exlm-config.json fetch inside primeRedpenPublishThreshold (up to its
// 5s timeout) never delays the sign-up block toggle or
// updateUEInstrumentation — neither depends on the RedPen gate outcome.
try {
  // All RedPen publish gating is scoped to the "articles" theme — other
  // page types are left with whatever default Publish state UE gives
  // them, untouched by any RedPen logic.
  if (getMetadata('theme') === 'articles') {
    // Awaited before the first gate decision, so the very first page-load
    // check already uses the real configured threshold instead of the
    // hardcoded default. Confirmed (2026-07-09) working correctly — the
    // earlier enable/disable failures traced back to other bugs (tag
    // mechanism, reload races) that have since been fixed, not to this
    // await itself.
    await primeRedpenPublishThreshold();

    // Fetch current page properties on load and set the initial gate —
    // defaults to disabled (see updatePublishGate) unless final_score
    // (inside redpen-properties) already clears redpenPublishThreshold
    // (now primed above, so this decision uses the real configured value).
    const propertiesOnLoad = getMetadata(REDPEN_PROPERTIES_META_NAME);
    // eslint-disable-next-line no-console
    console.log('[RedPen] redpen-properties on load:', propertiesOnLoad);
    updatePublishGate(getRedpenProperty(propertiesOnLoad, 'final_score'));
  } else {
    // eslint-disable-next-line no-console
    console.log('[RedPen] theme is not "articles" — skipping RedPen publish gating');
  }
} catch (redpenErr) {
  // eslint-disable-next-line no-console
  console.error('[RedPen] failed to initialize publish gate on load (non-fatal):', redpenErr);
}
