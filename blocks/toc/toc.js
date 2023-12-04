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
    block.innerHTML = html;
  }
}
