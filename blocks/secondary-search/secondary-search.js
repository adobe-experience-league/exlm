import { decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement, getConfig } from '../../scripts/scripts.js';
import { redirectToSearchPage } from '../../scripts/search/search.js';

const { fallBackSearchUrl } = getConfig();

function redirectTo(searchUrl, inputElement, event) {
  event.preventDefault();
  const searchInputValue = inputElement?.value.trim();
  redirectToSearchPage(searchUrl, searchInputValue);
}

export default function decorate(block) {
  const [heading, placeholder, searchLink] = [...block.children].map((row) => row.firstElementChild);

  if (heading.firstElementChild) {
    const label = document.createElement('label');
    label.setAttribute('for', 'secondary-search');
    label.append(...heading.firstElementChild.childNodes);
    heading.firstElementChild.replaceChildren(label);
  }

  const search = `
  <div>
    ${heading.innerHTML}
    <form role="search">
      <button title="Search Icon" type="submit"><span class="icon icon-search"></button>
      <input
      autocomplete="off"
      type="search"
      role="searchbox"
      id="secondary-search"
      value=""
      placeholder="${placeholder.textContent.trim()}" 
      />
    </form>
  </div>`;

  block.innerHTML = '';
  block.append(htmlToElement(search));
  decorateIcons(block);

  const searchInput = block.querySelector('#secondary-search');
  const searchIcon = block.querySelector('.icon-search');

  const searchRedirectUrl = searchLink || fallBackSearchUrl;
  searchIcon?.addEventListener('click', (e) => {
    redirectTo(searchRedirectUrl, searchInput, e);
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'Enter') {
      redirectTo(searchRedirectUrl, searchInput, e);
    }
  });
}
