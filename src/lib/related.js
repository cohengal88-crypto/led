// Related products for the product page.
// similar: same category, ranked by shared specs (voltage first).
// controllers: suggested controllers for light products, chosen by kind (pixel / RGB / single colour).
const LIGHT = ['modules', 'strips', 'neon', 'bars', 'pixel'];
const spec = (p, en) => p.specs.find(s => s.en === en)?.value || '';
const volts = p => (spec(p, 'Voltage').match(/\d+(?:\.\d+)?V/g) || []);

export function similarProducts(p, all, n = 4) {
  const v = volts(p), ip = spec(p, 'Ingress protection'), chip = spec(p, 'LED chip');
  const score = q => (volts(q).some(x => v.includes(x)) ? 3 : 0)
    + (ip && spec(q, 'Ingress protection') === ip ? 1 : 0)
    + (chip && spec(q, 'LED chip') === chip ? 1 : 0);
  return all
    .filter(q => q.type === p.type && q.id !== p.id && q.published !== false)
    .map(q => ({ q, s: score(q), d: Math.abs(Number(q.skus[0]) - Number(p.skus[0])) || 0 }))
    .sort((a, b) => b.s - a.s || a.d - b.d)
    .slice(0, n)
    .map(x => x.q);
}

export function suggestedControllers(p, all, n = 4) {
  if (!LIGHT.includes(p.type)) return [];
  const controllers = all.filter(q => q.type === 'controllers' && q.published !== false);
  if (p.type === 'pixel') return controllers.filter(q => q.name.he.includes('נעיצה')).slice(0, n);
  const rgb = controllers.filter(q => /RGB/i.test(q.name.he) && !q.name.he.includes('נעיצה'));
  const single = controllers.filter(q => /סינגל|דימר/.test(q.name.he));
  const hasRgb = p.variants.some(v => v.hex === 'rgb' || v.hex === 'rgbw');
  const hasSingle = p.variants.some(v => v.hex !== 'rgb' && v.hex !== 'rgbw');
  if (hasRgb && hasSingle) return [...single.slice(0, n / 2), ...rgb.slice(0, n / 2)];
  return (hasRgb ? rgb : single).slice(0, n);
}
