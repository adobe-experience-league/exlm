import { isDocPage } from '../../scripts/scripts.js';
import loadJWT from '../../scripts/auth/jwt.js';
import { adobeIMS, profile, updateProfile } from '../../scripts/data-service/profile.js';

const CONFIG = {
  BOOKMARK_SET: 'Success! This is bookmarked to your profile.',
  BOOKMARK_UNSET: 'Success! This is no longer bookmarked to your profile.',
  BOOKMARK_UNAUTH_LABEL: 'Sign-in to bookmark',
  BOOKMARK_UNAUTH_TIPTEXT: 'Bookmark',
  BOOKMARK_AUTH_LABEL_SET: 'Bookmark page',
  BOOKMARK_AUTH_LABEL_REMOVE: 'Remove Bookmark',
  BOOKMARK_AUTH_TIPTEXT: 'Bookmark',
  NOTICE_LABEL: 'Copy link',
  NOTICE_TIPTEXT: 'Copy link URL',
  NOTICE_SET: 'URL copied',
};

const tooltipTemplate = (sel, label, tiptext) => {
  const tooltipContent = `<div class="exl-tooltip">
        <span class="icon ${sel}"></span>
        <span class="exl-tooltip-label">${tiptext}</span></div>
        <span class="exl-link-label">${label}</span>`;
  return tooltipContent;
};

const noticeTemplate = (info) => {
  const noticeContent = document.createElement('div');
  noticeContent.className = 'exl-notice';
  noticeContent.innerHTML = `<div class="icon-info"></div>
        <div class="exl-notice-content">${info}</div>
        <div class="icon-close"></div>`;
  return noticeContent;
};

const sendNotice = (noticelabel) => {
  const sendNoticeContent = noticeTemplate(noticelabel);
  document.body.prepend(sendNoticeContent);
  const isExlNotice = document.querySelector('.exl-notice');
  if (isExlNotice) {
    document.querySelector('.exl-notice .icon-close').addEventListener('click', () => {
      isExlNotice.remove();
    });

    setTimeout(() => {
      isExlNotice.remove();
    }, 3000);
  }
};

/**
 * Emit a custom event on an element.
 * @param {HTMLElement} element - The element on which to emit the custom event.
 * @param {string} eventName - The name of the custom event.
 */
function emitCustomEvent(element, eventName) {
  // Create a new custom event
  const customEvent = new Event(eventName);

  // Dispatch the custom event on the element
  element.dispatchEvent(customEvent);
}

const isSignedIn = adobeIMS?.isSignedInUser();

export function decorateBookmark(block) {
  const id = ((document.querySelector('meta[name="id"]') || {}).content || '').trim();
  const unAuthBookmark = document.createElement('div');
  unAuthBookmark.className = 'bookmark';
  unAuthBookmark.innerHTML = tooltipTemplate(
    'bookmark-icon',
    CONFIG.BOOKMARK_UNAUTH_TIPTEXT,
    CONFIG.BOOKMARK_UNAUTH_LABEL,
  );

  const authBookmark = document.createElement('div');
  authBookmark.className = 'bookmark auth';
  authBookmark.innerHTML = tooltipTemplate(
    'bookmark-icon',
    CONFIG.BOOKMARK_AUTH_TIPTEXT,
    CONFIG.BOOKMARK_AUTH_LABEL_SET,
  );

  if (isSignedIn) {
    block.appendChild(authBookmark);
    const bookmarkAuthed = block.querySelector('.bookmark.auth');
    if (bookmarkAuthed) {
      const bookmarkAuthedToolTipLabel = bookmarkAuthed.querySelector('.exl-tooltip-label');
      const bookmarkAuthedToolTipIcon = bookmarkAuthed.querySelector('.icon.bookmark-icon');
      if (id.length === 0) {
        // eslint-disable-next-line
        console.log('Hooking bookmark failed. No id present.');
      } else {
        loadJWT().then(async () => {
          profile().then(async (data) => {
            if (data.bookmarks.includes(id)) {
              emitCustomEvent(block, 'ProfileLoadedEvent');
              bookmarkAuthedToolTipIcon.classList.add('authed');
              bookmarkAuthedToolTipLabel.innerHTML = CONFIG.BOOKMARK_AUTH_LABEL_REMOVE;
            }
          });

          emitCustomEvent(block, 'JwtLoadedEvent');
          bookmarkAuthed.addEventListener('click', async () => {
            if (bookmarkAuthedToolTipIcon.classList.contains('authed')) {
              await updateProfile('bookmarks', id);
              bookmarkAuthedToolTipLabel.innerHTML = CONFIG.BOOKMARK_AUTH_LABEL_SET;
              bookmarkAuthedToolTipIcon.classList.remove('authed');
              sendNotice(CONFIG.BOOKMARK_UNSET);
            } else {
              await updateProfile('bookmarks', id);
              bookmarkAuthedToolTipLabel.innerHTML = CONFIG.BOOKMARK_AUTH_LABEL_REMOVE;
              bookmarkAuthedToolTipIcon.classList.add('authed');
              sendNotice(CONFIG.BOOKMARK_SET);
            }
          });
        });
      }
    }
  } else {
    block.appendChild(unAuthBookmark);
  }
}

