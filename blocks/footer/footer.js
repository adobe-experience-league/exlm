import { isSignedInUser } from '../../scripts/auth/profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { getPathDetails, fetchFragment } from '../../scripts/scripts.js';
import LanguageBlock from '../language/language.js';

/**
 * Links that have urls with JSON the hash, the JSON will be translated to attributes
 * eg <a href="https://example.com#{"target":"_blank", "auth-only": "true"}">link</a>
 * will be translated to <a href="https://example.com" target="_blank" auth-only="true">link</a>
 * @param {HTMLElement} block
 */
const decorateFooterLinks = (block) => {
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

async function decorateMenu(footer) {
  const isSignedIn = await isSignedInUser();
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
        const anchorLinks = Array.from(ulElement.querySelectorAll('a') ?? []);
        const containsAuthOnlyLink = !!anchorLinks.find((a) => a.getAttribute('auth-only'));
        if (containsAuthOnlyLink) {
          const loginLink = anchorLinks.find((a) => a.getAttribute('auth-only') !== 'true');
          if (loginLink) {
            loginLink.href = '';
            loginLink.classList.add('footer-login-link');
          }
          anchorLinks.forEach((a) => {
            const authOnlyAttribute = a.getAttribute('auth-only');
            const isSignedInAndUnAuthenticatedLink = isSignedIn && authOnlyAttribute !== 'true';
            const isNotSignedInAndAuthenticatedLink = !isSignedIn && authOnlyAttribute === 'true';
            if (isSignedInAndUnAuthenticatedLink || isNotSignedInAndAuthenticatedLink) {
              a.classList.add('footer-link-hidden');
            }
          });
        }
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
  // create the divs to acomodate the social icons and the language selector
  const languageSelector = footer.querySelector('.language-selector');
  const groupDiv = document.createElement('div');
  groupDiv.classList.add('footer-lang-social');
  groupDiv.appendChild(languageSelector);

  // append languageBlock to footer
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
  if (para && para.parentElement) {
    para.parentElement.classList.add('footer-breadcrumb-item-wrapper');
  }
  const firstBreadcrumbAnchor = breadCrumb.querySelector('a');
  if (firstBreadcrumbAnchor) {
    firstBreadcrumbAnchor.innerHTML = `<span class="icon icon-home"></span>`;
  }
  decorateIcons(breadCrumb);
}

function decorateCopyrightsMenu(footer) {
  const footerLastRow = footer.querySelector('.footer-last-row');
  const footerRights = document.querySelector('.footer-copyrights');
  footerLastRow.appendChild(footerRights);
  const firstFooterAnchor = footerRights.querySelector('a');
  const copyRightWrapper = firstFooterAnchor.parentElement;
  Array.from(copyRightWrapper.querySelectorAll('a')).forEach((anchor) => {
    if (anchor?.href) {
      anchor.target = '_blank';
    }
  });
  const adChoice = copyRightWrapper.querySelector('a:last-child');
  if (adChoice?.text?.toLowerCase() === 'adchoices') {
    adChoice.classList.add('footer-adchoice-wrapper');
    adChoice.target = '_blank';
    adChoice.innerHTML = `<span class="icon icon-adchoices-small"></span> AdChoices`;
  }
  copyRightWrapper.innerHTML = copyRightWrapper.innerHTML.replaceAll(/\s\/\s/g, '<span class="footer-slash">/</span>');
  if (copyRightWrapper?.firstChild instanceof Text) {
    copyRightWrapper.innerHTML = copyRightWrapper.innerHTML.replace(
      copyRightWrapper.firstChild.textContent,
      `<span class="footer-copyrights-text">${copyRightWrapper.firstChild.textContent}</span>`,
    );
  }

  copyRightWrapper.classList.add('footer-copyrights-element');
  const footerMenu = document.querySelector('.footer-menu');
  footerMenu.parentElement.appendChild(footerLastRow);
  const languageSelector = footer.querySelector('.language-selector');
  const languageBlock = new LanguageBlock({
    position: 'top',
    popoverId: 'language-picker-popover-footer',
    block: languageSelector,
  });
  languageSelector.appendChild(languageBlock);
  const languageSelectorDiv = languageSelector.querySelector('div');
  const languageBlockButton = languageBlock.querySelector('.language-selector-button');
  languageBlockButton.appendChild(languageSelectorDiv);
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

function handleLoginFunctionality(footer) {
  const loginLink = footer.querySelector('.footer-login-link');
  loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.adobeIMS.signIn();
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // fetch footer content
  const { lang } = getPathDetails();
  const footerFragment = await fetchFragment('footer/footer', lang);

  if (footerFragment) {
    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = footerFragment;
    block.append(footer);
    await decorateSocial(footer);
    decorateBreadcrumb(footer);
    await decorateMenu(footer);
    handleSocialIconStyles(footer);
    handleLoginFunctionality(footer);
    decorateCopyrightsMenu(footer);
  }
}
