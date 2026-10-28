// Wires "add to quote" controls inside a container (catalog cards or the product page).
import * as quote from '../lib/quote-cart.js';
import { toast } from './toast.js';
import { esc, t } from '../lib/html.js';
import { plainName } from '../lib/products.js';

export function selectedIndex(scope) {
  const sel = scope.querySelector('[data-variant]:checked, select[data-variant]');
  return sel ? Number(sel.value) : 0;
}

export function bindAddToQuote(container, getProduct) {
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const scope = btn.closest('[data-id]');
    const p = getProduct(scope.dataset.id);
    if (!p) return;
    const v = p.variants[selectedIndex(scope)] || p.variants[0];
    const qtyInput = scope.querySelector('[data-qty]');
    const qty = Math.max(1, Math.floor(Number(qtyInput?.value) || 1));
    const variant = v.he === '—' ? '' : v.he;
    quote.add({ productId: p.id, model: plainName(p, 'he'), variant, sku: v.sku, qty });
    if (qtyInput) qtyInput.value = 1;
    toast(`✓ ${esc(plainName(p))}${variant ? ` · ${esc(variant)}` : ''} × ${qty} ${t('נוסף להצעת המחיר', 'added to your quote')}`,
      { link: { href: 'quote.html', label: t('לסל ←', 'View →') } });
  });
}
