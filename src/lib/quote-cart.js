// Quote cart ("סל הצעת מחיר") — persisted in localStorage, shared by all pages and tabs.
const KEY = 'led_quote_v1';
const EVT = 'quote:change';

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}
function write(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  document.dispatchEvent(new CustomEvent(EVT, { detail: { items } }));
}
const keyOf = (productId, variant) => `${productId}::${variant || ''}`;

export const items = () => read();
export const count = () => read().reduce((n, i) => n + i.qty, 0);

export function add({ productId, model, variant = '', sku = '', qty = 1 }) {
  if (!productId) throw new Error('productId required');
  qty = Math.max(1, Math.floor(Number(qty) || 1));
  const list = read();
  const ex = list.find(i => keyOf(i.productId, i.variant) === keyOf(productId, variant));
  if (ex) ex.qty += qty; else list.push({ productId, model, variant, sku, qty });
  write(list);
}
export function setQty(productId, variant, qty) {
  const list = read();
  const it = list.find(i => keyOf(i.productId, i.variant) === keyOf(productId, variant));
  if (!it) return;
  it.qty = Math.max(1, Math.floor(Number(qty) || 1));
  write(list);
}
export function remove(productId, variant) {
  write(read().filter(i => keyOf(i.productId, i.variant) !== keyOf(productId, variant)));
}
export function clear() { write([]); }

export function onChange(fn) {
  document.addEventListener(EVT, fn);
  window.addEventListener('storage', e => { if (e.key === KEY) fn(); }); // other tabs
}
