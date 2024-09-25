/**
 * clone the provided script, which maybe marked as "unexecutable", to a new script to execute it.
 * @param {HTMLScriptElement} oldScript
 */
function executeScript(oldScript) {
  const newScript = document.createElement('script');
  if (oldScript.src) {
    newScript.src = oldScript.src;
    newScript.type = oldScript.type || 'text/javascript';
  } else {
    newScript.textContent = oldScript.textContent;
  }
  document.head.appendChild(newScript);
}

/**
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const props = [...block.children].map((row) => row.firstElementChild);
  const htmlIndexUrl = props[0]?.textContent;

  // fetch + parse the html
  const response = await fetch(htmlIndexUrl);
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const { body, head } = doc;

  // clear block
  block.innerHTML = '';

  const appDiv = document.createElement('div');
  // copy all attributes on body to block
  // eslint-disable-next-line no-restricted-syntax
  for (const { name, value } of body.attributes) {
    appDiv.setAttribute(name, value);
  }
  // add everything in main to the block, allow declarative shadow roots.
  block.setHTMLUnsafe(body.querySelector('main').innerHTML);

  // append everything in the head to the document head
  [...head.children].forEach((child) => {
    if (child.tagName === 'SCRIPT') executeScript(child);
    else document.head.appendChild(child);
  });
}
