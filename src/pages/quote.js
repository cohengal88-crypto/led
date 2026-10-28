import '../styles/home.css';
import '../styles/shared.css';
import '../styles/quote.css';
import { initHeader } from '../components/header.js';
import * as quote from '../lib/quote-cart.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const list = document.getElementById('quote-list');

function render() {
  const items = quote.items();
  if (!items.length) {
    list.innerHTML = `<div class="q-empty" data-testid="quote-empty">הסל ריק. <a href="catalog.html">לקטלוג המוצרים</a></div>`;
    return;
  }
  list.innerHTML = items.map((it, i) => `
    <div class="q-item" data-testid="quote-item" data-i="${i}">
      <div><div class="q-model">${esc(it.model)}</div><div class="q-variant">${esc(it.variant)}</div></div>
      <div class="q-qty">
        <button type="button" data-d="-1" aria-label="הפחת כמות">−</button>
        <input type="number" min="1" inputmode="numeric" value="${it.qty}" aria-label="כמות ${esc(it.model)}">
        <button type="button" data-d="1" aria-label="הוסף כמות">+</button>
      </div>
      <button type="button" class="q-remove" data-rm aria-label="הסר ${esc(it.model)}">הסר</button>
    </div>`).join('');
}

list.addEventListener('click', e => {
  const row = e.target.closest('[data-i]'); if (!row) return;
  const it = quote.items()[row.dataset.i];
  if (e.target.closest('[data-d]')) quote.setQty(it.productId, it.variant, it.qty + Number(e.target.closest('[data-d]').dataset.d));
  if (e.target.closest('[data-rm]')) quote.remove(it.productId, it.variant);
});
list.addEventListener('change', e => {
  if (!e.target.matches('input')) return;
  const it = quote.items()[e.target.closest('[data-i]').dataset.i];
  quote.setQty(it.productId, it.variant, e.target.value);
});

initHeader();
quote.onChange(render);
render();
