// "bag = 100 pcs · box = 2,500 pcs" + a button to round up to whole bags.
import { packUnits, roundingSuggestion, fmt } from '../lib/packaging.js';
import { t } from '../lib/html.js';

export function packHint(product, qty) {
  const units = packUnits(product);
  if (!units.length) return '';
  const info = units.map(u => `${t(u.he, u.en)} = ${fmt(u.size)} ${t('יח׳', 'pcs')}`).join(' · ');
  const s = roundingSuggestion(product, qty);
  const btn = s ? `<button type="button" class="pack-round" data-round="${s.qty}">${t(`עגל ל-${fmt(s.qty)} (${s.packs} ${s.unit.he === 'שקית' ? (s.packs > 1 ? 'שקיות' : 'שקית') : (s.packs > 1 ? 'קרטונים' : 'קרטון')})`, `Round to ${fmt(s.qty)} (${s.packs} ${s.unit.en}${s.packs > 1 ? (s.unit.en === 'box' ? 'es' : 's') : ''})`)}</button>` : '';
  return `<span class="pack-info">📦 ${info}</span>${btn}`;
}
