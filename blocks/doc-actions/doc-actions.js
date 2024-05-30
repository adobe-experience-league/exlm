import { loadCSS, loadBlocks, decorateIcons } from '../../scripts/lib-franklin.js';
import {
  createTag,
  isDocPage,
  htmlToElement,
  decorateMain,
  fetchLanguagePlaceholders,
  getConfig,
} from '../../scripts/scripts.js';
import { tooltipTemplate } from '../../scripts/toast/toast.js';
import renderBookmark from '../../scripts/bookmark/bookmark.js';
import attachCopyLink from '../../scripts/copy-link/copy-link.js';
import { assetInteractionModel } from '../../scripts/analytics/lib-analytics.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';

const { automaticTranslationLink } = getConfig();

function decorateBookmarkMobileBlock() {
  const docActionsMobile = document.querySelector('.doc-actions-mobile'); // should always be present if article-metadata is present
  if (docActionsMobile) {
    const createdByEl = document.querySelector('.article-metadata-createdby-wrapper');
    const articleMetaDataEl = document.querySelector('.article-metadata-wrapper');
    if (articleMetaDataEl.nextSibling === createdByEl) {
      createdByEl.appendChild(docActionsMobile);
    } else if (articleMetaDataEl) {
      articleMetaDataEl.appendChild(docActionsMobile);
    }
  }
}

export async function decorateBookmark(block, placeholders) {
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
  const docActionsMobileContainer = document.querySelector('.doc-actions-mobile');
  const docActionsMobileBookmark = docActionsMobileContainer.querySelector('.bookmark');
  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    block.appendChild(authBookmark);
    if (docActionsMobileContainer && !docActionsMobileBookmark) {
      docActionsMobileContainer.appendChild(authBookmark.cloneNode(true));
    }
    const bookmarkAuthedDesktop = document.querySelector('.doc-actions .bookmark.auth');
    const bookmarkAuthedMobile = document.querySelector('.doc-actions-mobile .bookmark.auth');
    const bookmarkAuthedToolTipLabelD = bookmarkAuthedDesktop.querySelector('.exl-tooltip-label');
    const bookmarkAuthedToolTipIconD = bookmarkAuthedDesktop.querySelector('.bookmark-icon');
    const bookmarkAuthedToolTipLabelM = bookmarkAuthedMobile.querySelector('.exl-tooltip-label');
    const bookmarkAuthedToolTipIconM = bookmarkAuthedMobile.querySelector('.bookmark-icon');
    defaultProfileClient.getMergedProfile().then(async (data) => {
      if (data.bookmarks.includes(bookmarkId)) {
        bookmarkAuthedToolTipIconD.classList.add('authed');
        bookmarkAuthedToolTipLabelD.innerHTML = `${placeholders.bookmarkAuthLabelRemove}`;
        bookmarkAuthedToolTipIconM.classList.add('authed');
        bookmarkAuthedToolTipLabelM.innerHTML = `${placeholders.bookmarkAuthLabelRemove}`;
      }
    });
    renderBookmark(bookmarkAuthedToolTipLabelD, bookmarkAuthedToolTipIconD, bookmarkId);
    renderBookmark(bookmarkAuthedToolTipLabelM, bookmarkAuthedToolTipIconM, bookmarkId);
  } else {
    block.appendChild(unAuthBookmark);
    if (docActionsMobileContainer && !docActionsMobileBookmark) {
      docActionsMobileContainer.appendChild(unAuthBookmark.cloneNode(true));
    }
  }
}

