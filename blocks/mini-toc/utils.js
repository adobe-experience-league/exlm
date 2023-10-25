'use strict';

export const timers = new Map();

export function setLevels(val = 2) {
    const selectors = [];

    if (val > 6) {
        val = 6;
    }

    for (let i = val; i >= 1; i--) {
        selectors.push(`h${i + 1}:not(#lists-documentation)`);
    }

    return selectors.join(',');
}

export function highlight(replace = false) {
    const render = window.requestAnimationFrame;
    const ctx = document.querySelector('.mini-toc'),
        levels = document.querySelector('meta[name="mini-toc-levels"]'),
        mtocScroll = ctx.querySelectorAll('a').length > 10 ? true : false;

    if (ctx !== null) {
        const top = window.scrollY,
            headers = Array.from(document.querySelector('main').querySelectorAll(setLevels(levels !== null && parseInt(levels.content, 10) > 0 ? parseInt(levels.content, 10) : void 0))).filter(i => i.id.length > 0),
            anchors = Array.from(ctx.querySelectorAll('a'));
        let el;

        for (const [idx, i] of headers.entries()) {
            if (parseInt(i.offsetTop, 10) + parseInt(i.offsetHeight, 10) >= top) {
                el = anchors[idx];
                break;
            }
        }

        if (el !== void 0) {
            render(() => {
                ctx.querySelectorAll('a.is-active').forEach(i => i.classList.remove('is-active'));
                el.classList.add('is-active');

                if (mtocScroll) {
                    ctx.scroll(0, el.offsetTop - ctx.offsetTop);
                }

                if (replace) {
                    history.replaceState({}, '', el.href);
                }
            });
        }
    }
}

export function hashFragment(arg = '') {
    const url = new URL(location.href),
        lhash = arg.replace(/^#/, '');

    url.hash = lhash.length > 0 ? lhash : arg;
    history.replaceState({}, '', url.href);
}
