import { loadCSS, loadBlocks, decorateIcons } from '../../scripts/lib-franklin.js';
import { createTag, fetchLanguagePlaceholders, isDocPage, htmlToElement, decorateMain } from '../../scripts/scripts.js';
import loadJWT from '../../scripts/auth/jwt.js';
import { adobeIMS, profile } from '../../scripts/data-service/profile-service.js';
import { tooltipTemplate } from '../../scripts/toast/toast.js';
import renderBookmark from '../../scripts/bookmark/bookmark.js';
import attachCopyLink from '../../scripts/copy-link/copy-link.js';
import { assetInteractionModel } from '../../scripts/analytics/lib-analytics.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/toast/toast.css`);

let translatedDocElement = null;
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/**
 * Appends the element provided to the doc actions block on mobile and desktop.
 * @param {HTMLElement} element
 * @param {HTMLElement} block
 */
const addToDocActions = async (element, block) => {
  const mobileActionsBlock = document.querySelector('.doc-actions-mobile');
  if (document.querySelector('.doc-actions-mobile') !== 'undefined') {
    block.appendChild(element);
  }

  if (mobileActionsBlock) {
    mobileActionsBlock.appendChild(element.cloneNode(true));
    await decorateIcons(mobileActionsBlock);
  }
  await decorateIcons(element);
};

function decorateBookmarkMobileBlock() {
  const docActionsMobile = document.createElement('div');
  docActionsMobile.classList.add('doc-actions-mobile');

  const createdByEl = document.querySelector('.article-metadata-createdby-wrapper');
  const articleMetaDataEl = document.querySelector('.article-metadata-wrapper');
  if (articleMetaDataEl.nextSibling === createdByEl) {
    createdByEl.appendChild(docActionsMobile);
  } else if (articleMetaDataEl) {
    articleMetaDataEl.appendChild(docActionsMobile);
  }
}

const isSignedIn = adobeIMS?.isSignedInUser();

export function decorateBookmark(block) {
  const bookmarkId = ((document.querySelector('meta[name="id"]') || {}).content || '').trim();
  const unAuthBookmark = document.createElement('div');
  unAuthBookmark.className = 'bookmark';
  unAuthBookmark.innerHTML = tooltipTemplate(
    'bookmark-icon',
    `${placeholders.bookmarkUnauthTiptext}`,
    `${placeholders.bookmarkUnauthLabel}`,
  );

  const authBookmark = document.createElement('div');
  authBookmark.className = 'bookmark auth';
  authBookmark.innerHTML = tooltipTemplate(
    'bookmark-icon',
    `${placeholders.bookmarkAuthTiptext}`,
    `${placeholders.bookmarkAuthLabelSet}`,
  );

  if (isSignedIn) {
    block.appendChild(authBookmark);
    if (document.querySelector('.doc-actions-mobile')) {
      document.querySelector('.doc-actions-mobile').appendChild(authBookmark.cloneNode(true));
    }
    const bookmarkAuthedDesktop = document.querySelector('.doc-actions .bookmark.auth');
    const bookmarkAuthedMobile = document.querySelector('.doc-actions-mobile .bookmark.auth');
    const bookmarkAuthedToolTipLabelD = bookmarkAuthedDesktop.querySelector('.exl-tooltip-label');
    const bookmarkAuthedToolTipIconD = bookmarkAuthedDesktop.querySelector('.bookmark-icon');
    const bookmarkAuthedToolTipLabelM = bookmarkAuthedMobile.querySelector('.exl-tooltip-label');
    const bookmarkAuthedToolTipIconM = bookmarkAuthedMobile.querySelector('.bookmark-icon');
    loadJWT().then(async () => {
      profile().then(async (data) => {
        if (data.bookmarks.includes(bookmarkId)) {
          bookmarkAuthedToolTipIconD.classList.add('authed');
          bookmarkAuthedToolTipLabelD.innerHTML = `${placeholders.bookmarkAuthLabelRemove}`;
          bookmarkAuthedToolTipIconM.classList.add('authed');
          bookmarkAuthedToolTipLabelM.innerHTML = `${placeholders.bookmarkAuthLabelRemove}`;
        }
      });

      renderBookmark(bookmarkAuthedToolTipLabelD, bookmarkAuthedToolTipIconD, bookmarkId);
      renderBookmark(bookmarkAuthedToolTipLabelM, bookmarkAuthedToolTipIconM, bookmarkId);
    });
  } else {
    block.appendChild(unAuthBookmark);
    if (document.querySelector('.doc-actions-mobile')) {
      document.querySelector('.doc-actions-mobile').appendChild(unAuthBookmark.cloneNode(true));
    }
  }
}

