import { htmlToElement } from '../../scripts.js';
import { normalizePage } from '../state/store.js';

export default function createPagination({ resultsPrefix = 'fs', labels = {}, onChange }) {
  const abort = new AbortController();
  const { signal } = abort;
  let currentPage = 1;
  let maxPage = 1;
  const el = htmlToElement(`
    <div class="fs-pagination">
      <button class="nav-arrow" type="button"></button>
      <input type="text" class="fs-pg-input" inputmode="numeric" value="1">
      <span class="fs-pagination-text"></span>
      <button class="nav-arrow right-nav-arrow" type="button"></button>
    </div>`);
  el.classList.add(`${resultsPrefix}-pagination`);
  const previous = el.querySelector('.nav-arrow');
  const input = el.querySelector('.fs-pg-input');
  const text = el.querySelector('.fs-pagination-text');
  const next = el.querySelector('.right-nav-arrow');
  previous.setAttribute('aria-label', labels.previous || 'previous page');
  input.classList.add(`${resultsPrefix}-pg-input`);
  input.setAttribute('aria-label', labels.pageInput || 'Enter page number');
  text.classList.add(`${resultsPrefix}-pagination-text`);
  next.setAttribute('aria-label', labels.next || 'next page');
  const select = (value) => {
    const page = normalizePage(value, maxPage);
    input.value = String(page ?? currentPage);
    if (page !== null && page !== currentPage) onChange(page);
  };
  previous.addEventListener('click', () => select(currentPage - 1), { signal });
  next.addEventListener('click', () => select(currentPage + 1), { signal });
  input.addEventListener('change', () => select(input.value), { signal });
  input.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        select(input.value);
      }
    },
    { signal },
  );
  return {
    el,
    update(page, pages) {
      currentPage = page;
      maxPage = Math.max(1, pages);
      input.value = String(page);
      const template = maxPage > 1 ? labels.pages : labels.page;
      text.textContent = template
        ? template.replace(/\$\{(?:pgCount|count)\}|\{\}|\{count\}/g, String(maxPage))
        : `of ${maxPage} ${maxPage > 1 ? 'pages' : 'page'}`;
      previous.disabled = page <= 1;
      next.disabled = page >= maxPage;
      previous.classList.toggle('nav-arrow-hidden', previous.disabled);
      next.classList.toggle('nav-arrow-hidden', next.disabled);
      el.classList.toggle(`${resultsPrefix}-pagination-hidden`, maxPage <= 1);
      el.classList.toggle('fs-pagination-hidden', maxPage <= 1);
    },
    destroy: () => abort.abort(),
  };
}
