import { createTag } from '../../scripts.js';
import { normalizePage } from '../state/store.js';

export default function createPagination({ prefix = 'fs', labels = {}, onChange }) {
  const abort = new AbortController();
  const { signal } = abort;
  let currentPage = 1;
  let maxPage = 1;
  const el = createTag('div', { class: `fs-pagination ${prefix}-pagination` });
  const previous = createTag('button', {
    class: 'nav-arrow',
    type: 'button',
    'aria-label': labels.previous || 'previous page',
  });
  const input = createTag('input', {
    type: 'text',
    class: `fs-pg-input ${prefix}-pg-input`,
    inputmode: 'numeric',
    'aria-label': labels.pageInput || 'Enter page number',
    value: '1',
  });
  const text = createTag('span', { class: `fs-pagination-text ${prefix}-pagination-text` });
  const next = createTag('button', {
    class: 'nav-arrow right-nav-arrow',
    type: 'button',
    'aria-label': labels.next || 'next page',
  });
  el.append(previous, input, text, next);
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
      el.classList.toggle(`${prefix}-pagination-hidden`, maxPage <= 1);
      el.classList.toggle('fs-pagination-hidden', maxPage <= 1);
    },
    destroy: () => abort.abort(),
  };
}
