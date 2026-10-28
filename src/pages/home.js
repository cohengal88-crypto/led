import '../styles/site.css';
import { initHeader } from '../components/header.js';
import { productArt } from '../components/product-art.js';
import { data } from '../lib/data/index.js';
import { validateForm, liveValidate, normalizePhone } from '../lib/validate.js';
import { getCustomer, saveCustomer } from '../lib/customer-memory.js';
import { notifyByEmail } from '../lib/notify.js';
import { esc, t } from '../lib/html.js';

initHeader();

// ── illustrations ──
document.querySelectorAll('[data-art]').forEach(el => {
  el.outerHTML = productArt(el.dataset.art, el.dataset.hex || null, { callouts: 'callouts' in el.dataset });
});

// ── contact form ──
const form = document.getElementById('contact-form');
const REQUIRED = ['name', 'phone', 'email', 'message'];
const known = getCustomer();
if (known) for (const f of ['name', 'phone', 'email', 'company']) if (known[f]) form.elements[f].value = known[f];
liveValidate(form, REQUIRED);
form.dataset.ready = '';

form.addEventListener('submit', async e => {
  e.preventDefault();
  const err = document.getElementById('c-error');
  err.textContent = '';
  const invalid = validateForm(form, REQUIRED);
  if (invalid) { invalid.focus(); return; }
  const done = () => { form.hidden = true; const d = document.getElementById('contact-done'); d.hidden = false; d.focus(); };
  if (form.elements.website.value) { done(); return; } // spam trap

  const v = Object.fromEntries(['name', 'phone', 'email', 'company', 'message'].map(f => [f, form.elements[f].value.trim()]));
  const btn = document.getElementById('c-submit');
  btn.disabled = true;
  try {
    const db = await data();
    await db.createContactMessage({ ...v, phone: normalizePhone(v.phone), email: v.email.toLowerCase(), lang: document.documentElement.lang });
    await notifyByEmail({ subject: `פנייה מהאתר – ${v.company || v.name}`, fields: { 'שם': v.name, 'חברה': v.company || '—', 'טלפון': v.phone, email: v.email, 'הודעה': v.message } });
    saveCustomer({ ...known, ...v });
    done();
  } catch (e2) {
    console.error(e2);
    err.innerHTML = t('משהו השתבש. נסו שוב או התקשרו אלינו.', 'Something went wrong. Please try again or call us.');
  } finally {
    btn.disabled = false;
  }
});

// ── categories + counts from the data ──
const db = await data();
const [products, categories] = await Promise.all([db.listProducts(), db.listCategories()]);
document.querySelectorAll('[data-count-products]').forEach(el => { el.textContent = products.length; });
document.querySelectorAll('[data-count-skus]').forEach(el => { el.textContent = products.reduce((n, p) => n + p.variants.length, 0); });
const SAMPLE_HEX = { modules: '#f4f8ff', bars: '#fff1d6', strips: '#ffd27a', neon: '#ff6a3d', pixel: 'rgb', controllers: 'rgb' };
document.getElementById('cat-grid').innerHTML = categories.map(c => {
  const skus = products.filter(p => p.type === c.id).flatMap(p => p.skus).sort();
  const range = !skus.length ? '' : skus.length === 1 ? skus[0] : `${skus[0]}–${skus.at(-1)}`;
  return `<a class="cat-card" href="catalog.html?cat=${encodeURIComponent(c.id)}">
    <span class="cat-art" aria-hidden="true">${productArt(c.id, SAMPLE_HEX[c.id] || null)}</span>
    <h3>${t(esc(c.he), esc(c.en))}</h3>
    <p>${c.count} ${t('מוצרים', 'products')}${range ? ` · ${t('מק״ט', 'SKU')} <span dir="ltr">${esc(range)}</span>` : ''}</p>
  </a>`;
}).join('') + `<a class="cat-card cat-card--all" href="catalog.html"><h3>${t('לכל', 'All')} ${products.length} ${t('המוצרים', 'products')}</h3><p>${t('חיפוש, סינון ובחירת גרסה', 'Search, filter and pick a version')}</p></a>`;
