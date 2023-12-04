import { decorateIcons } from '../../scripts/lib-franklin.js';
import { redirectToSearchPage } from '../../scripts/search/search.js';

export default function decorate(block) {
  const heading = block.children[0].textContent.trim();
  const placeholder = block.children[1].textContent.trim();

  const search = `
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
  </form>`;

  block.innerHTML = search;
  decorateIcons(block);

  const searchInput = block.querySelector('#secondary-search');
  const searchIcon = block.querySelector('.icon-search');

  searchIcon?.addEventListener('click', (e) => {
    e.preventDefault();
    const SearchInputValue = searchInput?.value.trim();
    redirectToSearchPage(SearchInputValue);
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const SearchInputValue = searchInput?.value.trim();
      redirectToSearchPage(SearchInputValue);
    }
  });
}
