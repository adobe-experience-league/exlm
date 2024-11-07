import { getPathDetails } from '../scripts.js';

export const removeExtension = (pathStr) => {
  const parts = pathStr.split('.');
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join('.');
};

export function rewriteDocsPath(docsPath) {
  const PROD_BASE = 'https://experienceleague.adobe.com';
  const url = new URL(docsPath, PROD_BASE);
  if (!url.pathname.startsWith('/docs') || url.pathname.startsWith('/docs/courses/')) {
    return docsPath; // not a docs path, return as is
  }
  // eslint-disable-next-line no-use-before-define
  const { lang } = getPathDetails();
  const language = url.searchParams.get('lang') || lang;
  url.searchParams.delete('lang');
  let pathname = `${language.toLowerCase()}${url.pathname}`;
  pathname = removeExtension(pathname); // new URLs are extensionless
  url.pathname = pathname;
  return url.toString().replace(PROD_BASE, ''); // always remove PROD_BASE if exists
}
