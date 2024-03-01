const homeRegex = /^\/[^/]+\/docs\/home\/?$/g;

export default function decorate(block) {
  [...block.querySelectorAll('a')].forEach((a) => {
    // replace /docs/home with /docs - a one-off exception for breadcrumbs
    const href = a.getAttribute('href');
    if (homeRegex.test(href)) {
      a.href = a.href.replace('/docs/home', '/docs');
    }
  });
}
