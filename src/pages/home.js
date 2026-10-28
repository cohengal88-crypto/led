import '../styles/home.css';
import '../styles/shared.css';
import { initHeader } from '../components/header.js';
import { data } from '../lib/data/index.js';
import { validateForm, liveValidate, normalizePhone } from '../lib/validate.js';
import { getCustomer, saveCustomer } from '../lib/customer-memory.js';
import { notifyByEmail } from '../lib/notify.js';
import { t } from '../lib/html.js';

initHeader();

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
