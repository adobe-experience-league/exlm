// eslint-disable-next-line import/no-cycle
import { debounce, fetchLanguagePlaceholders, isArticlePage } from '../scripts.js';
import { highlight, setLevels, hashFragment } from './utils.js';
import Dropdown, { DROPDOWN_VARIANTS } from '../dropdown/dropdown.js';
import { decorateIcons } from '../lib-franklin.js';

function setPadding(arg = '') {
  const num = parseInt(arg.split('')[1], 10);
  const indent = '-big';

  return num >= 3 ? `is-padded-left${indent.repeat(num - 2)}` : '';
}

function headerExclusions(header) {
  return (
    header.id.length > 0 &&
    !header.classList.contains('no-mtoc') &&
    !header.closest('details') &&
    !header.closest('sp-tabs')
  );
}

export default async function decorate() {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }
  const miniTOCHeading = placeholders?.onThisPage;
  const render = window.requestAnimationFrame;
  const ctx = document.querySelector('.mini-toc');
  const levels = document.querySelector('meta[name="mini-toc-levels"]');

  if (ctx !== null) {
    const miniTocSectionEl = isArticlePage() ? '.article-content-section' : 'main';
    const headingLevels = setLevels(
      levels !== null && parseInt(levels.content, 10) > 0 ? parseInt(levels.content, 10) : undefined,
    );
    const selectorQuery = headingLevels
      .split(',')
      .map((query) => `${miniTocSectionEl} ${query}`)
      .join(',');
    const headers = Array.from(document.querySelectorAll(selectorQuery)).filter(headerExclusions);

    if (headers.length > 1) {
      const html = headers.map(
        (i) => `<li><a href="#${i.id}" class="${setPadding(i.nodeName)}">${i.innerText}</a></li>`,
      );
      // eslint-disable-next-line no-restricted-globals
      const url = new URL(location.href);
      const lhash = url.hash.length > 0;

      render(() => {
        const tocHeadingDivNode = `<div><h2>${miniTOCHeading}</h2></div>`;
        ctx.innerHTML = `${tocHeadingDivNode}\n<div class='scrollable-div'><ul>${html.join('\n')}</ul></div>`;

        let lactive = false;

        const anchors = Array.from(ctx.querySelectorAll('a'));
        const anchorTexts = anchors.map((anchor) => {
          const content = anchor.textContent;
          return {
            id: content,
            value: anchor.href,
            title: content,
          };
        });
        // eslint-disable-next-line no-new
        new Dropdown(ctx, 'Summary', anchorTexts, DROPDOWN_VARIANTS.MINI_TOC); // Initialise mini-toc dropdown for mobile view

        window.addEventListener('hashchange', () => {
          const { hash } = window.location;
          const matchFound = anchorTexts.find((a) => {
            const [, linkHash] = a.value.split('#');
            return `#${linkHash}` === hash;
          });
          if (matchFound) {
            Dropdown.closeAllDropdowns();
          }
        });

        if (anchors.length > 0) {
          anchors.forEach((i, idx) => {
            if (lhash === false && idx === 0) {
              i.classList.add('is-active');
              lactive = true;
            } else if (lhash && i.hash === url.hash) {
              i.classList.add('is-active');
              lactive = true;
            }

            i.addEventListener(
              'click',
              () => {
                const ahash = (i.href.length > 0 ? new URL(i.href).hash || '' : '').replace(/^#/, '');
                let activeAnchor = i;
                if (
                  !i.classList.contains('is-padded-left-big') &&
                  i.parentElement?.nextElementSibling?.firstElementChild?.classList?.contains('is-padded-left-big')
                ) {
                  activeAnchor = i.parentElement.nextElementSibling.firstChild;
                }
                render(() => {
                  anchors.forEach((a) => a.classList.remove('is-active'));
                  activeAnchor.classList.add('is-active');

                  if (ahash.length > 0) {
                    hashFragment(ahash);
                  }
                });
              },
              false,
            );

            if (lactive === false) {
              highlight(false);
            }
          });

          const anchor = anchors[0].parentElement;
          const scrollableDiv = ctx.querySelector('.scrollable-div');
          if (scrollableDiv) {
            // dynamically make sure no item is partially visible
            const anchorClientHeight = anchor.offsetHeight;
            const anchorStyles = getComputedStyle(anchor);
            const marginTop = parseInt(anchorStyles.marginTop || '0', 10);
            const marginBottom = parseInt(anchorStyles.marginBottom || '0', 10);
            const anchorHeight = anchorClientHeight + marginTop + marginBottom;
            const halfWindowHeight = window.innerHeight / 2;
            const visibleAnchorsCount = Math.floor(halfWindowHeight / anchorHeight);
            if (visibleAnchorsCount && anchors.length > visibleAnchorsCount) {
              // scrollableDiv.style.maxHeight = `${visibleAnchorsCount * anchorHeight}px`;
            }
          }
          window.addEventListener('scroll', () => debounce('scroll', () => highlight(), 16));
          decorateIcons(ctx);
        }
      });
    } else {
      render(() => {
        ctx.parentElement.parentElement.classList.add('is-hidden');
      });
    }
  }
}
