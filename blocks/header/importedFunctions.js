/**
 * Links that have urls with JSON the hash, the JSON will be translated to attributes
 * eg <a href="https://example.com#{"target":"_blank", "auth-only": "true"}">link</a>
 * will be translated to <a href="https://example.com" target="_blank" auth-only="true">link</a>
 * @param {HTMLElement} block
 */
export const decorateLinks = (block) => {
  const links = block.querySelectorAll('a');
  links.forEach((link) => {
    const decodedHref = decodeURIComponent(link.getAttribute('href'));
    const firstCurlyIndex = decodedHref.indexOf('{');
    const lastCurlyIndex = decodedHref.lastIndexOf('}');
    if (firstCurlyIndex > -1 && lastCurlyIndex > -1) {
      // everything between curly braces is treated as JSON string.
      const optionsJsonStr = decodedHref.substring(firstCurlyIndex, lastCurlyIndex + 1);
      const fixedJsonString = optionsJsonStr.replace(/'/g, '"'); // JSON.parse function expects JSON strings to be formatted with double quotes
      const parsedJSON = JSON.parse(fixedJsonString);
      Object.entries(parsedJSON).forEach(([key, value]) => {
        link.setAttribute(key.trim(), value);
      });
      // remove the JSON string from the hash, if JSON string is the only thing in the hash, remove the hash as well.
      const endIndex = decodedHref.charAt(firstCurlyIndex - 1) === '#' ? firstCurlyIndex - 1 : firstCurlyIndex;
      link.href = decodedHref.substring(0, endIndex);
    }
  });
};

/**
 * Sanitizes a string for use as class name.
 * @param {string} name The unsanitized string
 * @returns {string} The class name
 */
export function toClassName(name) {
  return typeof name === 'string'
    ? name
        .toLowerCase()
        .replace(/[^0-9a-z]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : '';
}

/**
 * Sanitizes a string for use as a js property name.
 * @param {string} name The unsanitized string
 * @returns {string} The camelCased name
 */
export function toCamelCase(name) {
  return toClassName(name).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Gets placeholders object.
 * @param {string} [prefix] Location of placeholders
 * @returns {object} Window placeholders object
 */
export async function fetchPlaceholders(prefix = 'default') {
  window.placeholders = window.placeholders || {};
  const loaded = window.placeholders[`${prefix}-loaded`];
  if (!loaded) {
    window.placeholders[`${prefix}-loaded`] = new Promise((resolve, reject) => {
      fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          throw new Error(`${resp.status}: ${resp.statusText}`);
        })
        .then((json) => {
          const placeholders = {};
          json.data
            .filter((placeholder) => placeholder.Key)
            .forEach((placeholder) => {
              placeholders[toCamelCase(placeholder.Key)] = placeholder.Text;
            });
          window.placeholders[prefix] = placeholders;
          resolve();
        })
        .catch((error) => {
          // error loading placeholders
          window.placeholders[prefix] = {};
          reject(error);
        });
    });
  }
  await window.placeholders[`${prefix}-loaded`];
  return window.placeholders[prefix];
}

/**
 * Process current pathname and return details for use in language switching
 * Considers pathnames like /en/path/to/content and /content/exl/global/en/path/to/content.html for both EDS and AEM
 */
export function getPathDetails() {
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

export async function fetchLanguagePlaceholders() {
  const { lang } = getPathDetails();
  try {
    // Try fetching placeholders with the specified language
    return await fetchPlaceholders(`/${lang}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching placeholders for lang: ${lang}. Will try to get en placeholders`, error);
    // Retry without specifying a language (using the default language)
    try {
      return await fetchPlaceholders('/en');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }
  }
  return {}; // default to empty object
}

/**
 * get site config
 */
export function getConfig() {
  if (window.exlm && window.exlm.config) {
    return window.exlm.config;
  }

  const HOSTS = [
    {
      env: 'PROD',
      cdn: 'experienceleague.adobe.com',
      hlxPreview: 'main--exlm-prod--adobe-experience-league.hlx.page',
      hlxLive: 'main--exlm-prod--adobe-experience-league.hlx.live',
    },
    {
      env: 'PROD-AUTHOR',
      cdn: 'author-p122525-e1219150.adobeaemcloud.com',
      hlxPreview: 'main--exlm-prod--adobe-experience-league.hlx.page',
      hlxLive: 'main--exlm-prod--adobe-experience-league.hlx.live',
    },
    {
      env: 'STAGE',
      cdn: 'experienceleague-stage.adobe.com',
      hlxPreview: 'main--exlm-stage--adobe-experience-league.hlx.page',
      hlxLive: 'main--exlm-stage--adobe-experience-league.live',
    },
    {
      env: 'STAGE-AUTHOR',
      cdn: 'author-p122525-e1219192.adobeaemcloud.com',
      hlxPreview: 'main--exlm-stage--adobe-experience-league.hlx.page',
      hlxLive: 'main--exlm-stage--adobe-experience-league.live',
    },
    {
      env: 'DEV',
      cdn: 'experienceleague-dev.adobe.com',
      hlxPreview: 'main--exlm--adobe-experience-league.hlx.page',
      hlxLive: 'main--exlm--adobe-experience-league.hlx.live',
    },
  ];

  const currentHost = window.location.hostname;
  const defaultEnv = HOSTS.find((hostObj) => hostObj.env === 'DEV');
  const currentEnv = HOSTS.find((hostObj) => Object.values(hostObj).includes(currentHost));
  const cdnHost = currentEnv?.cdn || defaultEnv.cdn;
  const cdnOrigin = `https://${cdnHost}`;
  const lang = document.querySelector('html').lang || 'en';
  const prodAssetsCdnOrigin = 'https://cdn.experienceleague.adobe.com';
  const isProd = currentEnv?.env.includes('PROD', 'PROD-AUTHOR');
  const isStage = currentEnv?.env.includes('STAGE', 'STAGE-AUTHOR');
  const ppsOrigin = isProd ? 'https://pps.adobe.io' : 'https://pps-stage.adobe.io';
  const ims = {
    client_id: 'ExperienceLeague',
    environment: isProd ? 'prod' : 'stg1',
    debug: !isProd,
  };

  let launchScriptSrc;
  if (isProd) launchScriptSrc = 'https://assets.adobedtm.com/d4d114c60e50/9f881954c8dc/launch-7a902c4895c3.min.js';
  else if (isStage)
    launchScriptSrc = 'https://assets.adobedtm.com/d4d114c60e50/9f881954c8dc/launch-102059c3cf0a-staging.min.js';
  else launchScriptSrc = 'https://assets.adobedtm.com/d4d114c60e50/9f881954c8dc/launch-caabfb728852-development.js';

  window.exlm = window.exlm || {};
  window.exlm.config = {
    isProd,
    ims,
    currentEnv,
    cdnOrigin,
    cdnHost,
    prodAssetsCdnOrigin,
    ppsOrigin,
    launchScriptSrc,
    khorosProfileUrl: `${cdnOrigin}/api/action/khoros/profile-menu-list`,
    khorosProfileDetailsUrl: `${cdnOrigin}/api/action/khoros/profile-details`,
    privacyScript: `${cdnOrigin}/etc.clientlibs/globalnav/clientlibs/base/privacy-standalone.js`,
    profileUrl: `${cdnOrigin}/api/profile?lang=${lang}`,
    JWTTokenUrl: `${cdnOrigin}/api/token?lang=${lang}`,
    coveoTokenUrl: `${cdnOrigin}/api/coveo-token?lang=${lang}`,
    coveoSearchResultsUrl: isProd
      ? 'https://platform.cloud.coveo.com/rest/search/v2'
      : 'https://adobesystemsincorporatednonprod1.org.coveo.com/rest/search/v2',
    coveoOrganizationId: isProd ? 'adobev2prod9e382h1q' : 'adobesystemsincorporatednonprod1',
    coveoToken: 'xxcfe1b6e9-3628-49b5-948d-ed50d3fa6c99',
    liveEventsUrl: `${prodAssetsCdnOrigin}/thumb/upcoming-events.json`,
    adlsUrl: 'https://learning.adobe.com/catalog.result.json',
    industryUrl: `${cdnOrigin}/api/industries?page_size=200&sort=Order&lang=${lang}`,
    searchUrl: `${cdnOrigin}/search.html`,
    articleUrl: `${cdnOrigin}/api/articles/`,
    solutionsUrl: `${cdnOrigin}/api/solutions?page_size=100`,
    pathsUrl: `${cdnOrigin}/api/paths`,
    // Browse Left nav
    browseMoreProductsLink: `/${lang}/browse`,
    // Machine Translation
    automaticTranslationLink: `/${lang}/docs/contributor/contributor-guide/localization/machine-translation`,
    // Recommended Courses
    recommendedCoursesUrl: `${cdnOrigin}/home?lang=${lang}#dashboard/learning`,
    // Adobe account
    adobeAccountURL: isProd ? 'https://account.adobe.com/' : 'https://stage.account.adobe.com/',
    // Community Account
    communityAccountURL: isProd
      ? 'https://experienceleaguecommunities.adobe.com/'
      : 'https://experienceleaguecommunities-dev.adobe.com/',
    // Stream API
    eventSourceStreamUrl: '/api/stream',
  };
  return window.exlm.config;
}

/**
 * Helper function that adapts the path to work on EDS and AEM rendering
 */
export function getLink(edsPath) {
  return window.hlx.aemRoot && !edsPath.startsWith(window.hlx.aemRoot) && edsPath.indexOf('.html') === -1
    ? `${window.hlx.aemRoot}${edsPath}.html`
    : edsPath;
}

export async function fetchWithFallback(path, fallbackPath) {
  const response = await fetch(path);
  if (response.ok) return response;
  return fetch(fallbackPath);
}

export async function fetchFragment(rePath, lang = 'en') {
  const path = `/fragments/${lang}/${rePath}.plain.html`;
  const fallback = `/fragments/en/${rePath}.plain.html`;
  const response = await fetchWithFallback(path, fallback);
  return response.text();
}

/**
 * creates an element from html string
 * @param {string} html
 * @returns {HTMLElement}
 */
export function htmlToElement(html) {
  const template = document.createElement('template');
  const trimmedHtml = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = trimmedHtml;
  return template.content.firstElementChild;
}

const ICONS_CACHE = {};
/**
 * Retrieves the content of metadata tags.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value(s)
 */
export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((m) => m.content).join(', ');
  return meta || '';
}

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

export function isFeatureEnabled(name) {
  return getMetadata('feature-flags')
    .split(',')
    .map((t) => t.toLowerCase().trim())
    .includes(name);
}

export class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}
