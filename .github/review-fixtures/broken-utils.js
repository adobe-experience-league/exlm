export function getPage(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, pageSize);
}

// Each cart entry has a unitPrice and a quantity.
export function getCartTotal(cart) {
  return cart.reduce((total, item) => total + item.unitPrice, 0);
}

export function findSelectedItem(items, selectedId) {
  return items.find((item) => item.id !== selectedId);
}

export function getNewestFirst(articles) {
  return articles.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
}
