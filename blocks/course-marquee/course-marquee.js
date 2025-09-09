import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, getPathDetails, htmlToElement } from '../../scripts/scripts.js';

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const { lang = 'en' } = getPathDetails() || {};

  const rows = [...block.children];
  const courseTitle = rows[0]?.querySelector('div')?.textContent || '';
  const titleHeadingType = rows[1]?.querySelector('div')?.textContent || 'h1';
  const courseDescription = rows[2]?.querySelector('div')?.innerHTML || '';

  const courseName = getMetadata('og:title') || document.title;

  const productName = getMetadata('coveo-solution') || '';
  const experienceLevel = getMetadata('level') || '';

  // Function to create HTML for multiple values with proper spacing
  const createMultiValueHTML = (values) => {
    if (!values) return '';

    // Split by semicolons or commas, trim each value, and remove duplicates
    const uniqueValues = [
      ...new Set(
        values
          .split(/[;,]/)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];

    return uniqueValues.map((value) => `<span class="metadata-value-item">${value}</span>`).join('');
  };

  block.textContent = '';

  // Create metadata items HTML
  let metadataItemsHTML = '';
  if (productName) {
    metadataItemsHTML += `
      <div class="metadata-item">
        <span class="metadata-label">${placeholders?.courseProductLabel || 'Product'}:</span>
        <div class="metadata-value">${createMultiValueHTML(productName)}</div>
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
        <div class="metadata-value">${createMultiValueHTML(experienceLevel)}</div>
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
        <${titleHeadingType} class="course-marquee-title">${courseTitle}</${titleHeadingType}>
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
          icons: ['bookmark-white', 'bookmark-active'],
        },
        copyConfig: false,
      });
      cardAction.decorate();
    }
  });

  decorateIcons(block);
}
