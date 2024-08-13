import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/**
 * ProfileRail (Create a TOC using the headings in the page sections that highlights on scroll)
 * Autoblocked along with profile tab on the profile pages.
 * @param {HTMLElement} block
 */
export default function ProfileRail(block) {
  const sections = document.querySelectorAll('body.profile .section:not(.profile-tab-section, .profile-rail-section)');
  block.innerHTML = `<span>${placeholders?.myEXLProfile || 'My Experience League profile'}</span>`;
  const nav = document.createElement('ul');
  nav.classList.add('profile-rail-nav');
  sections.forEach((section, i) => {
    const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && heading.id) {
      const li = document.createElement('li');
      if (i === 0) {
        li.classList.add('active');
        li.innerHTML = `<a href="#my-bookmarks">${heading.textContent.toLowerCase()}</a>`;
      } else if (i === 1) {
        li.innerHTML = `<a href="#my-awards">${heading.textContent.toLowerCase()}</a>`;
      } else {
        li.innerHTML = `<a href="#${heading.id}">${heading.textContent.toLowerCase()}</a>`;
      }
      nav.appendChild(li);
    }
  });
  block.appendChild(nav);
  window.addEventListener('scroll', () => {
    const { scrollY } = window;
    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 50;

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        nav.querySelector('li.active')?.classList.remove('active');
        nav
          .querySelector(`a[href="#${current.querySelector('h1, h2, h3, h4, h5, h6').id}"]`)
          .parentElement.classList.add('active');
      }
    });
  });
}