function decorateCopyLink(block) {
  const copyLinkDivNode = document.createElement('div');
  copyLinkDivNode.className = 'copy-link';
  copyLinkDivNode.innerHTML = tooltipTemplate(
    'copy-icon',
    `${placeholders.toastLabel}`,
    `${placeholders.toastTiptext}`,
  );

  block.appendChild(copyLinkDivNode);
  const docActionsDesktopIconCopy = document.querySelector('.doc-actions .copy-icon');
  const docActionsMobile = document.querySelector('.doc-actions-mobile');

  if (docActionsDesktopIconCopy) {
    attachCopyLink(docActionsDesktopIconCopy, window.location.href, placeholders.toastSet);
  }

  if (docActionsMobile) {
    docActionsMobile.appendChild(copyLinkDivNode.cloneNode(true));
    const docActionsMobileIconCopy = docActionsMobile.querySelector('.copy-icon');
    attachCopyLink(docActionsMobileIconCopy, window.location.href, placeholders.toastSet);
  }
}

async function getTranslatedDocContent() {
  const docPath = `/en/${window.location.pathname.replace(/^(?:[^/]*\/){2}\s*/, '')}`;
  const docResponse = await fetch(`${docPath}.plain.html`);
  const translatedDoc = await docResponse.text();
  const docElement = htmlToElement(`<div>${translatedDoc}</div>`);
  decorateMain(docElement);
  await loadBlocks(docElement);
  return docElement.querySelector(':scope > div:first-child');
}

async function toggleContent(isChecked, docContainer) {
  if (isChecked && !translatedDocElement) {
    translatedDocElement = await getTranslatedDocContent();
  }

  if (isChecked) {
    docContainer.replaceWith(translatedDocElement);
  } else {
    const dc = document.querySelector('main > div:first-child');
    dc.replaceWith(docContainer);
  }
}

async function decorateLanguageToggle(block) {
  if (
    document.querySelector('meta[name="ht-degree"]') &&
    ((document.querySelector('meta[name="ht-degree"]') || {}).content || '').trim() !== '100%'
  ) {
    const languageToggleElement = createTag(
      'div',
      { class: 'doc-mt-toggle' },
      `<div class="doc-mt-checkbox">
      <span>${placeholders.automaticTranslation}</span>
      <input type="checkbox"><a href="${placeholders.automaticTranslationLink}" target="_blank"><span class="icon icon-info"></span></a>
      </div>
      <div class="doc-mt-feedback">
        <span class="prompt">${placeholders.automaticTranslationFeedback}</span>
        <div class="doc-mt-feedback-radio">
          <label class="radio"><input type="radio" name="helpful-translation" value="yes">${placeholders.automaticTranslationFeedbackYes}</label>
          <label class="radio"><input type="radio" name="helpful-translation" value="no">${placeholders.automaticTranslationFeedbackNo}</label>
        </div>
      </div>`,
    );
    addToDocActions(languageToggleElement, block);
    await decorateIcons(block);
    const desktopAndMobileLangToggles = document.querySelectorAll(
      '.doc-mt-toggle .doc-mt-checkbox input[type="checkbox"]',
    );
    const docContainer = document.querySelector('main > div:first-child');

    [...desktopAndMobileLangToggles].forEach((langToggle) => {
      langToggle.addEventListener('change', async (e) => {
        const { checked } = e.target;
        await toggleContent(checked, docContainer);
      });
    });

    const desktopAndMobileRadioFeedback = document.querySelectorAll(
      '.doc-mt-toggle .doc-mt-feedback input[type="radio"]',
    );
    [...desktopAndMobileRadioFeedback].forEach((radio) => {
      radio.addEventListener('click', async () => {
        assetInteractionModel(null, 'Radio Select');
      });
    });
  }
}

export default async function decorateDocActions(block) {
  if (isDocPage) {
    decorateBookmarkMobileBlock();
    decorateLanguageToggle(block);
    decorateBookmark(block);
    decorateCopyLink(block);
  }
}
