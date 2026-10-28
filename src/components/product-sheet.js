// Renders a product as the original "spec sheet" design.
// card  → compact version for the catalog grid
// full  → everything, for the product page
// Note: imageSvg / media[].html are trusted content (seed data now, admin-only writes in stage 4).
import { esc, t } from '../lib/html.js';

const badges = p => `<div class="sh-certs">${(p.badges || []).map(b => `<span class="cert-icon ${esc(b.kind)}">${esc(b.label)}</span>`).join('')}</div>`;

const header = (p, link) => `
  <div class="sh-header">
    ${badges(p)}
    <div class="sh-brand">${esc(p.series)}</div>
    <h${link ? 2 : 1} class="sh-model">${link ? `<a href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.model)}</a>` : esc(p.model)}</h${link ? 2 : 1}>
    <div class="sh-tagline">${esc(p.tagline)}</div>
  </div>`;

const body = p => `
  <div class="sh-body">
    <div class="spec-block">
      <div class="spec-title">Specifications</div>
      <table class="spec-table">${(p.specs || []).map(s => `<tr><td>${esc(s.label)}</td><td>${esc(s.value)}</td></tr>`).join('')}</table>
    </div>
    <div class="right-block">
      ${p.images?.[0] ? `<div class="prod-img-box"><img src="${esc(p.images[0])}" alt="${esc(p.model)}" loading="lazy" style="max-width:100%"></div>`
        : p.imageSvg ? `<div class="prod-img-box" role="img" aria-label="${esc(p.model)}">${p.imageSvg}</div>` : ''}
      <ul class="features-list">${(p.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    </div>
  </div>`;

export const variantSelect = (p, selected = 0) => (p.variants?.length > 1)
  ? `<select class="q-variant-select" data-variant aria-label="${esc(p.model)} – variant">${p.variants.map((v, i) => `<option value="${i}"${i === selected ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>`
  : '';

export function card(p) {
  return `
  <article class="sheet" dir="ltr" lang="en" data-id="${esc(p.id)}" data-testid="product-card">
    ${header(p, true)}
    ${body(p)}
    <div class="sh-footer">
      <div class="q-controls">
        ${variantSelect(p)}
        <input class="q-qty-input" type="number" min="1" value="1" inputmode="numeric" data-qty aria-label="${esc(p.model)} – quantity">
        <button type="button" class="btn-add" data-add>${t('+ להצעת מחיר', '+ Add to quote')}</button>
      </div>
      <div class="card-links">
        <a class="btn-details" href="product.html?id=${encodeURIComponent(p.id)}">${t('מפרט מלא ←', 'Full specs →')}</a>
        ${p.datasheetUrl ? `<a class="btn-datasheet" href="${esc(p.datasheetUrl)}" target="_blank" rel="noopener">📄 Datasheet</a>` : ''}
      </div>
    </div>
  </article>`;
}

export function full(p) {
  const o = p.ordering;
  return `
  <article class="sheet" dir="ltr" lang="en" data-id="${esc(p.id)}" data-testid="product-sheet">
    ${header(p, false)}
    ${body(p)}
    ${o ? `<div class="sh-ordering">
      <div class="spec-title">Ordering Guide</div>
      <div class="ordering-scroll"><table class="ordering-table">
        <thead><tr>${o.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${o.rows.map((r, i) => `<tr data-row="${i}" tabindex="0" aria-selected="${i === 0}">${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      ${p.variants?.length > 1 ? `<div class="ordering-hint">${t('לחצו על שורה כדי לבחור את הגרסה להצעת המחיר', 'Click a row to choose the variant for your quote')}</div>` : ''}
    </div>` : ''}
    ${p.media?.length ? `<div class="sh-bottom">${p.media.map(m => `<div class="bottom-block"><div class="bottom-title">${esc(m.title)}</div>${m.html}</div>`).join('')}</div>` : ''}
    ${p.packaging?.length ? `<div class="sh-shipping">${p.packaging.map(c => `<div class="ship-cell"><div class="ship-label">${esc(c.label)}</div><div class="ship-val">${esc(c.value)}</div></div>`).join('')}</div>` : ''}
    <div class="buy-box">
      ${variantSelect(p)}
      <input class="q-qty-input" type="number" min="1" value="1" inputmode="numeric" data-qty aria-label="כמות / Quantity">
      <button type="button" class="btn-add" data-add>${t('הוסף לסל הצעת מחיר', 'Add to quote request')}</button>
      ${p.datasheetUrl ? `<a class="btn-datasheet" href="${esc(p.datasheetUrl)}" target="_blank" rel="noopener">📄 Datasheet</a>` : ''}
    </div>
  </article>`;
}