async function decorateCopyLink(block, placeholders) {
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

  if (docActionsMobile && !docActionsMobile.querySelector('.copy-icon')) {
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
  window.exl = window.exl || {};

  if (isChecked && !window.exl.translatedDocElement) {
    window.exl.translatedDocElement = await getTranslatedDocContent();
  }
  if (isChecked) {
    const docActionsMobile = docContainer.querySelector('.doc-actions-mobile');
    if (docActionsMobile) {
      const createdByEl = window.exl.translatedDocElement.querySelector('.article-metadata-createdby-wrapper');
      const articleMetaDataEl = window.exl.translatedDocElement.querySelector('.article-metadata-wrapper');
      if (articleMetaDataEl.nextSibling === createdByEl) {
        createdByEl.appendChild(docActionsMobile);
      } else if (articleMetaDataEl) {
        articleMetaDataEl.appendChild(docActionsMobile);
      }
    }
    docContainer.replaceWith(window.exl.translatedDocElement);
  } else {
    const dc = document.querySelector('main > div:first-child');
    const docActionsMobile = window.exl.translatedDocElement.querySelector('.doc-actions-mobile');
    if (docActionsMobile) {
      const createdByEl = docContainer.querySelector('.article-metadata-createdby-wrapper');
      const articleMetaDataEl = docContainer.querySelector('.article-metadata-wrapper');
      if (articleMetaDataEl.nextSibling === createdByEl) {
        createdByEl.appendChild(docActionsMobile);
      } else if (articleMetaDataEl) {
        articleMetaDataEl.appendChild(docActionsMobile);
      }
    }
    dc.replaceWith(docContainer);
  }
}

async function decorateLanguageToggle(block, placeholders) {
  if (
    document.querySelector('meta[name="ht-degree"]') &&
    ((document.querySelector('meta[name="ht-degree"]') || {}).content || '').trim() !== '100%'
  ) {
    const languageToggleElement = createTag(
      'div',
      { class: 'doc-mt-toggle' },
      `<div class="doc-mt-checkbox">
      <span>${placeholders.automaticTranslation}</span>
      <input type="checkbox"><a href="${automaticTranslationLink}" target="_blank"><span class="icon icon-info"></span></a>
      </div>
      <div class="doc-mt-feedback">
        <span class="prompt">${placeholders.automaticTranslationFeedback}</span>
        <div class="doc-mt-feedback-radio">
          <label class="radio"><input type="radio" name="helpful-translation" value="yes">${placeholders.automaticTranslationFeedbackYes}</label>
          <label class="radio"><input type="radio" name="helpful-translation" value="no">${placeholders.automaticTranslationFeedbackNo}</label>
        </div>
      </div>`,
    );
    // addToDocActions(languageToggleElement, block);
    block.appendChild(languageToggleElement);
    await decorateIcons(block);
    const desktopAndMobileLangToggles = document.querySelectorAll(
      '.doc-mt-toggle .doc-mt-checkbox input[type="checkbox"]',
    );
    const docContainer = document.querySelector('main > div:first-child');

    [...desktopAndMobileLangToggles].forEach((langToggle) => {
      if (!langToggle.parentElement.classList.contains('listener')) {
        langToggle.addEventListener('change', async (e) => {
          const { checked } = e.target;
          await toggleContent(checked, docContainer);
          assetInteractionModel(null, `automatic translation ${e.target.checked ? 'on' : 'off'}`);
        });
        langToggle.parentElement.classList.add('listener');
      }
    });

    const desktopAndMobileRadioFeedback = document.querySelectorAll(
      '.doc-mt-toggle .doc-mt-feedback input[type="radio"]',
    );
    [...desktopAndMobileRadioFeedback].forEach((radio) => {
      radio.addEventListener('click', async (e) => {
        assetInteractionModel(null, `helpful-translation - ${e.target.value}`);
      });
    });
  }
}

async function decorateBookmarkAndCopy(block, placeholders) {
  await decorateBookmark(block, placeholders);
  await decorateCopyLink(block, placeholders);
}

export default async function decorate(block) {
  if (isDocPage) {
    loadCSS(`${window.hlx.codeBasePath}/scripts/toast/toast.css`);
    fetchLanguagePlaceholders().then((placeholders) => {
      decorateBookmarkMobileBlock(block, placeholders);
      decorateLanguageToggle(block, placeholders);
      decorateBookmarkAndCopy(block, placeholders);
    });
  }
}
