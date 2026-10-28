// Demo adapter — products from /data/products.json, writes kept in this browser only.
// Used for local development, previews and tests until Firebase is connected (stage 4).
const PKEY = 'led_demo_products';
const QKEY = 'led_demo_quotes';

async function seed() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/products.json`);
  return res.ok ? res.json() : [];
}
async function allProducts() {
  try { const v = JSON.parse(localStorage.getItem(PKEY) || 'null'); if (Array.isArray(v)) return v; } catch {}
  return seed();
}
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export default {
  mode: 'demo',
  async listProducts({ includeHidden = false } = {}) {
    const list = await allProducts();
    return list.filter(p => includeHidden || p.published !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
  async getProduct(id) { return (await allProducts()).find(p => p.id === id) || null; },
  async saveProduct(p) {
    const list = await allProducts();
    const now = new Date().toISOString();
    const i = list.findIndex(x => x.id === p.id);
    if (i >= 0) list[i] = { ...list[i], ...p, updatedAt: now };
    else list.push({ ...p, id: p.id || crypto.randomUUID(), createdAt: now, updatedAt: now });
    save(PKEY, list);
  },
  async deleteProduct(id) { save(PKEY, (await allProducts()).filter(p => p.id !== id)); },
  async createQuoteRequest(req) {
    const list = JSON.parse(localStorage.getItem(QKEY) || '[]');
    const number = `Q-${new Date().getFullYear()}-${String(list.length + 1).padStart(4, '0')}`;
    const doc = { ...req, id: crypto.randomUUID(), number, status: 'new', createdAt: new Date().toISOString() };
    list.push(doc); save(QKEY, list);
    return doc;
  },
  async listQuoteRequests() { return JSON.parse(localStorage.getItem(QKEY) || '[]').reverse(); },
};
