export function edgeHeaderOptions(headerBlock, options, variant, lang) {
  const fallback = headerBlock.parentElement?.querySelector(':scope > nav[data-exl-edge-nav]');
  if (!fallback) return options;
  const fragment = fallback?.querySelector(':scope > [data-exl-edge-fragment]');
  const authoredFragment = fragment?.cloneNode(true);
  authoredFragment?.querySelectorAll('a[data-exl-nav-href]').forEach((link) => {
    link.setAttribute('href', link.dataset.exlNavHref);
    link.removeAttribute('data-exl-nav-href');
  });
  return {
    ...options,
    edgeHeaderFallback: Boolean(fallback),
    edgeHeaderFragment:
      fallback?.dataset.variant === variant && fallback?.dataset.lang === lang
        ? authoredFragment?.innerHTML
        : undefined,
  };
}

export function mountHeader(headerBlock, component) {
  const fallback = headerBlock.parentElement?.querySelector(':scope > nav[data-exl-edge-nav]');
  if (fallback) {
    component.addEventListener('edge-header-ready', () => fallback.remove(), { once: true });
  }
  headerBlock.replaceChildren(component);
}

export function finishEdgeHeader(component, results) {
  const ready = results.every((result) => result.status === 'fulfilled') && results[1].value === true;
  results.forEach((result) => {
    if (result.status === 'rejected') {
      // eslint-disable-next-line no-console
      console.error('Header enhancement failed:', result.reason);
    }
  });
  component.style.display = component.decoratorOptions.edgeHeaderFallback && !ready ? 'none' : '';
  if (ready) component.dispatchEvent(new Event('edge-header-ready'));
}
