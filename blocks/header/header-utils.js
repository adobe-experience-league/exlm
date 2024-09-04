export class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

export const decoratorState = {
  languages: new Deferred(),
};

/**
 * @param {HTMLElement} block
 * @param {number} row
 * @param {number} cell
 * @returns
 */
export const getCell = (block, row, cell) =>
  block.querySelector(`:scope > div:nth-child(${row}) > div:nth-child(${cell})`);

// Mobile Only (Until 1024px)
export const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

/**
 * debounce fn execution
 * @param {number} ms
 * @param {Function} fn
 * @returns {Function} debounced function
 */
export const debounce = (ms, fn) => {
  let timer;
  // eslint-disable-next-line func-names
  return function (...args) {
    clearTimeout(timer);
    args.unshift(this);
    timer = setTimeout(fn(args), ms);
  };
};

/**
 * Register page resize handler
 * @param {ResizeObserverCallback} handler
 * @returns {void} nothing
 */
export function registerHeaderResizeHandler(callback) {
  window.customResizeHandlers = window.customResizeHandlers || [];
  const header = document.querySelector('header');
  // register resize observer only once.
  if (!window.pageResizeObserver) {
    const pageResizeObserver = new ResizeObserver(
      debounce(100, () => {
        window.customResizeHandlers.forEach((handler) => {
          try {
            handler();
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
          }
        });
      }),
    );
    // observe immediately
    pageResizeObserver.observe(header, {
      box: 'border-box',
    });
    window.pageResizeObserver = pageResizeObserver;
  }
  // push handler
  window.customResizeHandlers.push(callback);
  // ensure handler runs at-least once
  callback();
}

// const ICONS_CACHE = {};
// // yes a dupe of decorateIcons from lib-franklin. did not want tot load lib-franklin just for this.
// // this is an acceptable dupe.
// /**
//  * Replace icons with inline SVG and prefix with codeBasePath.
//  * @param {Element} [element] Element containing icons
//  */
// export async function decorateIcons(element, prefix = '') {
//   // Prepare the inline sprite
//   let svgSprite = document.getElementById('franklin-svg-sprite');
//   if (!svgSprite) {
//     const div = document.createElement('div');
//     div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" id="franklin-svg-sprite" style="display: none"></svg>';
//     svgSprite = div.firstElementChild;
//     document.body.append(div.firstElementChild);
//   }

//   // Download all new icons
//   const icons = [...element.querySelectorAll('span.icon')];
//   await Promise.all(
//     icons.map(async (span) => {
//       const iconName = Array.from(span.classList)
//         .find((c) => c.startsWith('icon-'))
//         .substring(5);
//       if (!ICONS_CACHE[iconName]) {
//         ICONS_CACHE[iconName] = true;
//         try {
//           const response = await fetch(`${window.hlx.codeBasePath}/icons/${prefix}${iconName}.svg`);
//           if (!response.ok) {
//             ICONS_CACHE[iconName] = false;
//             return;
//           }
//           // Styled icons don't play nice with the sprite approach because of shadow dom isolation
//           // and same for internal references
//           const svg = await response.text();
//           if (svg.match(/(<style | class=|url\(#| xlink:href="#)/)) {
//             ICONS_CACHE[iconName] = {
//               styled: true,
//               html: svg
//                 // rescope ids and references to avoid clashes across icons;
//                 .replaceAll(/ id="([^"]+)"/g, (_, id) => ` id="${iconName}-${id}"`)
//                 .replaceAll(/="url\(#([^)]+)\)"/g, (_, id) => `="url(#${iconName}-${id})"`)
//                 .replaceAll(/ xlink:href="#([^"]+)"/g, (_, id) => ` xlink:href="#${iconName}-${id}"`),
//             };
//           } else {
//             ICONS_CACHE[iconName] = {
//               html: svg
//                 .replace('<svg', `<symbol id="icons-sprite-${iconName}"`)
//                 .replace(/ width=".*?"/, '')
//                 .replace(/ height=".*?"/, '')
//                 .replace('</svg>', '</symbol>'),
//             };
//           }
//         } catch (error) {
//           ICONS_CACHE[iconName] = false;
//           // eslint-disable-next-line no-console
//           console.error(error);
//         }
//       }
//     }),
//   );

//   const symbols = Object.keys(ICONS_CACHE)
//     .filter((k) => !svgSprite.querySelector(`#icons-sprite-${k}`))
//     .map((k) => ICONS_CACHE[k])
//     .filter((v) => !v.styled)
//     .map((v) => v.html)
//     .join('\n');
//   svgSprite.innerHTML += symbols;

//   icons.forEach((span) => {
//     const iconName = Array.from(span.classList)
//       .find((c) => c.startsWith('icon-'))
//       .substring(5);
//     const parent = span.firstElementChild?.tagName === 'A' ? span.firstElementChild : span;
//     // Styled icons need to be inlined as-is, while unstyled ones can leverage the sprite
//     if (ICONS_CACHE[iconName].styled) {
//       parent.innerHTML = ICONS_CACHE[iconName].html;
//     } else {
//       parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-${iconName}"/></svg>`;
//     }
//   });
// }

// // yes a dupe of getMetadata from lib-franklin. did not want tot load lib-franklin just for this.
// // this is an acceptable dupe.
// export function getMetadata(name) {
//   const attr = name && name.includes(':') ? 'property' : 'name';
//   const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((m) => m.content).join(', ');
//   return meta || '';
// }
