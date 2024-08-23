import { isSignedInUser } from '../../scripts/auth/profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { getPathDetails, decorateLinks, fetchFragment } from '../../scripts/scripts.js';
import LanguageBlock from '../../scripts/language.js';

async function decorateMenu(footer) {
  const isSignedIn = await isSignedInUser();
  const childElements = footer.querySelectorAll('.footer-item');
  const groupDiv = document.createElement('div');
  groupDiv.classList.add('footer-menu');
  decorateLinks(footer);
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
  const languageSelector = footer.querySelector('.language-selector');
  const social = footer.querySelector('.social');
  const groupDiv = document.createElement('div');
  groupDiv.classList.add('footer-lang-social');
  // build language popover
  const languageBlock = new LanguageBlock('top', 'language-picker-popover-footer');
  const { popover } = await languageBlock.buildLanguageBlock();

  const langSelectorButton = languageSelector.firstElementChild;
  langSelectorButton.classList.add('language-selector-button');
  langSelectorButton.setAttribute('aria-haspopup', 'true');
  langSelectorButton.setAttribute('aria-controls', 'language-picker-popover-footer');
  const icon = document.createElement('span');
  icon.classList.add('icon', 'icon-globegrid');
  langSelectorButton.appendChild(icon);
  languageSelector.appendChild(popover);

  groupDiv.appendChild(languageSelector);
  groupDiv.appendChild(social);
  const elem = footer.children[0];
  elem.insertBefore(groupDiv, elem.children[2]);
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
}

function decorateCopyrightsMenu() {
  const footerLastRow = document.createElement('div');
  footerLastRow.classList.add('footer-last-row');
  const footerLangSocial = document.querySelector('.footer-lang-social');
  const footerRights = document.querySelector('.footer-copyrights');
  footerLastRow.appendChild(footerLangSocial);
  footerLastRow.appendChild(footerRights);
  const footerMenu = document.querySelector('.footer-menu');
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
  footerMenu.parentElement.appendChild(footerLastRow);
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
    await decorateSocial(footer);
    decorateBreadcrumb(footer);
    await decorateMenu(footer);
    block.append(footer);
    handleSocialIconStyles(footer);
    handleLoginFunctionality(footer);
    decorateCopyrightsMenu();
    await decorateIcons(footer);
  }
}
