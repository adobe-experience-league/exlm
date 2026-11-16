import { createTag } from '../../scripts.js';

export default function createResults({ prefix = 'fs', labels = {}, createLoading, onClear, classes = {} }) {
  const body = createTag('div', { class: `${prefix}-results-body ${classes.body || ''}`.trim() });
  const empty = createTag('div', { class: `${prefix}-no-results`, hidden: '', role: 'status', 'aria-live': 'polite' });
  const grid = createTag('div', { class: `${prefix}-results-grid ${classes.grid || ''}`.trim() });
  const error = createTag('div', { class: 'fs-search-error', hidden: '', role: 'alert' });
  const loading = createLoading?.();
  let isLoading = false;
  body.append(empty, grid, error);
  return {
    body,
    grid,
    setLoading(value) {
      if (isLoading === value) return;
      isLoading = value;
      body.setAttribute('aria-busy', String(value));
      grid.style.display = value ? 'none' : '';
      if (value) {
        empty.hidden = true;
        error.hidden = true;
        loading?.addShimmer(body);
        const shimmer = body.querySelector(':scope > .browse-card-shimmer');
        if (shimmer) body.insertBefore(shimmer, grid);
      } else {
        loading?.removeShimmer();
      }
    },
    showEmpty(keyword) {
      empty.replaceChildren();
      const message = createTag('p', { class: `${prefix}-no-results-message` });
      if (keyword) {
        const term = createTag('strong');
        term.textContent = `"${keyword}"`;
        message.append(`${labels.noResultsPrefix || 'Sorry, no results were found for'} `, term);
      } else {
        message.textContent = labels.noResults || 'Sorry, no results were found.';
      }
      const clear = createTag('a', { href: '#', class: `${prefix}-no-results-clear` });
      clear.textContent = labels.clearSearch || 'Clear search';
      clear.addEventListener('click', (e) => {
        e.preventDefault();
        onClear();
      });
      empty.append(message, clear);
      empty.hidden = isLoading;
      grid.hidden = true;
    },
    showItems(fragment) {
      grid.replaceChildren(fragment);
      grid.hidden = false;
      empty.hidden = true;
      error.hidden = true;
      if (classes.grid) grid.classList.add(...classes.grid.split(' '));
    },
    showError() {
      this.setLoading(false);
      empty.hidden = true;
      grid.hidden = true;
      error.textContent = labels.error || 'Search could not be loaded. Please try again.';
      error.hidden = false;
    },
    destroy() {
      loading?.removeShimmer();
    },
  };
}
