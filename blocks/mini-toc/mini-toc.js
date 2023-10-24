import { highlight, setLevels, hashFragment } from './utils.js';

function setPadding(arg = '') {
  const num = parseInt(arg.split('')[1], 10),
    indent = '-big';

  return num >= 3 ? `is-padded-left${indent.repeat(num - 2)}` : '';
}

function headerExclusions(header) {
  return header.id.length > 0 &&
    !header.classList.contains('no-mtoc') &&
    !header.closest('details') &&
    !header.closest('sp-tabs');
}

export default async function decorate(block) {
  const miniTOCHeading = 'ON THIS PAGE';
  const render = window.requestAnimationFrame;
  const ctx = document.querySelector('.mini-toc'),
    levels = document.querySelector('meta[name="mini-toc-levels"]');

  if (ctx !== null) {
    const headers = Array.from(document.querySelector('main').querySelectorAll(setLevels(levels !== null && parseInt(levels.content, 10) > 0 ? parseInt(levels.content, 10) : void 0)))
      .filter(headerExclusions);

    if (headers.length > 1) {
      const html = headers.map(i => `<li><a href="#${i.id}" class="${setPadding(i.nodeName)}">${i.innerText}</a></li>`),
        url = new URL(location.href),
        lhash = url.hash.length > 0;

      render(() => {
        const tocHeadingDivNode = `<div><h2>${miniTOCHeading}</h2></div>`;
        ctx.innerHTML = `${tocHeadingDivNode}\n<div class='scrollable-div'><ul>${html.join('\n')}</ul></div>`;

        const anchors = Array.from(ctx.querySelectorAll('a'));
        let lactive = false;

        if (anchors.length > 0) {
          anchors.forEach((i, idx) => {
            if (lhash === false && idx === 0) {
              i.classList.add('is-active');
              lactive = true;
            } else if (lhash && i.hash === url.hash) {
              i.classList.add('is-active');
              lactive = true;
            }

            i.addEventListener('click', () => {
              const ahash = (i.href.length > 0 ? new URL(i.href).hash || '' : '').replace(/^#/, '');

              render(() => {
                anchors.forEach(a => a.classList.remove('is-active'));
                i.classList.add('is-active');

                if (ahash.length > 0) {
                  hashFragment(ahash);
                }
              });
            }, false);

            if (lactive === false) {
              highlight(false);
            }
          });
        }
      });
    } else {
      render(() => {
        ctx.parentElement.parentElement.classList.add('is-hidden');
      });
    }
  }
}
