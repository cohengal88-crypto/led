import '../styles/home.css';
import '../styles/shared.css';
import '../styles/catalog.css';
import { initHeader } from '../components/header.js';
import { data } from '../lib/data/index.js';
import { card } from '../components/product-sheet.js';
import { bindAddToQuote } from '../components/add-to-quote.js';
import { t } from '../lib/html.js';

const FILTERS = [
  { key: 'all', he: 'הכל', en: 'All' },
  { key: 'signage', he: 'שילוט', en: 'Signage' },
  { key: 'lightbox', he: 'תיבות אור', en: 'Lightbox' },
  { key: 'edge', he: 'תאורת קצה', en: 'Edge' },
  { key: 'jds', he: 'JDS', en: 'JDS' },
  { key: 'talent', he: 'Talent', en: 'Talent' },
];

const grid = document.getElementById('catalog');
const search = document.getElementById('search');
const filtersEl = document.getElementById('filters');
const label = document.getElementById('results-lbl');

const params = new URLSearchParams(location.search);
let filter = FILTERS.some(f => f.key === params.get('cat')) ? params.get('cat') : 'all';
search.value = params.get('q') || '';
let products = [];

filtersEl.innerHTML = FILTERS.map(f => `<button type="button" class="filter-pill" data-filter="${f.key}" aria-pressed="${f.key === filter}">${t(f.he, f.en)}</button>`).join('');

const norm = s => s.toLowerCase().replace(/[\s\-_/]+/g, '');
function matches(p) {
  const fOk = filter === 'all' || p.tags.includes(filter) || p.category.includes(filter);
  const q = norm(search.value);
  const hay = norm([p.model, p.name, p.series, p.brand, p.tagline, ...p.tags].join(' '));
  return fOk && (!q || hay.includes(q));
}

function render() {
  const list = products.filter(matches);
  grid.innerHTML = list.length
    ? list.map(card).join('')
    : `<div class="no-results" data-testid="no-results">${t('לא נמצאו מוצרים. נסו חיפוש אחר או', 'No products found. Try another search or')} <button type="button" class="filter-pill" data-reset>${t('נקו סינון', 'clear filters')}</button></div>`;
  label.innerHTML = `${list.length} ${t('מוצרים', 'products')}`;
  const url = new URL(location.href);
  url.searchParams.set('cat', filter); if (filter === 'all') url.searchParams.delete('cat');
  search.value ? url.searchParams.set('q', search.value) : url.searchParams.delete('q');
  history.replaceState(null, '', url);
}

filtersEl.addEventListener('click', e => {
  const b = e.target.closest('[data-filter]'); if (!b) return;
  filter = b.dataset.filter;
  filtersEl.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  render();
});
search.addEventListener('input', render);
grid.addEventListener('click', e => {
  if (!e.target.closest('[data-reset]')) return;
  filter = 'all'; search.value = '';
  filtersEl.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.filter === 'all')));
  render();
});
bindAddToQuote(grid, id => products.find(p => p.id === id));

initHeader();
const db = await data();
products = await db.listProducts();
document.querySelectorAll('[data-count-total]').forEach(el => { el.textContent = products.length; });
grid.removeAttribute('aria-busy');
render();
