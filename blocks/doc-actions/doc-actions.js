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
    if (document.querySelector('.doc-actions-mobile')) {
      document.querySelector('.doc-actions-mobile').appendChild(authBookmark.cloneNode(true));
    }
    const bookmarkAuthed = document.querySelectorAll('.bookmark.auth');
    if (bookmarkAuthed.length > 0) {
      bookmarkAuthed.forEach((elem) => {
        const bookmarkAuthedToolTipLabel = elem.querySelector('.exl-tooltip-label');
        const bookmarkAuthedToolTipIcon = elem.querySelector('.icon.bookmark-icon');
        if (id.length === 0) {
          console.log('Hooking bookmark failed. No id present.');
        } else {
          loadJWT().then(async () => {
            profile().then(async (data) => {
              if (data.bookmarks.includes(id)) {
                bookmarkAuthedToolTipIcon.classList.add('authed');
                bookmarkAuthedToolTipLabel.innerHTML = CONFIG.BOOKMARK_AUTH_LABEL_REMOVE;
              }
            });

            elem.addEventListener('mousedown', async () => {
              if (bookmarkAuthedToolTipIcon.classList.contains('authed')) {
                await updateProfile('bookmarks', id);
                bookmarkAuthedToolTipLabel.innerHTML = CONFIG.BOOKMARK_AUTH_LABEL_SET;
                bookmarkAuthedToolTipIcon.classList.remove('authed');
                sendNotice(CONFIG.BOOKMARK_UNSET);
                elem.style.pointerEvents = 'none';
              } else {
                await updateProfile('bookmarks', id);
                bookmarkAuthedToolTipLabel.innerHTML = CONFIG.BOOKMARK_AUTH_LABEL_REMOVE;
                bookmarkAuthedToolTipIcon.classList.add('authed');
                sendNotice(CONFIG.BOOKMARK_SET);
                elem.style.pointerEvents = 'none';
              }
              setTimeout(() => {
                elem.style.pointerEvents = 'auto';
              }, 3000);
            });
          });
        }
      });
    }
  } else {
    if (document.querySelector('.doc-actions-mobile')) {
      document.querySelector('.doc-actions-mobile').appendChild(unAuthBookmark.cloneNode(true));
    }
    block.appendChild(unAuthBookmark);
  }
}

export function decorateCopyLink(block) {
  const copyLinkDivNode = document.createElement('div');
  copyLinkDivNode.className = 'copy-link';
  copyLinkDivNode.innerHTML = tooltipTemplate('copy-link-url', CONFIG.NOTICE_LABEL, CONFIG.NOTICE_TIPTEXT);

  if (document.querySelector('.doc-actions-mobile')) {
    document.querySelector('.doc-actions-mobile').appendChild(copyLinkDivNode.cloneNode(true));
  }
  block.appendChild(copyLinkDivNode);
  const copyLinkIcons = document.querySelectorAll('.icon.copy-link-url');
  copyLinkIcons.forEach((copyLinkIcon) => {
    if (copyLinkIcon) {
      copyLinkIcon.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(window.location.href);
        sendNotice(CONFIG.NOTICE_SET);
      });
    }
  });
}

export default async function decorateDocActions(block) {
  if (isDocPage) {
    decorateBookmarkMobileBlock();
    decorateBookmark(block);
    decorateCopyLink(block);
  }
}
