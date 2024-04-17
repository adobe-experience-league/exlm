import {
  getEDSLink,
  getLink,
  getPathDetails,
  createPlaceholderSpan,
  fetchLanguagePlaceholders,
} from '../../scripts/scripts.js';
import { tooltipTemplate } from '../../scripts/toast/toast.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { decorateIcons, loadCSS } from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import loadJWT from '../../scripts/auth/jwt.js';
import renderBookmark from '../../scripts/bookmark/bookmark.js';
import attachCopyLink from '../../scripts/copy-link/copy-link.js';

const metadataProperties = {
  adobe: 'adobe',
  external: 'external',
};

/* Fetch data from the Placeholder.json */
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

export async function decorateBookmark(block) {
  const bookmarkId = ((document.querySelector('meta[name="id"]') || {}).content || '').trim();
  const unAuthBookmark = document.createElement('div');
  unAuthBookmark.className = 'bookmark';
  unAuthBookmark.innerHTML = tooltipTemplate('bookmark-icon', 'Bookmark page', placeholders.bookmarkUnauthLabel);

  const authBookmark = document.createElement('div');
  authBookmark.className = 'bookmark auth';
  authBookmark.innerHTML = tooltipTemplate('bookmark-icon', 'Bookmark page', placeholders.bookmarkAuthLabelSet);

  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    block.appendChild(authBookmark);
    const bookmarkAuthedToolTipLabel = authBookmark.querySelector('.exl-tooltip-label');
    const bookmarkAuthedToolTipIcon = authBookmark.querySelector('.bookmark-icon');
    loadJWT().then(async () => {
      defaultProfileClient.getMergedProfile().then(async (data) => {
        if (data.bookmarks.includes(bookmarkId)) {
          bookmarkAuthedToolTipIcon.classList.add('authed');
          bookmarkAuthedToolTipLabel.innerHTML = placeholders.bookmarkAuthLabelRemove;
        }
      });

      renderBookmark(bookmarkAuthedToolTipLabel, bookmarkAuthedToolTipIcon, bookmarkId);
    });
  } else {
    block.appendChild(unAuthBookmark);
  }
}

async function decorateCopyLink(block) {
  const copyLinkDivNode = document.createElement('div');
  copyLinkDivNode.className = 'copy-link';
  copyLinkDivNode.innerHTML = tooltipTemplate('copy-icon', 'Copy page url', placeholders.toastTiptext);

  block.appendChild(copyLinkDivNode);
  attachCopyLink(copyLinkDivNode, window.location.href, placeholders.toastSet);
}

async function decorateBookmarkAndCopy(block) {
  await decorateBookmark(block);
  await decorateCopyLink(block);
}

async function createOptions(container, readTimeText) {
  const options = document.createElement('div');
  options.classList.add('article-marquee-options');
  await decorateBookmarkAndCopy(options, placeholders);

  const lastUpdated = document.createElement('div');
  const lastUpdatedData = document.querySelector('meta[name="published-time"]').getAttribute('content');
  const date = new Date(lastUpdatedData);
  lastUpdated.classList.add('article-marquee-last-updated');
  lastUpdated.textContent = `${placeholders.articleMarqueeLastUpdatedText} ${date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`;

  const readTime = document.createElement('div');
  readTime.classList.add('article-marquee-read-time');
  readTime.innerHTML = `<span class="icon icon-time"></span> <span>${readTimeText} ${placeholders.articleMarqueeReadTimeText}</span>`;

  container.appendChild(options);
  container.appendChild(lastUpdated);
  container.appendChild(readTime);
}

function createBreadcrumb(container) {
  // get current page path
  const currentPath = getEDSLink(document.location.pathname);

  // split the path at browse root
  const browseRootName = 'article';
  const pathParts = currentPath.split(browseRootName);
  // prefix language path
  const browseRoot = `${pathParts[0]}${browseRootName}`;

  // set the root breadcrumb
  const rootCrumbElem = document.createElement('a');
  rootCrumbElem.appendChild(createPlaceholderSpan('article', 'Article'));
  rootCrumbElem.setAttribute('href', getLink(browseRoot));
  container.append(rootCrumbElem);

  // get the browse index
  ffetch(`/${getPathDetails().lang}/article-index.json`)
    .all()
    .then((index) => {
      // build the remaining breadcrumbs
      pathParts[1].split('/').reduce((prevSubPath, nextPathElem) => {
        // create the next crumble sub path
        const nextCrumbSubPath = `${prevSubPath}/${nextPathElem}`;
        // construct full crumb path
        const fullCrumbPath = `${browseRoot}${nextCrumbSubPath}`;
        // has page been published and indexed ?
        const indexEntry = index.find((e) => e.path === fullCrumbPath);
        if (indexEntry) {
          let elem;
          // create crumb element, either 'a' or 'span'
          if (fullCrumbPath !== currentPath) {
            elem = document.createElement('a');
            elem.setAttribute('href', getLink(fullCrumbPath));
          } else {
            elem = document.createElement('span');
          }
          elem.innerText = indexEntry.title;
          // append the a element
          container.append(elem);
        }
        // go to next sub path
        return nextCrumbSubPath;
      });
      container.append(createPlaceholderSpan('article', document.title));
    });
}

/**
 * @param {HTMLElement} block
 */
export default async function ArticleMarquee(block) {
  loadCSS(`${window.hlx.codeBasePath}/scripts/toast/toast.css`);
  const [authorImg, authorName, authorTitle, readTime, headingType] = block.querySelectorAll(':scope div > div');

  let tagname = placeholders.articleMarqueeAdobeTag;
  let ArticleType = document.querySelector('meta[name="article-theme"]')?.getAttribute('content');
  if (!ArticleType) ArticleType = metadataProperties.adobe;
  if (ArticleType.toLowerCase() !== metadataProperties.adobe) {
    tagname = placeholders.articleMarqueeExternalTag;
  }
  const articleDetails = `<div class="article-marquee-info-container"><div class="article-info">
                                <div class="breadcrumb"></div>
                                <${headingType.textContent ? headingType.textContent : 'h1'}>${document.title}</${
                                  headingType.textContent ? headingType.textContent : 'h1'
                                }>
                                <div class="article-marquee-info"></div>
                            </div>
                            <div class="author-info">
                            ${authorImg.outerHTML} 
                            <div>${authorName.textContent.trim()}</div> 
                            ${authorTitle.outerHTML}
                            <div class="article-marquee-tag">${tagname}</div>
                            </div></div>
                            <div class="article-marquee-bg ${ArticleType}"></div>
                            `;
  block.innerHTML = articleDetails;
  const infoContainer = block.querySelector('.article-marquee-info');
  await createOptions(infoContainer, readTime.textContent.trim());

  const breadcrumbContainer = block.querySelector('.breadcrumb');
  createBreadcrumb(breadcrumbContainer);
  decorateIcons(block);
}
