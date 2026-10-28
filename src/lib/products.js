// Helpers for the product data model (see scripts/import-products.py).
import { t, esc } from './html.js';

export const name = p => (p.name.en ? t(esc(p.name.he), esc(p.name.en)) : esc(p.name.he));
export const plainName = (p, lang = document.documentElement.lang) => (lang === 'en' && p.name.en) || p.name.he;
export const variantLabel = (v, lang = document.documentElement.lang) => (lang === 'en' ? v.en : v.he);
export const variantName = v => (v.he === '—' ? '' : (v.en && v.en !== v.he ? t(esc(v.he), esc(v.en)) : esc(v.he)));

export function skuRange(p) {
  const s = p.skus;
  return s.length === 1 ? s[0] : `${s[0]}–${s[s.length - 1]}`;
}

/** Normalise for forgiving search: lowercase, no spaces/dashes/quotes, unify ×/x. */
export const norm = s => String(s).toLowerCase().replace(/[×x]/g, 'x').replace(/[\s\-_/'"״׳.,:()]+/g, '');

export function searchText(p) {
  return norm([p.name.he, p.name.en, ...p.skus, ...p.variants.flatMap(v => [v.he, v.en, v.source])].join(' '));
}

/** If the query is (the start of) a SKU, return the index of the matching variant. */
export function skuVariantIndex(p, q) {
  const d = String(q).trim();
  if (!/^\d{3,}$/.test(d)) return -1;
  return p.variants.findIndex(v => v.sku.startsWith(d));
}
