let el, timer;
export function toast(html, { link } = {}) {
  el ??= Object.assign(document.body.appendChild(document.createElement('div')), { className: 'ui-toast', role: 'status' });
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `<span>${html}</span>${link ? `<a href="${link.href}">${link.label}</a>` : ''}`;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('show'), 3200);
}
