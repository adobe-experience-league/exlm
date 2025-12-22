import { decorateIcons } from '../../scripts/lib-franklin.js';
import { getPathDetails, fetchGlobalFragment, htmlToElement } from '../../scripts/scripts.js';

const FOOTER_CSS = '/blocks/footer/exl-footer.css';

/**
 * @typedef {Object} FooterOptions
 * @property {string} [lang] - Language code override
 * @property {string} [navLinkOrigin] - Origin to prepend to relative links
 * @property {boolean} [customCookies] - Enable custom OneTrust cookie consent handling for community/external pages
 * @property {string} [context] - Context identifier (e.g., 'community')
 */
const decorateFooterLinks = (block) => {
  const links = block.querySelectorAll('a[href*="@newtab"]');
  links.forEach((link) => {
    link.href = link.href.replace('@newtab', '');
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    // insert before first text child node
    const icon = htmlToElement('<span class="icon icon-link-out"></span>');
    link.firstChild.after(icon);
    decorateIcons(link);
  });
};

async function decorateMenu(footer) {
  const childElements = footer.querySelectorAll('.footer-item');
  const groupDiv = document.createElement('div');
  groupDiv.classList.add('footer-menu');
  decorateFooterLinks(footer);
  childElements.forEach((child) => {
    const h2Elements = Array.from(child.querySelectorAll('h2'));
    const ulElements = Array.from(child.querySelectorAll('ul'));
    const divWrapper = document.createElement('div');
    if (h2Elements.length > 0 && ulElements.length > 0) {
      h2Elements.forEach((h2Element, index) => {
        const divPair = document.createElement('div');
        divPair.setAttribute('class', 'footer-item-list');
        divPair.appendChild(h2Element);
        const ulElement = ulElements[index];
        divPair.appendChild(ulElement);
        divWrapper.appendChild(divPair);
      });
    }
    child.innerHTML = divWrapper.innerHTML;
    groupDiv.appendChild(child);
    const hElements = Array.from(child.querySelectorAll('h2'));
    hElements.forEach((hElement) => {
      hElement.addEventListener('click', () => {
        const footerMenuList = hElement.closest('.footer-item-list');
        if (footerMenuList) {
          if (footerMenuList.classList.contains('footer-item-active')) {
            footerMenuList.classList.remove('footer-item-active');
          } else {
            const menuList = Array.from(groupDiv.querySelectorAll('.footer-item-list'));
            menuList.forEach((element) => {
              element.classList.remove('footer-item-active');
            });
            footerMenuList.classList.add('footer-item-active');
          }
        }
      });
    });
  });
  const elem = footer.children[0];
  elem.insertBefore(groupDiv, elem.children[1]);
}

function extractDomain(domain) {
  const regex = /^(?:https?:\/\/)?(?:www\.)?([^./]+)\.com/;
  const match = domain.match(regex);
  return match?.[1] || '';
}

async function decorateSocial(footer) {
  // create the divs to acomodate the social icons
  const groupDiv = document.createElement('div');
  groupDiv.classList.add('footer-lang-social');

  const footerLastRow = document.createElement('div');
  footerLastRow.classList.add('footer-last-row');
  footerLastRow.appendChild(groupDiv);
  footer.appendChild(footerLastRow);

  // create social media icons
  const social = footer.querySelector('.social');
  groupDiv.appendChild(social);
  const socialParas = social.querySelectorAll('p');
  const socialFrag = document.createDocumentFragment();
  Array.from(socialParas).forEach((p) => {
    const { textContent } = p;
    const domainName = extractDomain(textContent).toLowerCase();
    const holder = document.createElement('a');
    holder.href = textContent;
    holder.setAttribute('aria-label', domainName);
    holder.target = '_blank';
    holder.classList.add('footer-social-icon-item-wrapper');
    holder.innerHTML = `<span class="icon icon-${domainName}"></span>`;
    socialFrag.appendChild(holder);
  });
  social.innerHTML = '';
  social.appendChild(socialFrag);
  decorateIcons(social);
}

function decorateBreadcrumb(footer) {
  const breadCrumb = footer.querySelector('.footer-breadcrumb');
  if (breadCrumb?.parentElement) {
    breadCrumb.parentElement.classList.add('footer-container');
  }
  const para = breadCrumb.querySelector('p');
  if (para?.parentElement) {
    para.parentElement.classList.add('footer-breadcrumb-item-wrapper');
  }
  const firstBreadcrumbAnchor = breadCrumb.querySelector('a');
  if (firstBreadcrumbAnchor) {
    firstBreadcrumbAnchor.innerHTML = `<span class="icon icon-home"></span>`;
    firstBreadcrumbAnchor.setAttribute('aria-label', 'Home'); // a11y
  }
  decorateIcons(breadCrumb);
}

