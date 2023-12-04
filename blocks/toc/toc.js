// FIXME: Revisit this implementation. This is only a temp example untill we get a TOC API from the EXL team.
const CONFIG = {
  basePath: '/fragments/en',
  tocPath: '/toc/toc.plain.html',
};

// Utility function for http call
const getHTMLData = async (url) => {
  const response = await fetch(url);
  if (response.ok) {
    const responseData = response.text();
    return responseData;
  }
  throw new Error(`${url} not found`);
};

function decorateMenu(toc) {
  const childElements = toc.querySelectorAll('.toc-menu');
  const groupDiv = document.createElement('div');
  groupDiv.classList.add('toc-menu');
  childElements.forEach((child) => {
    const h2Elements = Array.from(child.querySelectorAll('h2'));
    const ulElements = Array.from(child.querySelectorAll('ul'));
    const divWrapper = document.createElement('div');
    if (h2Elements.length > 0 && ulElements.length > 0) {
      h2Elements.forEach((h2Element, index) => {
        const divPair = document.createElement('div');
        divPair.appendChild(h2Element);
        divPair.appendChild(ulElements[index]);
        divWrapper.appendChild(divPair);
      });
    }
    child.innerHTML = divWrapper.innerHTML;
    groupDiv.appendChild(child);
  });
  const elem = toc.children[0];
  elem.insertBefore(groupDiv, elem.children[1]);
}

/**
 * loads and decorates the toc
 * @param {Element} block The toc block element
 */
export default async function decorate(block) {
  // fetch toc content
  const tocPath = `${CONFIG.basePath}${CONFIG.tocPath}`;
  const resp = await getHTMLData(tocPath);

  if (resp) {
    const html = resp;

    // decorate TOC DOM
    const toc = document.querySelector('.toc');
    toc.innerHTML = html;
    decorateMenu(toc);
    block.append(toc);
  }
}