export function decorateCopyLink(block) {
  const copyLinkDivNode = document.createElement('div');
  copyLinkDivNode.className = 'copy-link';
  copyLinkDivNode.innerHTML = tooltipTemplate('copy-link-url', CONFIG.NOTICE_LABEL, CONFIG.NOTICE_TIPTEXT);

  block.appendChild(copyLinkDivNode);
}

function hasArticleMetaData() {
  return document.querySelector('.article-metadata-wrapper');
}

function hasArticleMetadataCreatedby() {
  return document.querySelector('.article-metadata-createdby-wrapper');
}

function consolidateEventListeners(block, clonedBlock) {
  const copyLinkIcon = block.querySelector('.icon.copy-link-url');
  const copyLinkIconMobile = clonedBlock.querySelector('.icon.copy-link-url');

  [copyLinkIcon, copyLinkIconMobile].forEach((icon) => {
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(window.location.href);
      sendNotice(CONFIG.NOTICE_SET);
    });
  });
}

function listenForEventAfterPromise(cloned) {
  const id = ((document.querySelector('meta[name="id"]') || {}).content || '').trim();
  const bookmarkAuthed = cloned.querySelector('.bookmark.auth');
  const bookmarkAuthedToolTipLabel = bookmarkAuthed.querySelector('.exl-tooltip-label');
  const bookmarkAuthedToolTipIcon = bookmarkAuthed.querySelector('.icon.bookmark-icon');

  cloned.addEventListener('ProfileLoadedEvent', () => {
    bookmarkAuthedToolTipIcon.classList.add('authed');
    bookmarkAuthedToolTipLabel.innerHTML = CONFIG.BOOKMARK_AUTH_LABEL_REMOVE;
  });

  cloned.addEventListener('JwtLoadedEvent', () => {
    bookmarkAuthed.addEventListener('click', async () => {
      if (bookmarkAuthedToolTipIcon.classList.contains('authed')) {
        await updateProfile('bookmarks', id);
        bookmarkAuthedToolTipLabel.innerHTML = CONFIG.BOOKMARK_AUTH_LABEL_SET;
        bookmarkAuthedToolTipIcon.classList.remove('authed');
        sendNotice(CONFIG.BOOKMARK_UNSET);
      } else {
        await updateProfile('bookmarks', id);
        bookmarkAuthedToolTipLabel.innerHTML = CONFIG.BOOKMARK_AUTH_LABEL_REMOVE;
        bookmarkAuthedToolTipIcon.classList.add('authed');
        sendNotice(CONFIG.BOOKMARK_SET);
      }
    });
  });
}

function cloneBookmarkAndCopyLink(block) {
  const clonedBlock = block.cloneNode(true);
  clonedBlock.classList.add('doc-actions-mobile');
  const createdByEl = document.querySelector('.article-metadata-createdby-wrapper');
  const articleMetaDataEl = document.querySelector('.article-metadata-wrapper');
  const parent = createdByEl.parentNode;
  if (hasArticleMetaData() || hasArticleMetadataCreatedby()) {
    if (hasArticleMetadataCreatedby()) {
      parent.insertBefore(clonedBlock, createdByEl.nextSibling);
    } else if (hasArticleMetaData()) {
      parent.insertBefore(clonedBlock, articleMetaDataEl.nextSibling);
    }
  }

  consolidateEventListeners(block, clonedBlock);
  listenForEventAfterPromise(clonedBlock);
}

export default async function decorateDocActions(block) {
  if (isDocPage) {
    decorateBookmark(block);
    decorateCopyLink(block);
    cloneBookmarkAndCopyLink(block);
  }
}