function decorateCopyrightsMenu(footer) {
  const footerLastRow = footer.querySelector('.footer-last-row');
  const footerRights = footer.querySelector('.footer-copyrights');
  footerLastRow.appendChild(footerRights);
  const firstFooterAnchor = footerRights.querySelector('a');
  const copyRightWrapper = firstFooterAnchor.parentElement;
  Array.from(copyRightWrapper.querySelectorAll('a')).forEach((anchor) => {
    if (anchor?.href) {
      anchor.target = '_blank';
    }
  });
  const adChoice = copyRightWrapper.querySelector('a:last-child');
  if (adChoice?.href?.includes('#interest-based-ads')) {
    adChoice.classList.add('footer-adchoice-wrapper');
    adChoice.target = '_blank';
    adChoice.innerHTML = `<span class="icon icon-adchoices-small"></span> ${adChoice?.textContent?.trim()}`;
  }
  copyRightWrapper.innerHTML = copyRightWrapper.innerHTML.replaceAll(/\s\/\s/g, '<span class="footer-slash">/</span>');
  if (copyRightWrapper?.firstChild instanceof Text) {
    copyRightWrapper.innerHTML = copyRightWrapper.innerHTML.replace(
      copyRightWrapper.firstChild.textContent,
      `<span class="footer-copyrights-text">${copyRightWrapper.firstChild.textContent}</span>`,
    );
  }

  copyRightWrapper.classList.add('footer-copyrights-element');
  const footerMenu = footer.querySelector('.footer-menu');
  footerMenu.parentElement.appendChild(footerLastRow);
  decorateIcons(footerRights);
}

function handleSocialIconStyles(footer) {
  Array.from(footer.querySelectorAll('.social a')).forEach((anchor) => {
    const svg = anchor.querySelector('svg');
    anchor.addEventListener('mouseenter', () => {
      const symbolPath = svg.firstElementChild?.href?.baseVal;
      const symbol = symbolPath ? document.querySelector(symbolPath) : null;
      if (symbol) {
        svg.style.fill = '#909090';
        symbol.firstElementChild.style.fill = '#909090';
      }
    });
    anchor.addEventListener('mouseleave', () => {
      const symbolPath = svg.firstElementChild?.href?.baseVal;
      const symbol = symbolPath ? document.querySelector(symbolPath) : null;
      if (symbol) {
        svg.style.fill = '';
        symbol.firstElementChild.style.fill = '';
      }
    });
  });
}

class ExlFooter extends HTMLElement {
  isLoaded = false;

