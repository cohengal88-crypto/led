// Remembers the customer's contact details (for next time) and keeps an unsent form draft.
const CUSTOMER = 'led_customer_v1';
const DRAFT = 'led_quote_draft_v1';
export const CUSTOMER_FIELDS = ['name', 'company', 'phone', 'email'];

const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const getCustomer = () => read(CUSTOMER);
export const saveCustomer = c => write(CUSTOMER, Object.fromEntries(CUSTOMER_FIELDS.map(f => [f, c[f] || ''])));
export const forgetCustomer = () => write(CUSTOMER, null);

export const getDraft = () => read(DRAFT);
export const saveDraft = d => write(DRAFT, d);
export const clearDraft = () => write(DRAFT, null);

/** Fill a form: draft first (most recent), then remembered customer details for empty fields. */
export function restoreInto(form) {
  const draft = getDraft() || {};
  const customer = getCustomer() || {};
  let restored = false;
  for (const el of form.elements) {
    if (!el.name || el.type === 'hidden' || el.dataset.noRestore !== undefined) continue;
    const v = draft[el.name] ?? customer[el.name];
    if (v) { el.value = v; restored = true; }
  }
  return { restored, remembered: Boolean(customer.name) };
}

export function formValues(form) {
  return Object.fromEntries([...form.elements].filter(el => el.name && el.dataset.noRestore === undefined).map(el => [el.name, el.value.trim()]));
}
