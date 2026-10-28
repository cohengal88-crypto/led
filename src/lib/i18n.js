// Language toggle (he/en). Keeps the existing .he-text / .en-text / .he-flex / .en-flex markup pattern.
const KEY = 'led_lang';

export function getLang() {
  try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'he'; } catch { return 'he'; }
}

export function applyLang(lang) {
  const isEn = lang === 'en';
  const root = document.documentElement;
  document.body.classList.toggle('en', isEn);
  root.setAttribute('dir', isEn ? 'ltr' : 'rtl');
  root.setAttribute('lang', isEn ? 'en' : 'he');
  document.body.setAttribute('dir', isEn ? 'ltr' : 'rtl');
  // shown text falls back to its natural display (as on first load); hidden text gets display:none
  document.querySelectorAll('.he-text').forEach(el => { el.style.display = isEn ? 'none' : ''; });
  document.querySelectorAll('.en-text').forEach(el => { el.style.display = isEn ? '' : 'none'; });
  document.querySelectorAll('.he-flex').forEach(el => { el.style.display = isEn ? 'none' : 'flex'; });
  document.querySelectorAll('.en-flex').forEach(el => { el.style.display = isEn ? 'flex' : 'none'; });
  document.querySelectorAll('#lang-toggle, #mm-lang-btn').forEach(b => { b.textContent = isEn ? 'HE' : 'EN'; });
  try { localStorage.setItem(KEY, lang); } catch {}
  document.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
}

export function toggleLang() { applyLang(getLang() === 'he' ? 'en' : 'he'); }

export function initLang() {
  document.querySelectorAll('#lang-toggle, #mm-lang-btn').forEach(b => b.addEventListener('click', toggleLang));
  if (getLang() === 'en') applyLang('en');
}
