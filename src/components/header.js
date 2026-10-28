// Shared header behaviour: language, mobile menu, quote-cart badge.
import { initLang } from '../lib/i18n.js';
import { count, onChange } from '../lib/quote-cart.js';

function initMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('hamburger');
  if (!menu || !btn) return;
  const set = open => {
    menu.classList.toggle('open', open);
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  };
  btn.addEventListener('click', () => set(!menu.classList.contains('open')));
  menu.querySelectorAll('a, button').forEach(el => el.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
}

function renderBadge() {
  const n = count();
  document.querySelectorAll('[data-quote-count]').forEach(el => {
    el.textContent = String(n);
    el.hidden = n === 0;
  });
}

export function initHeader() {
  initLang();
  initMobileMenu();
  renderBadge();
  onChange(renderBadge);
}
