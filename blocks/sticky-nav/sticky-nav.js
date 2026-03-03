/**
 * Sticky Nav — desktop-only horizontal tab bar that sticks to the top of the viewport.
 * Authoring: col 1 = section ID, col 2 = label text.
 */

function ensureAncestorsVisible(startEl) {
  let el = startEl;
  while (el && el !== document.body) {
    if (el.style.display === 'none') el.style.removeProperty('display');
    if (el.style.visibility === 'hidden') el.style.removeProperty('visibility');
    el = el.parentElement;
  }
}

function setActiveLink(activeAnchor, block) {
  block.querySelectorAll('.sticky-nav-link').forEach((link) => link.classList.remove('active'));
  activeAnchor.classList.add('active');

  const navList = activeAnchor.closest('.sticky-nav-list');
  if (navList) {
    const { offsetLeft, offsetWidth } = activeAnchor.parentElement;
    navList.scrollTo({ left: offsetLeft - navList.offsetWidth / 2 + offsetWidth / 2, behavior: 'smooth' });
  }
}

function buildNavList(rows, block) {
  const navList = document.createElement('ul');
  navList.className = 'sticky-nav-list';

  [...rows].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    row.textContent = '';
    const sectionIdValue = cells[0].textContent.trim();
    const linkText = cells[1].textContent.trim();
    if (!linkText) return;

    const sectionId = sectionIdValue || linkText.toLowerCase().replace(/\s+/g, '-');

    const anchor = document.createElement('a');
    anchor.href = `#${sectionId}`;
    anchor.textContent = linkText;
    anchor.className = 'sticky-nav-link';
    anchor.dataset.sectionTarget = sectionId;

    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.querySelector(`[data-section-id="${sectionId}"]`);
      if (!target) return;
      const navHeight = block.closest('.section')?.offsetHeight ?? block.offsetHeight ?? 0;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navHeight, behavior: 'smooth' });
      setActiveLink(anchor, block);
    });

    const item = document.createElement('li');
    item.className = 'sticky-nav-item';
    item.appendChild(anchor);
    row.appendChild(item);
    navList.appendChild(row);
  });

  return navList;
}

function setupScrollSpy(block, sectionEl) {
  const navLinks = [...block.querySelectorAll('.sticky-nav-link[data-section-target]')];
  if (navLinks.length === 0) return;

  const navHeight = (sectionEl || block).offsetHeight;
  const sectionMap = new Map(
    navLinks
      .map((link) => [document.querySelector(`[data-section-id="${link.dataset.sectionTarget}"]`), link])
      .filter(([target]) => target !== null),
  );

  if (sectionMap.size === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const topmost = entries
        .filter((entry) => entry.isIntersecting)
        .sort((entryA, entryB) => entryA.boundingClientRect.top - entryB.boundingClientRect.top)[0];
      if (topmost) {
        const link = sectionMap.get(topmost.target);
        if (link) requestAnimationFrame(() => setActiveLink(link, block));
      }
    },
    { root: null, rootMargin: `-${navHeight}px 0px -50% 0px`, threshold: 0 },
  );

  sectionMap.forEach((_, target) => observer.observe(target));
}

export default function decorate(block) {
  ensureAncestorsVisible(block);
  const nav = document.createElement('div');
  nav.className = 'sticky-nav-container';
  nav.setAttribute('aria-label', 'Page sections');
  nav.setAttribute('role', 'navigation');
  nav.appendChild(buildNavList(block.children, block));

  block.appendChild(nav);

  const sectionEl = block.closest('.section');

  const firstLink = block.querySelector('.sticky-nav-link');
  if (firstLink) firstLink.classList.add('active');

  setupScrollSpy(block, sectionEl);
}
