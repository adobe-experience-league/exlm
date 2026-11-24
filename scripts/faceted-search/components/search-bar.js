import { htmlToElement } from '../../scripts.js';
import { decorateIcons } from '../../lib-franklin.js';

export default function createSearchBar({ store, placeholders = {}, onInput = () => {} }) {
  const c = (name) => `fs-${name}`;
  const abort = new AbortController();
  const { signal } = abort;
  const el = htmlToElement(`
    <div class="fs-keyword">
      <span class="icon icon-search-gray"></span>
      <input type="text" class="fs-keyword-input">
      <span class="icon icon-clear fs-keyword-clear" role="button" tabindex="0"></span>
    </div>`);
  const input = el.querySelector('input');
  const clearIcon = el.querySelector(`.${c('keyword-clear')}`);
  input.placeholder = placeholders.searchPlaceholder || 'Search';
  input.setAttribute('aria-label', input.placeholder);
  clearIcon.setAttribute('aria-label', placeholders.clearSearchLabel || 'Clear search');
  decorateIcons(el);
  const submit = () => store.setKeyword(input.value);
  input.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    },
    { signal },
  );
  input.addEventListener(
    'input',
    () => {
      clearIcon.classList.toggle('is-visible', Boolean(input.value));
      onInput();
      if (!input.value) submit();
    },
    { signal },
  );
  el.querySelector('.icon-search-gray').addEventListener('click', submit, { signal });
  const clear = () => {
    input.value = '';
    clearIcon.classList.remove('is-visible');
    submit();
    onInput();
    input.focus();
  };
  clearIcon.addEventListener('click', clear, { signal });
  clearIcon.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        clear();
      }
    },
    { signal },
  );
  return { el, input, destroy: () => abort.abort() };
}
