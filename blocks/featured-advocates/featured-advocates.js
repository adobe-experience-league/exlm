import ffetch from '../../scripts/ffetch.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { getPathDetails } from '../../scripts/scripts.js';
import { buildAdvocatePanel } from '../advocate-bio/advocate-bio.js';
import { fetchAdvocateInfo, isAdvocateComplete } from '../../scripts/utils/advocate-utils.js';

const MAX_ADVOCATES = 18;
const ROTATION_KEY = 'featured-advocates-seen';

/**
 * Returns the ordered list of advocate paths for this page load.
 * Champions appear in a random order; a Champion is not repeated until every
 * Champion has been surfaced, tracked across page loads via sessionStorage.
 * @param {string[]} paths all available champion page paths
 */
function rotateOrder(paths) {
  let seen = [];
  try {
    seen = JSON.parse(sessionStorage.getItem(ROTATION_KEY)) || [];
  } catch {
    seen = [];
  }
  // Drop anything no longer available, and reset once the full list is exhausted.
  seen = seen.filter((p) => paths.includes(p));
  if (seen.length >= paths.length) seen = [];

  const unseen = paths.filter((p) => !seen.includes(p));
  const pool = unseen.length ? unseen : paths;
  const start = pool[Math.floor(Math.random() * pool.length)];

  try {
    sessionStorage.setItem(ROTATION_KEY, JSON.stringify([...seen, start]));
  } catch {
    // sessionStorage unavailable — rotation is best-effort only.
  }

  const startIndex = paths.indexOf(start);
  return [...paths.slice(startIndex), ...paths.slice(0, startIndex)];
}

function buildControls(total) {
  const controls = document.createElement('div');
  controls.classList.add('featured-advocates-controls');
  controls.innerHTML = `
    <button class="featured-advocates-nav featured-advocates-prev" type="button" aria-label="Previous advocate">
      <span class="icon icon-back-arrow"></span>
    </button>
    <div class="featured-advocates-dots" role="tablist" aria-label="Featured advocates"></div>
    <button class="featured-advocates-nav featured-advocates-next" type="button" aria-label="Next advocate">
      <span class="icon icon-front-arrow"></span>
    </button>
  `;
  const dots = controls.querySelector('.featured-advocates-dots');
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.classList.add('featured-advocates-dot');
    dot.dataset.index = i;
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Advocate ${i + 1} of ${total}`);
    dots.append(dot);
  }
  return controls;
}

export default async function decorate(block) {
  const [headingRow] = [...block.children];
  const heading = headingRow?.querySelector('h1,h2,h3,h4,h5,h6') ?? null;

  const { lang } = getPathDetails();
  const championRoot = `/${lang}/champions/`;
  let entries = [];
  try {
    entries = await ffetch(`/${lang}/query-index.json`).all();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error loading query index:', err);
  }

  // Champion pages are the sub-pages beneath the main Champions page.
  const paths = entries
    .map((entry) => entry.path)
    .filter((path) => path && path.startsWith(championRoot) && path !== championRoot.slice(0, -1));

  // Fetch and parse each Champion page, then apply the acceptance-criteria filter.
  const advocates = (await Promise.all(paths.map((path) => fetchAdvocateInfo(path))))
    .map((info, i) => ({ info, path: paths[i] }))
    .filter(({ info }) => isAdvocateComplete(info))
    .slice(0, MAX_ADVOCATES);

  block.textContent = '';

  if (heading) {
    const headingWrapper = document.createElement('div');
    headingWrapper.classList.add('featured-advocates-heading');
    headingWrapper.append(heading);
    block.append(headingWrapper);
  }

  if (!advocates.length) {
    block.classList.add('featured-advocates-empty');
    return;
  }

  const order = rotateOrder(advocates.map((a) => a.path));
  const ordered = order.map((path) => advocates.find((a) => a.path === path)).filter(Boolean);

  const track = document.createElement('div');
  track.classList.add('featured-advocates-track');
  ordered.forEach((advocate, i) => {
    const slide = document.createElement('div');
    slide.classList.add('featured-advocates-slide');
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${ordered.length}`);
    if (i !== 0) slide.setAttribute('aria-hidden', 'true');
    slide.append(buildAdvocatePanel(advocate.info));
    track.append(slide);
  });
  block.append(track);

  if (ordered.length <= 1) return;

  const controls = buildControls(ordered.length);
  block.append(controls);
  decorateIcons(controls);

  const slides = [...track.children];
  const dots = [...controls.querySelectorAll('.featured-advocates-dot')];
  let current = 0;

  const goTo = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('selected', i === current);
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
  };

  controls.querySelector('.featured-advocates-prev').addEventListener('click', () => goTo(current - 1));
  controls.querySelector('.featured-advocates-next').addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot) => dot.addEventListener('click', () => goTo(Number(dot.dataset.index))));

  slides[0].classList.add('active');
  goTo(0);
}
