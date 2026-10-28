// Small helpers for building markup safely.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// bilingual inline text; visibility is handled by html[lang] CSS rules
export const t = (he, en) => `<span class="he-text t-in">${he}</span><span class="en-text t-in">${en}</span>`;
