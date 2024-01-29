import { loadCSS, fetchPlaceholders, loadBlocks } from '../../scripts/lib-franklin.js';
import { createTag, isDocPage, htmlToElement, decorateMain } from '../../scripts/scripts.js';
import loadJWT from '../../scripts/auth/jwt.js';
import { adobeIMS, profile } from '../../scripts/data-service/profile-service.js';
import { tooltipTemplate } from '../../scripts/toast/toast.js';
import renderBookmark from '../../scripts/bookmark/bookmark.js';
import attachCopyLink from '../../scripts/copy-link/copy-link.js';
import decorateMiniTOC from '../mini-toc/mini-toc.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/toast/toast.css`);

let translatedDocElement = null;
let placeholders = {};
try {
  placeholders = await fetchPlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/**
 * Appends the element provided to the doc actions block on mobile and desktop.
 * @param {HTMLElement} element
 * @param {HTMLElement} block
 */
const addToDocActions = (element, block) => {
  const mobileActionsBlock = document.querySelector('.doc-actions-mobile');
  block.appendChild(element);

  if (mobileActionsBlock) {
    mobileActionsBlock.appendChild(element.cloneNode(true));
  }
};

function decorateBookmarkMobileBlock() {
  const docActionsMobile = document.createElement('div');
  docActionsMobile.classList.add('doc-actions-mobile', 'doc-actions');

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
    addToDocActions(unAuthBookmark, block);
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

  const docActionsMobile = document.querySelector('.doc-actions-mobile');
  if (docActionsMobile) {
    docActionsMobile.appendChild(copyLinkDivNode.cloneNode(true));
    // below 2 lines are unique to this method so cannot use addToDocActions()
    const docActionsMobileIconCopy = docActionsMobile.querySelector('.copy-icon');
    attachCopyLink(docActionsMobileIconCopy, window.location.href, placeholders.toastSet);
  }

  const docActionsDesktopIconCopy = document.querySelector('.doc-actions .copy-icon');
  if (docActionsDesktopIconCopy) {
    attachCopyLink(docActionsDesktopIconCopy, window.location.href, placeholders.toastSet);
  }
}

async function getTranslatedDocContent() {
  const regExp = new RegExp(/\/[a-zA-Z]{2}\//);
  const docPath = window.location.pathname.replace(regExp, '/en/');
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
    decorateMiniTOC();
  } else {
    const dc = document.querySelector('main > div:first-child');
    dc.replaceWith(docContainer);
  }
}

function decorateLanguageToggle(block) {
  const languageToggleElement = createTag('div', { class: 'doc-mt-toggle' }, '<input type="checkbox">');
  addToDocActions(languageToggleElement, block);
  const desktopAndMobileLangToggles = document.querySelectorAll('.doc-mt-toggle input');
  const docContainer = document.querySelector('main > div:first-child');

  [...desktopAndMobileLangToggles].forEach((langToggle) => {
    langToggle.addEventListener('change', async (e) => {
      const { checked } = e.target;
      await toggleContent(checked, docContainer);
    });
  });
}

export default async function decorateDocActions(block) {
  if (isDocPage) {
    decorateBookmarkMobileBlock();
    decorateLanguageToggle(block);
    decorateBookmark(block);
    decorateCopyLink(block);
  }
}
