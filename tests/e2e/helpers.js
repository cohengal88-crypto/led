// Collect JS errors on a page, ignoring external font failures.
export function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_NAME|ERR_INTERNET/.test(m.text())) errors.push(m.text());
  });
  return errors;
}
export const PAGES = [
  { path: '/', title: /LED IT BE/ },
  { path: '/catalog.html', title: /קטלוג/ },
  { path: '/product.html?id=pixel-12001', title: /לד נעיצה 9/ },
  { path: '/quote.html', title: /הצעת מחיר/ },
];
