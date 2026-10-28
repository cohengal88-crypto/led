// Compact catalog card: art, name, SKU, key specs, colour swatches, variant + qty + add.
import { esc, t } from '../lib/html.js';
import { name, skuRange } from '../lib/products.js';
import { productArt, swatch } from './product-art.js';

const KEY_SPECS = ['Voltage', 'Power', 'Ingress protection', 'Profile (mm)', 'LEDs per meter'];
const MAX_SW = 12;

export function variantOptions(p, selected = 0) {
  return p.variants.map((v, i) => `<option value="${i}"${i === selected ? ' selected' : ''}>${esc(v.he === '—' ? v.sku : v.he)} · מק"ט ${esc(v.sku)}</option>`).join('');
}

/** selected: index of a pre-selected variant (e.g. from a SKU search), or null for none. */
export function productCard(p, selected = null) {
  const v = p.variants[selected ?? 0] || p.variants[0];
  const url = `product.html?id=${encodeURIComponent(p.id)}${selected != null ? `&sku=${v.sku}` : ''}`;
  const specs = p.specs.filter(s => KEY_SPECS.includes(s.en)).slice(0, 3);
  const many = p.variants.length > 1;
  const hasColors = p.variants.some(x => x.hex);
  return `
  <article class="p-card" data-id="${esc(p.id)}" data-testid="product-card" aria-labelledby="pc-${esc(p.id)}">
    <a class="p-card-art" href="${url}" tabindex="-1" aria-hidden="true" data-art>${productArt(p.type, v.hex)}</a>
    <div class="p-card-body">
      <h2 class="p-card-name" id="pc-${esc(p.id)}"><a href="${url}" data-link>${name(p)}</a></h2>
      <div class="p-card-sku"><span class="he-text t-in">מק"ט</span><span class="en-text t-in">SKU</span> <span data-sku dir="ltr">${many && selected == null ? esc(skuRange(p)) : esc(v.sku)}</span></div>
      ${specs.length ? `<ul class="p-card-specs" aria-label="מפרט עיקרי">${specs.map(s => `<li dir="ltr">${esc(s.value)}</li>`).join('')}</ul>` : ''}
      ${many && hasColors ? `<div class="p-card-sw" aria-hidden="true">${p.variants.slice(0, MAX_SW).map(x => swatch(x.hex)).join('')}${p.variants.length > MAX_SW ? `<span class="sw-more">+${p.variants.length - MAX_SW}</span>` : ''}</div>
        <div class="p-card-count">${p.variants.length} ${t('גרסאות', 'variants')}</div>` : ''}
    </div>
    <div class="p-card-actions">
      ${many ? `<label class="sr-only" for="v-${esc(p.id)}">${t('בחירת גרסה', 'Choose variant')} – ${esc(p.name.he)}</label>
        <select id="v-${esc(p.id)}" class="p-select" data-variant>${variantOptions(p, selected ?? 0)}</select>` : ''}
      <div class="p-buy">
        <label class="sr-only" for="q-${esc(p.id)}">${t('כמות', 'Quantity')} – ${esc(p.name.he)}</label>
        <input id="q-${esc(p.id)}" class="p-qty" type="number" min="1" value="1" inputmode="numeric" data-qty>
        <button type="button" class="p-add" data-add>${t('+ להצעת מחיר', '+ Add to quote')}</button>
      </div>
    </div>
  </article>`;
}
