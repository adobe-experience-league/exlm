import { readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';

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

function decorateSocial(footer) {
  const languageSelector = footer.querySelector('.language-selector');
  const social = footer.querySelector('.social');
  const groupDiv = document.createElement('div');
  groupDiv.classList.add('footer-lang-social');
  groupDiv.appendChild(languageSelector);
  groupDiv.appendChild(social);
  const elem = footer.children[0];
  elem.insertBefore(groupDiv, elem.children[2]);
  const socialEl = footer.querySelector('.social');
  const socialParas = socialEl.querySelectorAll('p');
  const socailFrag = document.createDocumentFragment();
  Array.from(socialParas).forEach((p) => {
    const { textContent } = p;
    const domainName = extractDomain(textContent).toLowerCase();
    const holder = document.createElement('div');
    holder.classList.add('footer-social-icon-item-wrapper');
    holder.innerHTML = `<span class="icon icon-${domainName}"></span>`;
    socailFrag.appendChild(holder);
  });
  socialEl.innerHTML = '';
  socialEl.appendChild(socailFrag);
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
  const adChoice = copyRightWrapper.querySelector('a:last-child');
  if (adChoice?.text?.toLowerCase() === 'adchoices') {
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
  const cfg = readBlockConfig(block);
  block.textContent = '';

  // fetch footer content
  const footerPath = cfg.footer || 'http://127.0.0.1:5500/footer_footer';
  const resp = await fetch(
    `${footerPath}.plain.html`,
    window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {},
  );

  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;
    decorateMenu(footer);
    decorateSocial(footer);
    decorateBreadcrumb(footer);
    // decorateIcons(footer);
    block.append(footer);
    decorateCopyrightsMenu();
    decorateIcons(footer);
  }
}
