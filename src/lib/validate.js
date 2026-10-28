// Field validation for the quote / contact forms. Messages are bilingual {he, en}.
const digits = s => String(s || '').replace(/[\s\-().]/g, '');

export function normalizePhone(v) {
  let d = digits(v);
  if (d.startsWith('+972')) d = '0' + d.slice(4);
  else if (d.startsWith('972')) d = '0' + d.slice(3);
  return d;
}
// Israeli mobile (05X-XXXXXXX), landline (0X-XXXXXXX) or 07X VoIP
export const isPhone = v => /^0(5\d{8}|7\d{8}|[2-489]\d{7})$/.test(normalizePhone(v));
export const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

export const RULES = {
  name: v => String(v).trim().length >= 2 || { he: 'נא למלא שם מלא', en: 'Please enter your full name' },
  phone: v => isPhone(v) || { he: 'מספר טלפון לא תקין (לדוגמה 050-1234567)', en: 'Invalid phone number (e.g. 050-1234567)' },
  email: v => isEmail(v) || { he: 'כתובת מייל לא תקינה', en: 'Invalid email address' },
  message: v => String(v).trim().length >= 5 || { he: 'נא לכתוב כמה מילים', en: 'Please write a few words' },
};

/** Validates a form; marks invalid fields (aria-invalid + message). Returns first invalid element or null. */
export function validateForm(form, fields) {
  let first = null;
  for (const name of fields) {
    const el = form.elements[name];
    if (!el) continue;
    const res = RULES[name](el.value);
    const msgEl = form.querySelector(`[data-error-for="${name}"]`);
    if (res === true) {
      el.removeAttribute('aria-invalid');
      if (msgEl) msgEl.textContent = '';
    } else {
      el.setAttribute('aria-invalid', 'true');
      if (msgEl) msgEl.textContent = document.documentElement.lang === 'en' ? res.en : res.he;
      first ??= el;
    }
  }
  return first;
}

/** Re-validate a field when the user edits it after a failed submit. */
export function liveValidate(form, fields) {
  form.addEventListener('input', e => {
    if (e.target.getAttribute('aria-invalid') === 'true' && fields.includes(e.target.name)) validateForm(form, [e.target.name]);
  });
}
