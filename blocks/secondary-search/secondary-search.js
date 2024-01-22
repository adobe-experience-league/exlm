import { decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { redirectToSearchPage } from '../../scripts/search/search.js';

function redirectTo(inputElement, event) {
  event.preventDefault();
  const SearchInputValue = inputElement?.value.trim();
  redirectToSearchPage(SearchInputValue);
}

export default function decorate(block) {
  const heading = block.children[0].textContent.trim();
  const placeholder = block.children[1].textContent.trim();

  const search = `
  <div>
    <h2><label for="secondary-search">${heading}</label></h2>
    <form role="search">
      <button title="Search Icon" type="submit"><span class="icon icon-search"></button>
      <input
      autocomplete="off"
      type="search"
      role="searchbox"
      id="secondary-search"
      value=""
      placeholder="${placeholder}" 
      />
    </form>
  </div>`;

  block.innerHTML = '';
  block.append(htmlToElement(search));
  decorateIcons(block);

  const searchInput = block.querySelector('#secondary-search');
  const searchIcon = block.querySelector('.icon-search');

  searchIcon?.addEventListener('click', (e) => {
    redirectTo(searchInput, e);
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'Enter') {
      redirectTo(searchInput, e);
    }
  });
}
