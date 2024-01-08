import { fetchPlaceholders, loadBlocks } from '../../scripts/lib-franklin.js';
import { createTag, isDocPage, htmlToElement, decorateMain } from '../../scripts/scripts.js';
import loadJWT from '../../scripts/auth/jwt.js';
import { adobeIMS, profile, updateProfile } from '../../scripts/data-service/profile-service.js';

const placeholders = await fetchPlaceholders();
let translatedDocElement = null;

const tooltipTemplate = (sel, label, tiptext) => {
  const tooltipContent = `<div class="exl-tooltip">
        <span class="icon ${sel}"></span>
        <span class="exl-tooltip-label">${tiptext}</span></div>
        <span class="exl-link-label">${label}</span>`;
  return tooltipContent;
};

const noticeTemplate = (info) => {
  const noticeContent = document.createElement('div');
  noticeContent.className = 'exl-toast';
  noticeContent.innerHTML = `<div class="icon-info"></div>
        <div class="exl-toast-content">${info}</div>
        <div class="icon-close"></div>`;
  return noticeContent;
};

const sendNotice = (noticelabel) => {
  const sendNoticeContent = noticeTemplate(noticelabel);
  document.body.prepend(sendNoticeContent);
  const isExlNotice = document.querySelector('.exl-toast');
  if (isExlNotice) {
    document.querySelector('.exl-toast .icon-close').addEventListener('click', () => {
      isExlNotice.remove();
    });

    setTimeout(() => {
      isExlNotice.remove();
    }, 3000);
  }
};

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
  const id = ((document.querySelector('meta[name="id"]') || {}).content || '').trim();
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
    const bookmarkAuthed = document.querySelectorAll('.bookmark.auth');
    if (bookmarkAuthed.length > 0) {
      bookmarkAuthed.forEach((elem) => {
        const bookmarkAuthedToolTipLabel = elem.querySelector('.exl-tooltip-label');
        const bookmarkAuthedToolTipIcon = elem.querySelector('.icon.bookmark-icon');
        if (id) {
          loadJWT().then(async () => {
            profile().then(async (data) => {
              if (data.bookmarks.includes(id)) {
                bookmarkAuthedToolTipIcon.classList.add('authed');
                bookmarkAuthedToolTipLabel.innerHTML = `${placeholders.bookmarkAuthLabelRemove}`;
              }
            });

            bookmarkAuthedToolTipIcon.addEventListener('click', async () => {
              if (bookmarkAuthedToolTipIcon.classList.contains('authed')) {
                await updateProfile('bookmarks', id);
                bookmarkAuthedToolTipLabel.innerHTML = `${placeholders.bookmarkAuthLabelSet}`;
                bookmarkAuthedToolTipIcon.classList.remove('authed');
                sendNotice(`${placeholders.bookmarkUnset}`);
                bookmarkAuthedToolTipIcon.style.pointerEvents = 'none';
              } else {
                await updateProfile('bookmarks', id);
                bookmarkAuthedToolTipLabel.innerHTML = `${placeholders.bookmarkAuthLabelRemove}`;
                bookmarkAuthedToolTipIcon.classList.add('authed');
                sendNotice(`${placeholders.bookmarkSet}`);
                bookmarkAuthedToolTipIcon.style.pointerEvents = 'none';
              }
              setTimeout(() => {
                bookmarkAuthedToolTipIcon.style.pointerEvents = 'auto';
              }, 3000);
            });
          });
        }
      });
    }
  } else {
    addToDocActions(unAuthBookmark, block);
  }
}

export function decorateCopyLink(block) {
  const copyLinkDivNode = document.createElement('div');
  copyLinkDivNode.className = 'copy-link';
  copyLinkDivNode.innerHTML = tooltipTemplate(
    'copy-link-url',
    `${placeholders.toastLabel}`,
    `${placeholders.toastTiptext}`,
  );

  addToDocActions(copyLinkDivNode, block);
  const copyLinkIcons = document.querySelectorAll('.icon.copy-link-url');
  copyLinkIcons.forEach((copyLinkIcon) => {
    if (copyLinkIcon) {
      copyLinkIcon.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(window.location.href);
        sendNotice(`${placeholders.toastSet}`);
      });
    }
  });
}

async function getTranslatedDocContent() {
  const docPath = window.location.pathname;
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
