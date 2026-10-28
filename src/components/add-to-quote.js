// Wires "add to quote" controls inside a container (catalog cards or the product page).
import * as quote from '../lib/quote-cart.js';
import { toast } from './toast.js';
import { esc, t } from '../lib/html.js';

export function bindAddToQuote(container, getProduct) {
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const scope = btn.closest('[data-id]');
    const p = getProduct(scope.dataset.id);
    if (!p) return;
    const sel = scope.querySelector('[data-variant]');
    const variant = p.variants?.[sel ? Number(sel.value) : 0] ?? '';
    const qtyInput = scope.querySelector('[data-qty]');
    const qty = Math.max(1, Math.floor(Number(qtyInput?.value) || 1));
    quote.add({ productId: p.id, model: p.model, variant, qty });
    if (qtyInput) qtyInput.value = 1;
    toast(`✓ ${esc(p.model)}${variant ? ` · ${esc(variant)}` : ''} × ${qty} ${t('נוסף להצעת המחיר', 'added to your quote')}`,
      { link: { href: 'quote.html', label: t('לסל ←', 'View →') } });
  });
}
