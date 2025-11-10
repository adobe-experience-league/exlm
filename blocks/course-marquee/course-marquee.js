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
    ].join(',') || getMetadata('tq-products-labels');
  const experienceLevel = getPreferredMetadata('loc-level', 'level', 'tq-levels-labels');
  const role = getMetadata('role') || '';
  const solution = getMetadata('solution') || '';
  const courseLink = getMetadata('og:url') || window.location.href;

  // Function to create HTML for multiple values with proper spacing
  const createMultiValueHTML = (values) => {
    if (!values) return { html: '', isMulti: false };

    // Split by semicolons or commas, trim each value, and remove duplicates
    const uniqueValues = [
      ...new Set(
        values
          .split(/[;,]/)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];

    const isMulti = uniqueValues.length > 1;
    const html = uniqueValues.map((value) => `<span class="metadata-value-item">${value}</span>`).join('');

    return { html, isMulti };
  };
  const [, courseIdFromLink] = courseLink?.split(`/${lang}/`) || [];
  const bookmarkTrackingInfo = {
    destinationDomain: courseLink,
    course: {
      id: courseIdFromLink,
      title: courseName,
      solution: solution.split(',').filter(Boolean),
      role,
    },
  };
  block.textContent = '';

  // Create metadata items HTML
  let metadataItemsHTML = '';

  // Process product name
  let isMultiProduct = false;
  let productHTML = '';
  if (productName) {
    const result = createMultiValueHTML(productName);
    productHTML = result.html;
    isMultiProduct = result.isMulti;

    metadataItemsHTML += `
      <div class="metadata-item">
        <span class="metadata-label">${placeholders?.courseProductLabel || 'Product'}:</span>
        <div class="metadata-value">${productHTML}</div>
      </div>
    `;
  }

  if (productName && experienceLevel) {
    metadataItemsHTML += `<div class="metadata-separator"></div>`;
  }

  // Process experience level
  let isMultiExperience = false;
  let experienceHTML = '';
  if (experienceLevel) {
    const result = createMultiValueHTML(experienceLevel);
    experienceHTML = result.html;
    isMultiExperience = result.isMulti;

    metadataItemsHTML += `
      <div class="metadata-item">
        <span class="metadata-label">${placeholders?.courseExperienceLevelLabel || 'Experience level'}:</span>
        <div class="metadata-value">${experienceHTML}</div>
      </div>
    `;
  }

  // Determine if we have multi values in either product or experience
  const hasMultiValues = isMultiProduct || isMultiExperience;

  // Add the multi class to the metadata container if there are multi values
  const metadataClass = hasMultiValues ? 'course-marquee-metadata multi' : 'course-marquee-metadata';

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
          <div class="${metadataClass}">
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
  window.addEventListener('delayed-load', async () => {
    const { default: UserActions } = await import('../../scripts/user-actions/user-actions.js');
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
        bookmarkTrackingInfo,
      });
      cardAction.decorate();
    }
  });

  decorateIcons(block);
}
