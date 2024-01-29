import { loadCSS, fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { isDocPage } from '../../scripts/scripts.js';
import loadJWT from '../../scripts/auth/jwt.js';
import { adobeIMS, profile } from '../../scripts/data-service/profile-service.js';
import { tooltipTemplate } from '../../scripts/toast/toast.js';
import renderBookmark from '../../scripts/bookmark/bookmark.js';
import attachCopyLink from '../../scripts/copy-link/copy-link.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/toast/toast.css`);

let placeholders = {};
try {
  placeholders = await fetchPlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

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

export default async function decorateDocActions(block) {
  if (isDocPage) {
    decorateBookmarkMobileBlock();
    decorateBookmark(block);
    decorateCopyLink(block);
  }
}
