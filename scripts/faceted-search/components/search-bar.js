import { createTag } from '../../scripts.js';
import { decorateIcons } from '../../lib-franklin.js';

export default function createSearchBar({ store, prefix = 'fs', placeholders = {}, onInput = () => {} }) {
  const c = (name) => `${prefix}-${name}`;
  const abort = new AbortController();
  const { signal } = abort;
  const el = createTag('div', { class: c('keyword') });
  el.innerHTML = `
    <span class="icon icon-search-gray"></span>
    <input type="text" class="${c('keyword-input')}" placeholder="${placeholders.searchPlaceholder || 'Search'}"
           aria-label="${placeholders.searchPlaceholder || 'Search'}" />
    <span class="icon icon-clear ${c('keyword-clear')}" role="button" tabindex="0"
          aria-label="${placeholders.clearSearchLabel || 'Clear search'}"></span>`;
  decorateIcons(el);
  const input = el.querySelector('input');
  const clearIcon = el.querySelector(`.${c('keyword-clear')}`);
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
