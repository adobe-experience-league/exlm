import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, getPathDetails } from '../../scripts/scripts.js';

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
  const courseDescription = rows[1]?.querySelector('div')?.innerHTML || '';

  const courseName = getMetadata('og:title') || document.title;

  const productName = getMetadata('coveo-solution') || '';
  const experienceLevel = getMetadata('level') || '';

  block.textContent = '';

  const breadcrumb = document.createElement('div');
  breadcrumb.classList.add('course-marquee-breadcrumb');

  const coursesLink = document.createElement('a');
  coursesLink.textContent = placeholders.coursesLabel || 'Courses';
  coursesLink.href = `/${lang}/learning-collections`;

  const courseNameSpan = document.createElement('span');
  courseNameSpan.textContent = courseName;

  breadcrumb.appendChild(coursesLink);
  breadcrumb.appendChild(courseNameSpan);

  const mainContent = document.createElement('div');
  mainContent.classList.add('course-marquee-content');

  const title = document.createElement('h1');
  title.classList.add('course-marquee-title');
  title.textContent = courseTitle;

  const description = document.createElement('div');
  description.classList.add('course-marquee-description');
  description.innerHTML = courseDescription;

  const separator = document.createElement('hr');
  separator.classList.add('course-marquee-separator');

  const metadata = document.createElement('div');
  metadata.classList.add('course-metadata-bookmark');

  const metadataContainer = document.createElement('div');
  metadataContainer.classList.add('course-marquee-metadata');

  // add productName item only if available
  if (productName) {
    const productItem = document.createElement('div');
    productItem.classList.add('metadata-item');
    productItem.innerHTML = `
    <span class="metadata-label">${placeholders.courseProductLabel || 'Product'}:</span>
    <span class="metadata-value">${productName}</span>
  `;
    metadataContainer.appendChild(productItem);
  }

  // add separator only if both values are present
  if (productName && experienceLevel) {
    const metadataSeparator = document.createElement('div');
    metadataSeparator.classList.add('metadata-separator');
    metadataContainer.appendChild(metadataSeparator);
  }

  // add experienceLevel item only if available
  if (experienceLevel) {
    const expItem = document.createElement('div');
    expItem.classList.add('metadata-item');
    expItem.innerHTML = `
    <span class="metadata-label">${placeholders.courseExperienceLevelLabel || 'Experience level'}:</span>
    <span class="metadata-value">${experienceLevel}</span>
  `;
    metadataContainer.appendChild(expItem);
  }

  metadata.appendChild(metadataContainer);

  const bookmarkContainer = document.createElement('div');
  bookmarkContainer.classList.add('course-marquee-bookmark');

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
          label: placeholders.bookmarkThisCourse || 'Bookmark this Course',
          icons: ['bookmark-white', 'bookmark-active'],
        },
        copyConfig: false,
      });
      cardAction.decorate();
    }
  });

  metadata.appendChild(bookmarkContainer);

  block.appendChild(breadcrumb);
  block.appendChild(mainContent);

  mainContent.appendChild(title);
  mainContent.appendChild(description);
  mainContent.appendChild(separator);
  mainContent.appendChild(metadata);

  decorateIcons(block);
}
