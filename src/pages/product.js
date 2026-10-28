import '../styles/home.css';
import '../styles/shared.css';
import '../styles/catalog.css';
import { initHeader } from '../components/header.js';
import { data } from '../lib/data/index.js';
import { bindAddToQuote } from '../components/add-to-quote.js';
import { productVisual, updateChip, swatch } from '../components/product-art.js';
import { esc, t } from '../lib/html.js';
import { name, plainName, variantName } from '../lib/products.js';

const root = document.getElementById('product');
const params = new URLSearchParams(location.search);
const id = params.get('id');

initHeader();
const db = await data();
const [p, categories] = await Promise.all([id ? db.getProduct(id) : null, db.listCategories()]);
root.removeAttribute('aria-busy');

function view(p) {
  const cat = categories.find(c => c.id === p.type);
  const start = Math.max(0, p.variants.findIndex(v => v.sku === params.get('sku')));
  const v = p.variants[start];
  const many = p.variants.length > 1;
  return `
  <article class="pd" data-id="${esc(p.id)}" data-testid="product-detail" aria-labelledby="pd-name">
    <div class="pd-art">${productVisual(p.type, v.hex, { eager: true })}</div>
    <div>
      ${cat ? `<div class="pd-cat"><a href="catalog.html?cat=${cat.id}">${t(esc(cat.he), esc(cat.en))}</a></div>` : ''}
      <h1 id="pd-name">${name(p)}</h1>
      <p class="pd-sku" aria-live="polite">${t('מק"ט:', 'SKU:')} <strong data-sku dir="ltr">${esc(v.sku)}</strong>${many ? ` · <span data-vlabel>${variantName(v)}</span>` : ''}</p>

      ${many ? `
      <h2 class="pd-section-title" id="var-title">${t('בחירת גרסה', 'Choose a variant')} (${p.variants.length})</h2>
      <fieldset class="pd-variants" aria-labelledby="var-title">
        <legend>${t('גרסה', 'Variant')}</legend>
        ${p.variants.map((x, i) => `
        <div class="pd-var">
          <input type="radio" name="variant" id="var-${i}" value="${i}" data-variant${i === start ? ' checked' : ''}>
          <label for="var-${i}">${x.hex ? swatch(x.hex) : ''}<span>${variantName(x) || esc(x.sku)}<small dir="ltr">${t('מק"ט', 'SKU')} ${esc(x.sku)}</small></span></label>
        </div>`).join('')}
      </fieldset>` : ''}

      ${p.specs.length ? `
      <h2 class="pd-section-title">${t('מפרט', 'Specifications')}</h2>
      <table class="pd-specs"><tbody>
        ${p.specs.map(s => `<tr><th scope="row">${t(esc(s.he), esc(s.en))}</th><td dir="ltr">${esc(s.value)}</td></tr>`).join('')}
      </tbody></table>` : ''}
      <p class="pd-source">${t('שם בקטלוג:', 'Catalog name:')} <span data-source>${esc(v.source)}</span></p>

      <div class="pd-buy">
        <label class="sr-only" for="pd-qty">${t('כמות', 'Quantity')}</label>
        <input id="pd-qty" class="p-qty" type="number" min="1" value="1" inputmode="numeric" data-qty>
        <button type="button" class="p-add" data-add>${t('הוסף לסל הצעת מחיר', 'Add to quote request')}</button>
        <p class="pd-note">${t('המחיר נשלח בהצעת מחיר. אפשר להוסיף כמה גרסאות לאותה בקשה.', 'Pricing is sent in a quote. You can add several variants to the same request.')}</p>
      </div>
    </div>
  </article>`;
}

if (!p || p.published === false) {
  document.title = 'מוצר לא נמצא – LED IT BE';
  root.innerHTML = `<div class="not-found" data-testid="not-found"><h1>${t('המוצר לא נמצא', 'Product not found')}</h1><p><a href="catalog.html">${t('חזרה לקטלוג ←', '← Back to catalog')}</a></p></div>`;
} else {
  document.title = `${plainName(p, 'he')} | LED IT BE`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${p.name.he} – מק"ט ${p.skus.join(', ')}. בקשת הצעת מחיר.`);
  document.getElementById('crumb-model').textContent = plainName(p);
  root.innerHTML = view(p);
  bindAddToQuote(root, () => p);

  root.addEventListener('change', e => {
    if (!e.target.matches('[data-variant]')) return;
    const v = p.variants[Number(e.target.value)];
    updateChip(root, v.hex);
    root.querySelector('[data-sku]').textContent = v.sku;
    const vl = root.querySelector('[data-vlabel]'); if (vl) vl.innerHTML = variantName(v);
    root.querySelector('[data-source]').textContent = v.source;
    const url = new URL(location.href); url.searchParams.set('sku', v.sku); history.replaceState(null, '', url);
  });
}
