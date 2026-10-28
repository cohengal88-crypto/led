// Packaging units from product data, e.g. Bag 100 pcs, Box 2500 pcs.
const UNITS = [
  { key: /^bag$/i, he: 'שקית', en: 'bag' },
  { key: /^(box|carton)$/i, he: 'קרטון', en: 'box' },
];

export function packUnits(product) {
  const out = [];
  for (const u of UNITS) {
    const row = (product?.packaging || []).find(p => u.key.test(p.label));
    const m = row && /^([\d,]+)\s*pcs$/i.exec(row.value.trim());
    if (m) out.push({ he: u.he, en: u.en, size: Number(m[1].replace(/,/g, '')) });
  }
  return out.sort((a, b) => a.size - b.size);
}

/** Suggest rounding up to the smallest pack, if qty isn't already a whole number of packs. */
export function roundingSuggestion(product, qty) {
  const [small] = packUnits(product);
  if (!small || qty <= 0 || qty % small.size === 0) return null;
  const packs = Math.ceil(qty / small.size);
  return { qty: packs * small.size, packs, unit: small };
}

export const fmt = n => n.toLocaleString('en-US');
