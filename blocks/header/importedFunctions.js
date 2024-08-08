export class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

const ICONS_CACHE = {};
/**
 * Replace icons with inline SVG and prefix with codeBasePath.
 * @param {Element} [element] Element containing icons
 */
export async function decorateIcons(element, prefix = '') {
  // Prepare the inline sprite
  let svgSprite = document.getElementById('franklin-svg-sprite');
  if (!svgSprite) {
    const div = document.createElement('div');
    div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" id="franklin-svg-sprite" style="display: none"></svg>';
    svgSprite = div.firstElementChild;
    document.body.append(div.firstElementChild);
  }

  // Download all new icons
  const icons = [...element.querySelectorAll('span.icon')];
  await Promise.all(
    icons.map(async (span) => {
      const iconName = Array.from(span.classList)
        .find((c) => c.startsWith('icon-'))
        .substring(5);
      if (!ICONS_CACHE[iconName]) {
        ICONS_CACHE[iconName] = true;
        try {
          const response = await fetch(`${window.hlx.codeBasePath}/icons/${prefix}${iconName}.svg`);
          if (!response.ok) {
            ICONS_CACHE[iconName] = false;
            return;
          }
          // Styled icons don't play nice with the sprite approach because of shadow dom isolation
          // and same for internal references
          const svg = await response.text();
          if (svg.match(/(<style | class=|url\(#| xlink:href="#)/)) {
            ICONS_CACHE[iconName] = {
              styled: true,
              html: svg
                // rescope ids and references to avoid clashes across icons;
                .replaceAll(/ id="([^"]+)"/g, (_, id) => ` id="${iconName}-${id}"`)
                .replaceAll(/="url\(#([^)]+)\)"/g, (_, id) => `="url(#${iconName}-${id})"`)
                .replaceAll(/ xlink:href="#([^"]+)"/g, (_, id) => ` xlink:href="#${iconName}-${id}"`),
            };
          } else {
            ICONS_CACHE[iconName] = {
              html: svg
                .replace('<svg', `<symbol id="icons-sprite-${iconName}"`)
                .replace(/ width=".*?"/, '')
                .replace(/ height=".*?"/, '')
                .replace('</svg>', '</symbol>'),
            };
          }
        } catch (error) {
          ICONS_CACHE[iconName] = false;
          // eslint-disable-next-line no-console
          console.error(error);
        }
      }
    }),
  );

  const symbols = Object.keys(ICONS_CACHE)
    .filter((k) => !svgSprite.querySelector(`#icons-sprite-${k}`))
    .map((k) => ICONS_CACHE[k])
    .filter((v) => !v.styled)
    .map((v) => v.html)
    .join('\n');
  svgSprite.innerHTML += symbols;

  icons.forEach((span) => {
    const iconName = Array.from(span.classList)
      .find((c) => c.startsWith('icon-'))
      .substring(5);
    const parent = span.firstElementChild?.tagName === 'A' ? span.firstElementChild : span;
    // Styled icons need to be inlined as-is, while unstyled ones can leverage the sprite
    if (ICONS_CACHE[iconName].styled) {
      parent.innerHTML = ICONS_CACHE[iconName].html;
    } else {
      parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-${iconName}"/></svg>`;
    }
  });
}

/**
 * Process current pathname and return details for use in language switching for the experience league site
 */
function getAemPathDetails() {
  const { pathname } = window.location;
  const extParts = pathname.split('.');
  const ext = extParts.length > 1 ? extParts[extParts.length - 1] : '';
  const isContentPath = pathname.startsWith('/content');
  const parts = pathname.split('/');
  const safeLangGet = (index) => (parts.length > index ? parts[index] : 'en');
  // 4 is the index of the language in the path for AEM content paths like  /content/exl/global/en/path/to/content.html
  // 1 is the index of the language in the path for EDS paths like /en/path/to/content
  let lang = isContentPath ? safeLangGet(4) : safeLangGet(1);
  // remove suffix from lang if any
  if (lang.indexOf('.') > -1) {
    lang = lang.substring(0, lang.indexOf('.'));
  }
  if (!lang) lang = 'en'; // default to en
  // substring before lang
  const prefix = pathname.substring(0, pathname.indexOf(`/${lang}`)) || '';
  const suffix = pathname.substring(pathname.indexOf(`/${lang}`) + lang.length + 1) || '';
  return {
    ext,
    prefix,
    suffix,
    lang,
    isContentPath,
  };
}

/**
 * Process current pathname and return details for use in language switching for the community site
 */
function getCommunityPathDetails() {
  const pathname = window.location.href;
  const pathLocation = pathname.split('?')[1];
  const extParts = pathLocation.split('=');
  let lang = extParts.length > 1 ? extParts[extParts.length - 1] : '';
  if (lang.indexOf('.') > -1) {
    lang = lang.substring(0, lang.indexOf('.'));
  }
  if (!lang) lang = 'en'; // default to en
  // substring before lang
  const prefix = pathname.substring(0, pathname.indexOf(`/?profile.languages=${lang}`)) || '';
  const suffix = pathname.substring(pathname.indexOf(`/?profile.languages=${lang}`) + lang.length + 1) || '';
  return {
    prefix,
    suffix,
    lang,
  };
}

/**
 * Process current pathname and return details for use in language switching
 * Considers pathnames like /en/path/to/content and /content/exl/global/en/path/to/content.html for both EDS and AEM
 */
export function getPathDetails() {
  const url = window.location.href;
  if (url.includes('experienceleaguecommunities')) {
    return getCommunityPathDetails();
  }
  return getAemPathDetails();
}
