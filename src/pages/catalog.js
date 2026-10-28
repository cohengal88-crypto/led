import '../styles/home.css';
import '../styles/shared.css';
import '../styles/catalog.css';
import { initHeader } from '../components/header.js';
import { data } from '../lib/data/index.js';
import { productCard } from '../components/product-card.js';
import { productArt } from '../components/product-art.js';
import { bindAddToQuote } from '../components/add-to-quote.js';
import { t } from '../lib/html.js';
import { norm, searchText, skuVariantIndex } from '../lib/products.js';

const PAGE = 24;
const grid = document.getElementById('catalog');
const search = document.getElementById('search');
const sort = document.getElementById('sort');
const filtersEl = document.getElementById('filters');
const label = document.getElementById('results-lbl');
const moreBtn = document.getElementById('more');

const params = new URLSearchParams(location.search);
let filter = params.get('cat') || 'all';
search.value = params.get('q') || '';
sort.value = ['sku', 'name', 'variants'].includes(params.get('sort')) ? params.get('sort') : 'sku';
let products = [], categories = [], shown = PAGE, results = [];
const haystack = new Map();

function compute() {
  const q = search.value.trim();
  const words = q.split(/\s+/).map(norm).filter(Boolean);
  const list = [];
  for (const p of products) {
    if (filter !== 'all' && p.type !== filter) continue;
    if (!words.length) { list.push({ p, sel: null }); continue; }
    const vi = skuVariantIndex(p, q);
    if (vi >= 0) list.push({ p, sel: vi });
    else if (words.every(w => haystack.get(p.id).includes(w))) list.push({ p, sel: null });
  }
  const by = {
    sku: (a, b) => a.p.skus[0].localeCompare(b.p.skus[0]),
    name: (a, b) => a.p.name.he.localeCompare(b.p.name.he, 'he'),
    variants: (a, b) => b.p.variants.length - a.p.variants.length,
  }[sort.value];
  return list.sort(by);
}

function renderFilters() {
  const total = products.length;
  filtersEl.innerHTML = [{ id: 'all', he: 'הכל', en: 'All', count: total }, ...categories]
    .map(c => `<button type="button" class="filter-pill" data-filter="${c.id}" aria-pressed="${c.id === filter}">${t(c.he, c.en)} <span class="pill-count">${c.count}</span></button>`).join('');
}

function render({ append = false } = {}) {
  const prevCount = append ? grid.querySelectorAll('[data-testid="product-card"]').length : 0;
  results = compute();
  const slice = results.slice(0, shown);
  if (!results.length) {
    grid.innerHTML = `<div class="no-results" data-testid="no-results">${t('לא נמצאו מוצרים.', 'No products found.')} <button type="button" class="filter-pill" data-reset>${t('נקו חיפוש וסינון', 'Clear search & filters')}</button></div>`;
  } else if (append) {
    grid.insertAdjacentHTML('beforeend', slice.slice(prevCount).map(r => productCard(r.p, r.sel)).join(''));
    grid.querySelectorAll('[data-testid="product-card"]')[prevCount]?.querySelector('[data-link]')?.focus();
  } else {
    grid.innerHTML = slice.map(r => productCard(r.p, r.sel)).join('');
  }
  label.innerHTML = results.length
    ? `${t('מציג', 'Showing')} ${slice.length} ${t('מתוך', 'of')} ${results.length} ${t('מוצרים', 'products')}`
    : '';
  moreBtn.hidden = slice.length >= results.length;
  moreBtn.innerHTML = `${t('הצג עוד מוצרים', 'Show more products')} (${results.length - slice.length})`;

  const url = new URL(location.href);
  filter === 'all' ? url.searchParams.delete('cat') : url.searchParams.set('cat', filter);
  search.value ? url.searchParams.set('q', search.value) : url.searchParams.delete('q');
  sort.value === 'sku' ? url.searchParams.delete('sort') : url.searchParams.set('sort', sort.value);
  history.replaceState(null, '', url);
}

const reset = () => { shown = PAGE; render(); };
filtersEl.addEventListener('click', e => {
  const b = e.target.closest('[data-filter]'); if (!b) return;
  filter = b.dataset.filter;
  filtersEl.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  reset();
});
let timer;
search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(reset, 120); });
sort.addEventListener('change', reset);
moreBtn.addEventListener('click', () => { shown += PAGE; render({ append: true }); });
grid.addEventListener('click', e => {
  if (!e.target.closest('[data-reset]')) return;
  filter = 'all'; search.value = ''; renderFilters(); reset(); search.focus();
});
// variant change → update art, SKU and link on the card
grid.addEventListener('change', e => {
  if (!e.target.matches('select[data-variant]')) return;
  const card = e.target.closest('[data-id]');
  const p = products.find(x => x.id === card.dataset.id);
  const v = p.variants[Number(e.target.value)];
  card.querySelector('[data-art]').innerHTML = productArt(p.type, v.hex);
  card.querySelector('[data-sku]').textContent = v.sku;
  const url = `product.html?id=${encodeURIComponent(p.id)}&sku=${v.sku}`;
  card.querySelectorAll('a[href^="product.html"]').forEach(a => { a.href = url; });
});
bindAddToQuote(grid, id => products.find(p => p.id === id));

initHeader();
const db = await data();
[products, categories] = await Promise.all([db.listProducts(), db.listCategories()]);
if (filter !== 'all' && !categories.some(c => c.id === filter)) filter = 'all';
products.forEach(p => haystack.set(p.id, searchText(p)));
document.querySelectorAll('[data-count-products]').forEach(el => { el.textContent = products.length; });
document.querySelectorAll('[data-count-skus]').forEach(el => { el.textContent = products.reduce((n, p) => n + p.variants.length, 0); });
renderFilters();
grid.removeAttribute('aria-busy');
render();
