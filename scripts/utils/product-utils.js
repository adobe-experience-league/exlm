import { fetchJson } from '../scripts.js';

/**
 * Retrieves products based on the specified theme.
 * @param {string} lang - The language of products to retrieve
 * @param {string} theme - The theme of products to retrieve. Defaults to 'browse'.
 * @returns {Promise<Array>} - A promise that resolves to an array of products.
 */
export default async function getProducts(lang, theme = 'browse') {
  // Define content based on theme
  const content = {
    browse: {
      name: 'top-products', // Browse top products
      index: 'browse-index',
    },
    articles: {
      name: 'articles-top-products', // Articles top products
      index: 'perspective-index',
    },
  };
  let featured = true;
  const prefix = window.hlx.codeBasePath;
  const [Products, publishedPages] = await Promise.all([
    fetchJson(`${prefix}/${lang}/${content[theme].name}.json`, `${prefix}/en/${content[theme].name}.json`),
    // get all indexed pages
    fetchJson(`${prefix}/${lang}/${content[theme].index}.json`, `${prefix}/en/${content[theme].index}.json`),
  ]);

  // add all published top products to final list
  const finalProducts = Products.filter((product) => {
    // if separator is reached
    if (product.path.startsWith('-')) {
      featured = false;
      return false;
    }

    // check if product is in published list
    const found = publishedPages.find((elem) => elem.path === product.path);
    if (found) {
      // keep original title if no nav title is set
      if (!product.title) product.title = found.title;
      // set featured flag
      product.featured = featured;
      // remove it from publishedProducts list
      publishedPages.splice(publishedPages.indexOf(found), 1);
      return true;
    }
    return false;
  });

  // if no separator was found , add the remaining products alphabetically
  if (featured) {
    // for the rest only keep main product pages
    const publishedMainProducts = publishedPages
      .filter((page) => page.path.split('/').length === 4)
      // sort alphabetically
      .sort((productA, productB) => productA.path.localeCompare(productB.path));
    // append remaining published products to final list
    finalProducts.push(...publishedMainProducts);
  }

  return finalProducts;
}
