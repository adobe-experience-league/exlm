import { decorateIcons } from '../../scripts/lib-franklin.js';

const CONFIG = {
  basePath: '/fragments/en',
  footerPath: '/footer/footer.plain.html',
  languagePath: '/languages/languages.plain.html',
};

// Utility function for http call
const getHTMLData = async (url) => {
  const response = await fetch(url);
  if (response.ok) {
    const responseData = response.text();
    return responseData;
  }
  throw new Error(`${url} not found`);
};

function decorateMenu(footer) {
  const childElements = footer.querySelectorAll('.footer-item');
  const groupDiv = document.createElement('div');
  groupDiv.classList.add('footer-menu');
  childElements.forEach((child) => {
    const h2Elements = Array.from(child.querySelectorAll('h2'));
    const ulElements = Array.from(child.querySelectorAll('ul'));
    const divWrapper = document.createElement('div');
    if (h2Elements.length > 0 && ulElements.length > 0) {
      h2Elements.forEach((h2Element, index) => {
        const divPair = document.createElement('div');
        divPair.setAttribute('class', 'footer-item-list');
        divPair.appendChild(h2Element);
        divPair.appendChild(ulElements[index]);
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
            const menuList = Array.from(
              groupDiv.querySelectorAll('.footer-item-list'),
            );
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
  // fetch language content
  const languagePath = `${CONFIG.basePath}${CONFIG.languagePath}`;
  const html = await getHTMLData(languagePath);
  if (html) {
    const frag = document.createElement('div');
    frag.innerHTML = html;
    const languageNav = frag.querySelector('.language-nav');
    const dropdownMenu = languageNav.firstElementChild;
    const dropdownMenuContent = dropdownMenu.firstElementChild;
    dropdownMenu.classList.add('dropdown-menu');
    dropdownMenuContent.classList.add('dropdown-content');
    languageSelector.firstElementChild.classList.add(
      'language-selector-button',
    );
    languageSelector.appendChild(languageNav);
  }
  groupDiv.appendChild(languageSelector);
  groupDiv.appendChild(social);
  const elem = footer.children[0];
  elem.insertBefore(groupDiv, elem.children[2]);
  const socialEl = footer.querySelector('.social');
  const socialParas = socialEl.querySelectorAll('p');
  const socialFrag = document.createDocumentFragment();
  Array.from(socialParas).forEach((p) => {
    const { textContent } = p;
    const domainName = extractDomain(textContent).toLowerCase();
    const holder = document.createElement('a');
    holder.href = textContent;
    holder.target = '_blank';
    holder.classList.add('footer-social-icon-item-wrapper');
    holder.innerHTML = `<span class="icon icon-${domainName}"></span>`;
    socialFrag.appendChild(holder);
  });
  socialEl.innerHTML = '';
  socialEl.appendChild(socialFrag);
}

function decorateBreadcrumb(footer) {
  const breadCrumb = footer.querySelector('.footer-breadcrumb');
  const para = breadCrumb.querySelector('p');
  para.parentElement.classList.add('footer-breadcrumb-item-wrapper');
  Array.from(breadCrumb.querySelectorAll('a')).forEach((a) => {
    if (a.title?.toLowerCase() === 'home') {
      a.innerHTML = `<span class="icon icon-home"></span>`;
    }
  });
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
    adChoice.target = '_blank';
    adChoice.innerHTML = `<span class="icon icon-adchoices-small"></span> AdChoices`;
  }
  copyRightWrapper.innerHTML = copyRightWrapper.innerHTML.replaceAll(
    /(?<=\s)\/(?=\s)/g,
    '<span>/</span>',
  );
  copyRightWrapper.classList.add('footer-copyrights-element');
  footerMenu.parentElement.appendChild(footerLastRow);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // fetch footer content
  const footerPath = `${CONFIG.basePath}${CONFIG.footerPath}`;
  const resp = await getHTMLData(footerPath);

  if (resp) {
    const html = resp;

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;
    decorateMenu(footer);
    await decorateSocial(footer);
    decorateBreadcrumb(footer);
    block.append(footer);
    decorateCopyrightsMenu();
    decorateIcons(footer);
  }
}
