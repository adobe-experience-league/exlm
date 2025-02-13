import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { getPathDetails, htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
const { lang } = getPathDetails();
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const awardsPage = '/home/awards';
const navPage = `${lang}/home/nav`;
const profileSettingsPage = `/${lang}/home/profile-settings`;
const navURL = `${window.location.origin}/${navPage}`;

const isSignedIn = await isSignedInUser();
let awards = false;
if (isSignedIn) {
  const profileData = await defaultProfileClient.getMergedProfile();
  const skills = profileData?.skills;
  const awardedSkills = skills.filter((skill) => skill.award === true);
  if (awardedSkills.length) {
    awards = true;
  }
}

async function fetchNavContent() {
  try {
    const response = await fetch(`${navURL}.plain.html`);
    if (response.ok) {
      const pageContent = await response.text();
      return pageContent;
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.log(err);
  }
  return '';
}

function getHeadings() {
  const headings = Array.from(
    document.querySelectorAll('.recommendation-marquee-header, .recommended-content-header, .recently-reviewed-header'),
  ).filter((heading) => heading.textContent.trim());
  return headings;
}

function formatId(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default async function ProfileRail(block) {
  const content = await fetchNavContent();
  if (content) {
    block.innerHTML = content;
  } else {
    throw new Error(`Failed to fetch content from ${navURL}`);
  }

  block.querySelectorAll('.profile-rail > div > *').forEach((navItem) => {
    if (navItem.tagName === 'UL') {
      navItem.classList.add('profile-rail-links');
    } else {
      navItem.classList.add('profile-rail-heading');
    }
  });

  block.querySelectorAll('.profile-rail-links > li').forEach((navLink) => {
    // In case of no awards for the profile
    if (!awards && !UEAuthorMode) {
      // remove the Awards link from left rail
      const awardsLink = navLink.querySelector(`a[href*="${awardsPage}"]`);
      if (awardsLink) {
        navLink.remove();
      }
      // redirect awards page to profile-settings page
      if (window.location.pathname === `/${lang}${awardsPage}`) {
        window.location.pathname = `${profileSettingsPage}`;
      }
    }
    const link = navLink.querySelector('a');
    const icon = navLink.querySelector('span.icon');
    if (link && icon) link.prepend(icon);
    if (link?.href.includes('#_blank')) {
      link.href = link.href.replace('#_blank', '');
      link.setAttribute('target', '_blank');
    }
    if (link && link.href === `${window.location.origin}${window.location.pathname}`) {
      link.href = '#';
      link.classList.add('active');
      link.appendChild(htmlToElement('<span class="icon icon-chevron-down"></span>'));
    }
  });

  const inActiveLinks = block.querySelectorAll('.profile-rail-links > li > a:not(.active)');
  const profileRailOverlay = document.createElement('div');
  profileRailOverlay.classList.add('profile-rail-overlay', 'hidden');
  inActiveLinks.forEach((link) => {
    profileRailOverlay.appendChild(link.cloneNode(true));
  });
  block.append(profileRailOverlay);

  document.addEventListener('click', (event) => {
    if (event.target.closest('.profile-rail-links > li > a.active')) {
      if (!window.matchMedia('(min-width: 1024)').matches) {
        event.preventDefault();
        event.target.classList.toggle('overlay-active');
        profileRailOverlay.classList.toggle('hidden');
      }
    } else {
      profileRailOverlay.classList.add('hidden');
      block.querySelector('.profile-rail-links > li > a.active')?.classList.remove('overlay-active');
    }
  });

  const firstUl = block.querySelector('ul');

  const heading = document.createElement('p');
  heading.classList.add('profile-rail-heading', 'hidden');
  heading.textContent = `${placeholders?.jumpToSection || 'Jump to section'}`;
  firstUl.insertAdjacentElement('afterend', heading);

  const newUl = document.createElement('ul');
  newUl.classList.add('profile-rail-links', 'hidden');
  heading.insertAdjacentElement('afterend', newUl);

  function updateList() {
    newUl.innerHTML = '';

    const headings = getHeadings();
    const hasHeadings = headings.length > 0;
    heading.classList.toggle('hidden', !hasHeadings);
    newUl.classList.toggle('hidden', !hasHeadings);
    if (!hasHeadings) return;

    headings.forEach((h) => {
      const sectionId = formatId(h.textContent.trim());
      if (!h.id) {
        h.id = sectionId;
      }
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.textContent = h.textContent.trim();
      a.href = `#${h.getAttribute('id')}`;
      li.appendChild(a);
      newUl.appendChild(li);
    });

    const navLinks = Array.from(newUl.querySelectorAll('a'));

    function windowLinkActive() {
      const anySectionActive = [...navLinks].some((link) => link.classList.contains('active'));
      const pageNavLink = [...document.querySelectorAll('.profile-rail-links a')].find(
        (link) => link.href.split('#')[0] === window.location.href.split('#')[0],
      );
      pageNavLink?.classList.toggle('active', !anySectionActive);
    }

    function clearActiveLinks() {
      navLinks.forEach((link) => link.classList.remove('active'));
      windowLinkActive();
    }

    function updateActiveLink(targetId) {
      clearActiveLinks();
      const activeLink = [...navLinks].find((link) => link.getAttribute('href') === `#${targetId}`);
      if (activeLink) activeLink.classList.add('active');
      windowLinkActive();
    }

    function scrollToElement(targetId) {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const yOffset = -100;
        const y = targetElement.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        updateActiveLink(targetId);
      }
    }

    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        scrollToElement(targetId);
        window.history.replaceState(null, null, `#${targetId}`);
      });
    });

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -80% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      let mostVisibleSection = null;
      let maxIntersectionRatio = 0;

      entries.forEach((entry) => {
        const firstDivChild = entry.target.querySelector('div');
        if (!firstDivChild) return;

        const id = firstDivChild.getAttribute('id');

        if (entry.isIntersecting) {
          if (entry.intersectionRatio > maxIntersectionRatio) {
            mostVisibleSection = id;
            maxIntersectionRatio = entry.intersectionRatio;
          }
        }
      });

      if (mostVisibleSection) {
        updateActiveLink(mostVisibleSection);
      } else {
        clearActiveLinks();
      }
    }, observerOptions);

    headings.forEach((el) => {
      const parentSection = el.parentElement;
      if (parentSection) {
        observer.observe(parentSection);
      }
    });

    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      scrollToElement(targetId);
    }
  }

  updateList();

  const observerConfig = { childList: true, subtree: true, characterData: true };

  const mutationObserver = new MutationObserver(() => {
    updateList();
  });

  document
    .querySelectorAll('.recommendation-marquee-header, .recommended-content-header, .recently-reviewed-header')
    .forEach((el) => mutationObserver.observe(el, observerConfig));

  decorateIcons(block);
}
