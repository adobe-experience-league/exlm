import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, getPathDetails, htmlToElement } from '../../scripts/scripts.js';

function getPreferredMetadata(tqMetaKey, locLegacyMetaKey, legacyMetaKey) {
  return getMetadata(tqMetaKey) || getMetadata(locLegacyMetaKey) || getMetadata(legacyMetaKey);
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const { lang = 'en' } = getPathDetails() || {};

  const [firstRow, secondRow] = block.children;
  // Get the HTML content of the first row as a string
  const courseTitleEl = firstRow?.querySelector('h1, h2, h3, h4, h5, h6');
  const courseTitleHTML = courseTitleEl
    ? (() => {
        courseTitleEl.classList.add('course-marquee-title');
        return courseTitleEl.outerHTML;
      })()
    : '';
  // Course description is now in the second row
  const courseDescription = secondRow?.querySelector('div')?.innerHTML || '';

  const courseName = getMetadata('og:title') || document.title;

  const coveosolutions = getMetadata('coveo-solution');
  const productName =
    [
      ...new Set(
        coveosolutions.split(';').map((item) => {
          const parts = item.split('|');
          return parts.length > 1 ? parts[1].trim() : item.trim();
        }),
      ),
    ].join(', ') || getMetadata('tq-products-labels');
  const experienceLevel = getPreferredMetadata('loc-level', 'level', 'tq-levels-labels')
    .split(',')
    .map((item) => item.trim())
    .join(', ');
  const role = getMetadata('role') || '';
  const solution = getMetadata('solution') || '';
  const courseLink = getMetadata('og:url') || window.location.href;

  const [, courseIdFromLink] = courseLink?.split(`/${lang}/`) || [];
  const trackingInfo = {
    destinationDomain: courseLink,
    course: {
      id: courseIdFromLink,
      title: courseName,
      solution: solution.split(',')[0].trim() || '',
      fullSolution: solution || '',
      role,
    },
  };
  block.textContent = '';

  // Create metadata items HTML
  let metadataItemsHTML = '';

  if (productName) {
    metadataItemsHTML += `
      <div class="metadata-item">
        <span class="metadata-label">${placeholders?.courseProductLabel || 'Product'}:</span>
        <span class="metadata-value">${productName}</span>
      </div>
    `;
  }

  if (productName && experienceLevel) {
    metadataItemsHTML += `<div class="metadata-separator"></div>`;
  }

  if (experienceLevel) {
    metadataItemsHTML += `
      <div class="metadata-item">
        <span class="metadata-label">${placeholders?.courseExperienceLevelLabel || 'Experience level'}:</span>
        <span class="metadata-value">${experienceLevel}</span>
      </div>
    `;
  }

  // Generate complete HTML structure
  const courseMarqueeHTML = htmlToElement(`
    <div>
      <div class="course-marquee-breadcrumb">
        <a href="/${lang}/courses">${placeholders?.coursesLabel || 'Courses'}</a>
        <span>${courseName}</span>
      </div>
      <div class="course-marquee-content">
        ${courseTitleHTML}
        <div class="course-marquee-description">${courseDescription}</div>
        <hr class="course-marquee-separator">
        <div class="course-metadata-bookmark">
          <div class="course-marquee-metadata">
            ${metadataItemsHTML}
          </div>
          <div class="course-marquee-bookmark"></div>
        </div>
      </div>
    </div>
  `);

  // Add the generated HTML to the block
  block.appendChild(courseMarqueeHTML);

  // Get bookmark container for UserActions
  const bookmarkContainer = block.querySelector('.course-marquee-bookmark');

  // Add UserActions for bookmark functionality
  import('../../scripts/user-actions/user-actions.js').then(({ default: UserActions }) => {
    if (UserActions) {
      const { pathname } = window.location;
      const cardAction = UserActions({
        container: bookmarkContainer,
        id: pathname,
        bookmarkPath: pathname,
        link: window.location.href,
        bookmarkConfig: {
          label: placeholders?.bookmarkThisCourse || 'Bookmark this Course',
          icons: ['bookmark-new', 'bookmark-active'],
        },
        copyConfig: false,
        trackingInfo,
      });
      cardAction.decorate();
    }
  });

  decorateIcons(block);
}
