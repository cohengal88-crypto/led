// Sends an email notification for a new request.
// Demo mode (no VITE_WEB3FORMS_KEY): nothing is sent — the request is still saved by the data layer.
const KEY = import.meta.env.VITE_WEB3FORMS_KEY;
export const emailEnabled = Boolean(KEY);

export async function notifyByEmail({ subject, fields }) {
  if (!KEY) {
    console.info('[demo] email not sent (VITE_WEB3FORMS_KEY not set):', subject);
    return { sent: false, demo: true };
  }
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: KEY, subject, from_name: 'LED IT BE website', ...fields }),
    });
    return { sent: res.ok };
  } catch {
    return { sent: false }; // request is already saved; email failure must not block the customer
  }
}

export function quoteEmail(req) {
  const c = req.customer, p = req.project || {};
  const lines = req.items.map(i => `• ${i.model}${i.variant ? ` (${i.variant})` : ''} × ${i.qty}`).join('\n');
  return {
    subject: `בקשת הצעת מחיר ${req.number} – ${c.company || c.name}`,
    fields: {
      'מספר בקשה': req.number, 'שם': c.name, 'חברה': c.company || '—', 'טלפון': c.phone, email: c.email,
      'סוג פרויקט': p.type || '—', 'כמות שנתית': p.annualQty || '—', 'מועד אספקה': p.timeline || '—',
      'מוצרים': lines, 'הערות': c.notes || '—',
    },
  };
}