  /**
   * @param {{ lang?: string }} options
   */
  constructor(options = {}) {
    super();
    this.options = options;
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Loads a CSS file into the shadow root.
   * @param {string} href URL to the CSS file
   */
  loadCSS(href, media) {
    return new Promise((resolve, reject) => {
      if (!this.shadowRoot.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        if (media) link.media = media;
        link.onload = resolve;
        link.onerror = reject;
        this.shadowRoot.append(link);
      } else {
        resolve();
      }
    });
  }

  ensureShadowStyleShim() {
    if (this.shadowRoot.querySelector('style[data-exl-footer-shim]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-exl-footer-shim', 'true');
    style.textContent = ':host { display: block; }';
    this.shadowRoot.append(style);
  }

  async loadStyles() {
    this.ensureShadowStyleShim();
    return Promise.allSettled([this.loadCSS(`${window.hlx.codeBasePath}${FOOTER_CSS}`)]);
  }

  async decorate() {
    try {
      const { lang: pathLang } = getPathDetails();
      const lang = this.options.lang || pathLang || 'en';
      const footerMeta = 'footer-fragment';
      const fallback = '/en/global-fragments/footer';
      const footerFragment = await fetchGlobalFragment(footerMeta, fallback, lang);

      if (footerFragment) {
        const footer = document.createElement('div');
        footer.innerHTML = footerFragment;
        this.shadowRoot.append(footer);
        await decorateSocial(footer);
        decorateBreadcrumb(footer);
        await decorateMenu(footer);
        handleSocialIconStyles(footer);
        decorateCopyrightsMenu(footer);
        footer.querySelector('.language-selector')?.remove();
        // Initialize custom cookie handler if enabled (for community pages)
        if (this.options.customCookies) {
          import('../../scripts/custom-cookies/custom-cookies.js').then((module) => {
            module.default();
          });
        }
        this.dispatchEvent(new Event('footer-decorated'));
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error decorating footer', err);
    }
  }

  async connectedCallback() {
    if (this.isLoaded) return;
    this.style.display = 'none';
    await Promise.allSettled([this.loadStyles(), this.decorate()]);
    this.style.display = '';
    this.isLoaded = true;

    const oneTrustAnchorElement = this.shadowRoot.querySelector('[href="#onetrust"]');
    if (oneTrustAnchorElement) {
      oneTrustAnchorElement.addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
      });

      oneTrustAnchorElement.addEventListener('keydown', (evt) => {
        const isActivateKey = evt.key === 'Enter' || evt.key === ' ';
        if (!isActivateKey) return;
        evt.preventDefault();
        evt.stopPropagation();
        this.dispatchEvent(
          new CustomEvent('exl-onetrust-activate', {
            bubbles: true,
            composed: true,
          }),
        );
      });

      const footerContainer = this.shadowRoot.querySelector('.footer-container');
      if (footerContainer) {
        this.resizeObserver = new ResizeObserver(() => {
          this.dispatchEvent(new CustomEvent('exl-footer-resize', { bubbles: true, composed: true }));
        });
        this.resizeObserver.observe(footerContainer);
      }
    }

    this.dispatchEvent(
      new CustomEvent('footer-loaded', {
        detail: { oneTrustAnchorElement: oneTrustAnchorElement || null },
        bubbles: true,
        composed: true,
      }),
    );
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
  }
}

if (!customElements.get('exl-footer')) {
  customElements.define('exl-footer', ExlFooter);
}

/**
 * Create footer web component and attach to the DOM
 * @param {Element} block The footer block element
 * @param {FooterOptions} [options] Optional configuration for external/community usage
 */
export default async function decorate(block, options = {}) {
  const exlFooter = new ExlFooter(options);
  exlFooter.addEventListener(
    'footer-loaded',
    (e) => {
      const oneTrustAnchorElement = e.detail?.oneTrustAnchorElement;
      if (oneTrustAnchorElement) {
        block.classList.add('footer-container');
        oneTrustAnchorElement.classList.add('footer-invisible-anchor');
        const existing = block.querySelector('[data-exl-onetrust-anchor="true"]');
        if (existing?.exlCleanup) existing.exlCleanup();
        existing?.remove();

        const oneTrustAnchorCloneEl = oneTrustAnchorElement.cloneNode(true);
        oneTrustAnchorCloneEl.setAttribute('aria-hidden', 'true');
        oneTrustAnchorCloneEl.setAttribute('tabindex', '-1');
        block.append(oneTrustAnchorCloneEl);
        let raf = 0;
        const syncOverlay = () => {
          oneTrustAnchorElement.classList.remove('footer-invisible-anchor');
          oneTrustAnchorCloneEl.classList.add('footer-invisible-anchor');
          if (raf) return;
          raf = window.requestAnimationFrame(() => {
            raf = 0;

            const t = oneTrustAnchorElement.getBoundingClientRect();
            const b = block.getBoundingClientRect();
            if (!t.width || !t.height) {
              oneTrustAnchorCloneEl.classList.add('footer-invisible-anchor');
              return;
            }

            oneTrustAnchorCloneEl.style.top = `${t.top - b.top}px`;
            oneTrustAnchorCloneEl.style.left = `${t.left - b.left}px`;
            oneTrustAnchorCloneEl.style.width = `${t.width}px`;
            oneTrustAnchorCloneEl.style.height = `${t.height}px`;

            oneTrustAnchorCloneEl.classList.remove('footer-invisible-anchor');
            oneTrustAnchorElement.classList.add('footer-invisible-anchor');
          });
        };

        const onFooterResize = () => syncOverlay();
        const onOneTrustActivate = () => oneTrustAnchorCloneEl.click();
        exlFooter.addEventListener('exl-footer-resize', onFooterResize);
        exlFooter.addEventListener('exl-onetrust-activate', onOneTrustActivate);

        syncOverlay();
        oneTrustAnchorCloneEl.exlCleanup = () => {
          if (raf) window.cancelAnimationFrame(raf);
          exlFooter.removeEventListener('exl-footer-resize', onFooterResize);
          exlFooter.removeEventListener('exl-onetrust-activate', onOneTrustActivate);
        };
      }
      document.dispatchEvent(new CustomEvent('footer-ready', { bubbles: true }));
    },
    { once: true },
  );
  block.replaceChildren(exlFooter);
}
