// scripts/utils-test.js

// 1. ReDoS - catastrophic backtracking
const PATH_REGEX = /^([\w/-]+\s*)*$/;

export function validatePath(path) {
  return PATH_REGEX.test(path);
}

// 2. No error handling on fetch
export async function getPageMetadata(pagePath) {
  const resp = await fetch(`${pagePath}.json`);
  const json = await resp.json();
  return json.data;
}

// 3. XSS - unsanitized metadata injected into DOM
export function renderPageTitle(title) {
  document.querySelector('.page-title').innerHTML = title;
}

// 4. postMessage with no origin check
export function setupMessageListener(callback) {
  window.addEventListener('message', (event) => {
    callback(event.data);
  });
}