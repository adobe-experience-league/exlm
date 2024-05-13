import {
  getEDSLink,
  getLink,
  getPathDetails,
  createPlaceholderSpan,
  fetchLanguagePlaceholders,
  fetchAuthorBio,
} from '../../scripts/scripts.js';
import { tooltipTemplate } from '../../scripts/toast/toast.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { createOptimizedPicture, decorateIcons, getMetadata, loadCSS } from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import loadJWT from '../../scripts/auth/jwt.js';
import renderBookmark from '../../scripts/bookmark/bookmark.js';
import attachCopyLink from '../../scripts/copy-link/copy-link.js';

const metadataProperties = {
  adobe: 'adobe',
  external: 'external',
};

const mobileSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1003.8 2167.2" class="article-marquee-bg article-marquee-bg-mobile">
    <path d="M1002.1 269.1C969 236.1 791.2 44.9 501.8 46.9c-283 2-465.9 188-500.2 222.2.1 583.4-.1 1314.7 0 1898.1h1001l-.4-1898.1Z" style="stroke-width:0"/>
    <path d="M991 196.7C936.1 146.8 766.6 2.1 501.8 2.5c-256.6.4-437 151.4-492.5 198" style="fill:none;stroke:#000;stroke-dasharray:0 0 10.1 10.1;stroke-miterlimit:10;stroke-width:5px"/>
</svg>
`;

const tabletSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1998.2 1003.8" class="article-marquee-bg article-marquee-bg-tablet">
    <path d="M251.4 1.7C221 34.8 45.1 212.6 46.9 501.9c1.8 283 173 466 204.4 500.3 536.9-.1 1209.9.1 1746.8 0V1.2l-1746.7.5Z" style="stroke-width:0"/>
    <path d="M196.7 12.8C146.8 67.7 2.1 237.2 2.5 501.9c.4 256.7 151.4 437.1 198 492.6" style="fill:none;stroke:#000;stroke-dasharray:0 0 10.1 10.1;stroke-miterlimit:10;stroke-width:5px"/>
</svg>
`;

const desktopSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1990 1002.5" class="article-marquee-bg article-marquee-bg-desktop">
    <path d="M77.2.4C85.3 121.5 117.5 355.9 267 602c125.4 206.4 279.6 332.4 375 399h1348V0L77.2.4Z" style="stroke-width:0"/>
    <path d="M512.5 1000.5c-84-66.9-187.4-165.2-280-303-185.7-276.3-222-553.9-230-696" style="fill:none;stroke:#000;stroke-dasharray:0 0 10 10;stroke-miterlimit:10;stroke-width:5px"/>
</svg>
`;

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
    });
}

/**
 * @param {HTMLElement} block
 */
export default async function ArticleMarquee(block) {
  loadCSS(`${window.hlx.codeBasePath}/scripts/toast/toast.css`);
  const [readTime, headingType] = block.querySelectorAll(':scope div > div');
  let link = getMetadata('author-bio-page');
  if (
    link &&
    (document.documentElement.classList.contains('adobe-ue-edit') ||
      document.documentElement.classList.contains('adobe-ue-preview'))
  ) {
    link = `${link}.html`;
  }

  const articleDetails = `<div class="article-marquee-info-container"><div class="article-info">
                                <div class="breadcrumb"></div>
                                <${headingType.textContent ? headingType.textContent : 'h1'}>${document.title}</${
                                  headingType.textContent ? headingType.textContent : 'h1'
                                }>
                                <div class="article-marquee-info"></div>
                            </div>
                            <div class="author-info">
                            <div class="article-marquee-bg-container">
                              ${mobileSvg}
                              ${tabletSvg}
                              ${desktopSvg}
                            </div>
                            <div class="author-details">
                            </div>
                            </div></div>
                            <div class="article-marquee-large-bg"></div>
                            `;
  block.innerHTML = articleDetails;
  const infoContainer = block.querySelector('.article-marquee-info');
  await createOptions(infoContainer, readTime.textContent.trim());

  const breadcrumbContainer = block.querySelector('.breadcrumb');
  createBreadcrumb(breadcrumbContainer);
  decorateIcons(block);

  if (link) {
    fetchAuthorBio(link).then((authorInfo) => {
      const authorInfoContainer = block.querySelector('.author-details');
      let tagname = placeholders.articleAdobeTag;
      let articleType = authorInfo?.authorCompany?.toLowerCase();
      if (!articleType) articleType = metadataProperties.adobe;
      if (articleType !== metadataProperties.adobe) {
        tagname = placeholders.articleExternalTag;
      }
      authorInfoContainer.outerHTML = `
        <div>${createOptimizedPicture(authorInfo?.authorImage).outerHTML}</div>
        <div>${authorInfo?.authorName}</div> 
        <div>${authorInfo?.authorTitle}</div>
        <div class="article-marquee-tag">${tagname}</div>
      `;

      block.querySelector('.article-marquee-large-bg').classList.add(articleType);
      block.querySelector('.article-marquee-bg-container').classList.add(articleType);
    });
  }
}
