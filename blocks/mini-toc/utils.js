export function setLevels(val = 2) {
  const selectors = [];

  if (val > 6) {
    // eslint-disable-next-line no-param-reassign
    val = 6;
  }

  for (let i = val; i >= 1; i -= 1) {
    selectors.push(`h${i + 1}:not(#lists-documentation)`);
  }

  return selectors.join(',');
}

export function highlight(replace = false) {
  const render = window.requestAnimationFrame;
  const ctx = document.querySelector('.mini-toc');
  const levels = document.querySelector('meta[name="mini-toc-levels"]');
  const mtocScroll = ctx.querySelectorAll('a').length > 10;

  if (ctx !== null) {
    const top = window.scrollY;
    const headers = Array.from(
      document
        .querySelector('main')
        .querySelectorAll(
          setLevels(levels !== null && parseInt(levels.content, 10) > 0 ? parseInt(levels.content, 10) : undefined),
        ),
    ).filter((i) => i.id.length > 0);
    const anchors = Array.from(ctx.querySelectorAll('a'));
    let el;

    // eslint-disable-next-line no-restricted-syntax
    for (const [idx, i] of headers.entries()) {
      if (parseInt(i.offsetTop, 10) + parseInt(i.offsetHeight, 10) >= top) {
        el = anchors[idx];
        break;
      }
    }

    if (el !== undefined) {
      render(() => {
        ctx.querySelectorAll('a.is-active').forEach((i) => i.classList.remove('is-active'));
        el.classList.add('is-active');

        const scrollOptions = {
          top: el.offsetTop - ctx.offsetTop,
          behavior: 'smooth',
        };

        if (mtocScroll) {
          ctx.scroll(scrollOptions);
        }

        const scrollableDivBlock = ctx.querySelector('.scrollable-div');
        const anchorTopPos = el.offsetTop;
        el.classList.add('is-active');
        scrollableDivBlock.scrollTop = anchorTopPos - 30;

        if (replace) {
          window.history.replaceState({}, '', el.href);
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
