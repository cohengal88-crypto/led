import '../styles/home.css';
import '../styles/shared.css';
import '../styles/catalog.css';
import { initHeader } from '../components/header.js';
import { data } from '../lib/data/index.js';
import { full } from '../components/product-sheet.js';
import { bindAddToQuote } from '../components/add-to-quote.js';
import { t } from '../lib/html.js';
import { packHint } from '../components/pack-hint.js';

const root = document.getElementById('product');
const id = new URLSearchParams(location.search).get('id');

initHeader();
const db = await data();
const p = id ? await db.getProduct(id) : null;
root.removeAttribute('aria-busy');

if (!p || p.published === false) {
  document.title = 'מוצר לא נמצא – LED IT BE';
  root.innerHTML = `<div class="not-found" data-testid="not-found"><h1>${t('המוצר לא נמצא', 'Product not found')}</h1><p><a href="catalog.html">${t('חזרה לקטלוג ←', '← Back to catalog')}</a></p></div>`;
} else {
  document.title = `${p.model} – ${p.series} | LED IT BE`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${p.model} – ${p.tagline}`);
  document.getElementById('crumb-model').textContent = p.model;
  root.innerHTML = full(p);
  bindAddToQuote(root, () => p);

  // ordering-guide rows ⇄ variant select
  const select = root.querySelector('[data-variant]');
  const rows = [...root.querySelectorAll('.ordering-table tbody tr')];
  const choose = i => {
    rows.forEach((r, j) => r.setAttribute('aria-selected', String(j === i)));
    if (select) select.value = String(i);
  };
  rows.forEach((r, i) => {
    r.addEventListener('click', () => choose(i));
    r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(i); } });
  });
  select?.addEventListener('change', () => choose(Number(select.value)));

  // packaging hint follows the quantity field
  const qty = root.querySelector('.buy-box [data-qty]');
  const pack = root.querySelector('[data-pack]');
  const renderPack = () => { pack.innerHTML = packHint(p, Math.max(1, Number(qty.value) || 1)); };
  qty.addEventListener('input', renderPack);
  pack.addEventListener('click', e => { const r = e.target.closest('[data-round]'); if (r) { qty.value = r.dataset.round; renderPack(); } });
  root.addEventListener('click', e => { if (e.target.closest('[data-add]')) setTimeout(renderPack); });
  renderPack();
}
