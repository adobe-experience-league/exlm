import { matchesAnyTheme } from '../../scripts/scripts.js';

export function setLevels(val = 2) {
  const selectors = [];

  if (val > 6) {
    // eslint-disable-next-line no-param-reassign
    val = 6;
  }

  for (let i = val; i >= 1; i -= 1) {
    if (matchesAnyTheme(/docs-solution-landing/) && i + 1 >= 3) {
      // eslint-disable-next-line no-continue
      continue; // Skip levels h3, h4, h5, h6 on docs-solution-landing pages
    }
    selectors.push(`h${i + 1}:not(#lists-documentation)`);
  }

  return selectors.join(',');
}

export function highlight(replace = false, isAnchorScroll = false) {
  const render = window.requestAnimationFrame;
  const ctx = document.querySelector('.mini-toc');
  const levels = document.querySelector('meta[name="mini-toc-levels"]');
  const mtocScroll = ctx.querySelectorAll('a').length > 10;

  if (ctx !== null) {
    const headers = Array.from(
      document
        .querySelector('main')
        .querySelectorAll(
          setLevels(levels !== null && parseInt(levels.content, 10) > 0 ? parseInt(levels.content, 10) : undefined),
        ),
    ).filter((i) => i.id.length > 0);
    let anchorElement;
    // eslint-disable-next-line no-restricted-syntax
    for (const elem of headers) {
      const rect = elem.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top <= viewportHeight * 0.2) {
        anchorElement = ctx.querySelector(`[href="#${elem.id}"]`);
      }
    }

    if (anchorElement !== undefined && !isAnchorScroll) {
      render(() => {
        const currentActiveElements = ctx.querySelectorAll('li.is-active');
        const [currentActiveElement] = currentActiveElements.length > 0 ? currentActiveElements : [null];

        currentActiveElements.forEach((i) => i.classList.remove('is-active'));

        const activeElement = anchorElement.parentElement;
        activeElement.classList.add('is-active');

        if (currentActiveElement !== activeElement) {
          // Remove adjacent class from all elements
          ctx.querySelectorAll('li.is-adjacent-prev').forEach((i) => i.classList.remove('is-adjacent-prev'));
          if (activeElement.previousElementSibling) {
            activeElement.previousElementSibling.classList.add('is-adjacent-prev');
          }
        }

        const scrollOptions = {
          top: anchorElement.offsetTop - ctx.offsetTop,
          behavior: 'smooth',
        };

        if (mtocScroll) {
          ctx.scroll(scrollOptions);
        }

        const scrollableDivBlock = ctx.querySelector('.scrollable-div');

        const anchorTopPos = anchorElement.offsetTop;
        anchorElement.parentElement.classList.add('is-active');
        scrollableDivBlock.scrollTop = anchorTopPos - 30;

        if (replace) {
          window.history.replaceState({}, '', anchorElement.href);
        }
      });
    }
  }
}

export function hashFragment(arg = '') {
  const url = new URL(window.location.href);
  const lhash = arg.replace(/^#/, '');

  url.hash = lhash.length > 0 ? lhash : arg;
  window.history.replaceState({}, '', url.href);
}
