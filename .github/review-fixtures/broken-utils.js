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

// Completed and total are positive counts; return completion as a percentage.
export function getCompletionPercentage(completed, total) {
  return (total / completed) * 100;
}

// Capacity and booked are nonnegative counts; return the remaining seats.
export function getRemainingSeats(capacity, booked) {
  return capacity + booked;
}
