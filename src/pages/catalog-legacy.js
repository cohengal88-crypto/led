// TEMPORARY (stage 1): bridges the old catalog markup to the shared quote cart.
// Replaced by a data-driven catalog in stage 2.
import '../styles/shared.css';
import * as quote from '../lib/quote-cart.js';

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function render() {
  const list = quote.items();
  const total = quote.count();
  document.getElementById('cart-count').textContent = total;
  document.getElementById('cart-total').textContent = `${total} פריטים`;
  const el = document.getElementById('cart-list');
  el.innerHTML = list.length
    ? list.map((it, i) => `<div class="ci"><div class="ci-body">
        <div class="ci-name">${esc(it.model)}</div><div class="ci-spec">${esc(it.variant)}</div>
        <div class="ci-qty"><button class="qb" data-i="${i}" data-d="-1" aria-label="הפחת">−</button>
        <span class="qv">${it.qty}</span><button class="qb" data-i="${i}" data-d="1" aria-label="הוסף">+</button></div>
      </div><button class="ci-rm" data-rm="${i}" aria-label="הסר">✕</button></div>`).join('')
    : '<div class="cart-empty">הסל ריק</div>';
}

document.getElementById('cart-list').addEventListener('click', e => {
  const list = quote.items();
  const q = e.target.closest('[data-d]'); const r = e.target.closest('[data-rm]');
  if (q) { const it = list[q.dataset.i]; quote.setQty(it.productId, it.variant, it.qty + Number(q.dataset.d)); }
  if (r) { const it = list[r.dataset.rm]; quote.remove(it.productId, it.variant); }
});

window.addToCart = (name, spec) => {
  quote.add({ productId: slug(name), model: name, variant: spec, qty: 1 });
  window.showToast?.(`✓ <span>${esc(name)}</span> נוסף לסל הצעת המחיר`);
};
window.sendQuote = () => { location.href = 'quote.html'; };

// customer login is gone in the new model
document.getElementById('nav-portal-link')?.remove();
document.getElementById('nav-user-chip')?.remove();

quote.onChange(render);
render();
