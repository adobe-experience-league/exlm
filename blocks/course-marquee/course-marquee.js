import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const rows = [...block.children];
  const courseTitle = rows[0]?.querySelector('div')?.textContent || '';
  const courseDescription = rows[1]?.querySelector('div')?.textContent || '';

  const courseName = getMetadata('og:title') || document.title;

  const productName = getMetadata('coveo-solution') || 'Product name';
  const experienceLevel = getMetadata('level') || 'Experience level';

  block.textContent = '';

  const breadcrumb = document.createElement('div');
  breadcrumb.classList.add('course-marquee-breadcrumb');

  const coursesLink = document.createElement('a');
  coursesLink.textContent = placeholders.coursesLabel || 'Courses';
  coursesLink.href = '/en/learning-collections';

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
  description.textContent = courseDescription;

  const separator = document.createElement('hr');
  separator.classList.add('course-marquee-separator');

  const metadata = document.createElement('div');
  metadata.classList.add('course-metadata-bookmark');

  const metadataHTML = `
    <div class="course-marquee-metadata">
      <div class="metadata-item">
        <span class="metadata-label">${placeholders.courseProductLabel || 'Product'}:</span>
        <span class="metadata-value">${productName}</span>
      </div>
      <div class="metadata-separator"></div>
      <div class="metadata-item">
        <span class="metadata-label">${placeholders.courseExperienceLevelLabel || 'Experience level'}:</span>
        <span class="metadata-value">${experienceLevel}</span>
      </div>
    </div>
  `;
  metadata.innerHTML = metadataHTML;

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
