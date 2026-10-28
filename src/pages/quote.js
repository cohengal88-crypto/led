import '../styles/site.css';
import '../styles/quote.css';
import { initHeader } from '../components/header.js';
import * as quote from '../lib/quote-cart.js';
import { data } from '../lib/data/index.js';
import { esc, t } from '../lib/html.js';
import { packHint } from '../components/pack-hint.js';
import { validateForm, liveValidate, normalizePhone } from '../lib/validate.js';
import { restoreInto, formValues, saveDraft, clearDraft, saveCustomer, forgetCustomer, CUSTOMER_FIELDS } from '../lib/customer-memory.js';
import { notifyByEmail, quoteEmail, emailEnabled } from '../lib/notify.js';

const list = document.getElementById('quote-list');
const form = document.getElementById('quote-form');
const submitBtn = document.getElementById('submit-btn');
const formError = document.getElementById('form-error');
const REQUIRED = ['name', 'phone', 'email'];
let products = new Map();

// ── items ──
function render() {
  const items = quote.items();
  form.hidden = items.length === 0;
  if (!items.length) {
    list.innerHTML = `<div class="q-empty" data-testid="quote-empty">${t('הסל ריק.', 'Your quote list is empty.')} <a href="catalog.html">${t('לקטלוג המוצרים', 'Browse the catalog')}</a></div>`;
    return;
  }
  list.innerHTML = items.map((it, i) => {
    const p = products.get(it.productId);
    return `
    <div class="q-item" data-testid="quote-item" data-i="${i}">
      <div><div class="q-model"><a href="product.html?id=${encodeURIComponent(it.productId)}${it.sku ? `&sku=${it.sku}` : ''}">${esc(it.model)}</a></div><div class="q-variant">${it.variant ? `${esc(it.variant)} · ` : ''}${it.sku ? `<span dir="ltr">${t('מק"ט', 'SKU')} ${esc(it.sku)}</span>` : ''}</div></div>
      <div class="q-qty">
        <button type="button" data-d="-1" aria-label="הפחת כמות">−</button>
        <input type="number" min="1" inputmode="numeric" value="${it.qty}" aria-label="כמות ${esc(it.model)}">
        <button type="button" data-d="1" aria-label="הוסף כמות">+</button>
      </div>
      <button type="button" class="q-remove" data-rm aria-label="הסר ${esc(it.model)}">${t('הסר', 'Remove')}</button>
      ${(h => (h ? `<div class="q-pack" data-testid="pack-hint">${h}</div>` : ''))(p ? packHint(p, it.qty) : '')}
    </div>`;
  }).join('');
}

const itemAt = el => quote.items()[el.closest('[data-i]').dataset.i];
list.addEventListener('click', e => {
  if (!e.target.closest('[data-i]')) return;
  const it = itemAt(e.target);
  const d = e.target.closest('[data-d]'), r = e.target.closest('[data-round]');
  if (d) quote.setQty(it.productId, it.variant, it.qty + Number(d.dataset.d));
  if (r) quote.setQty(it.productId, it.variant, Number(r.dataset.round));
  if (e.target.closest('[data-rm]')) quote.remove(it.productId, it.variant);
});
list.addEventListener('change', e => {
  if (e.target.matches('input')) quote.setQty(itemAt(e.target).productId, itemAt(e.target).variant, e.target.value);
});

// ── form: restore, draft, remember ──
const { remembered } = restoreInto(form);
const rememberedNote = document.getElementById('form-remembered');
rememberedNote.hidden = !remembered;
document.getElementById('forget-me').addEventListener('click', () => {
  forgetCustomer(); clearDraft();
  CUSTOMER_FIELDS.forEach(f => { form.elements[f].value = ''; });
  rememberedNote.hidden = true;
  form.elements.name.focus();
});
form.addEventListener('input', () => saveDraft(formValues(form)));
liveValidate(form, REQUIRED);
form.dataset.ready = '';

// ── submit ──
form.addEventListener('submit', async e => {
  e.preventDefault();
  formError.textContent = '';
  const invalid = validateForm(form, REQUIRED);
  if (invalid) { invalid.focus(); return; }
  const items = quote.items();
  if (!items.length) return;

  const v = formValues(form);
  if (form.elements.website.value) { showDone({ number: '—', items }); return; } // bot: pretend success, store nothing

  submitBtn.disabled = true;
  try {
    const db = await data();
    const req = await db.createQuoteRequest({
      customer: { name: v.name, company: v.company, phone: normalizePhone(v.phone), email: v.email.toLowerCase(), notes: v.notes },
      project: { type: v.projectType, annualQty: v.annualQty, timeline: v.timeline },
      items: items.map(({ productId, model, variant, sku, qty }) => ({ productId, model, variant, sku: sku || '', qty })),
      lang: document.documentElement.lang,
      source: 'website',
    });
    await notifyByEmail(quoteEmail(req));
    saveCustomer(v);
    clearDraft();
    quote.clear();
    showDone(req);
  } catch (err) {
    console.error(err);
    formError.innerHTML = t('משהו השתבש בשליחה. נסו שוב, או התקשרו אלינו.', 'Something went wrong. Please try again or call us.');
  } finally {
    submitBtn.disabled = false;
  }
});

function showDone(req) {
  document.getElementById('quote-build').hidden = true;
  const done = document.getElementById('quote-done');
  document.getElementById('done-number').textContent = req.number;
  document.getElementById('done-items').innerHTML = req.items
    .map(i => `<li><strong>${esc(i.model)}</strong>${i.variant ? ` <span>· ${esc(i.variant)}</span>` : ''}${i.sku ? ` <span dir="ltr">· ${esc(i.sku)}</span>` : ''} × ${i.qty}</li>`).join('');
  document.getElementById('demo-note').hidden = emailEnabled;
  done.hidden = false;
  done.focus();
  window.scrollTo({ top: 0 });
}

initHeader();
quote.onChange(render);
render();
const db = await data();
products = new Map((await db.listProducts()).map(p => [p.id, p]));
render();
