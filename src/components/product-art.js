// Illustration per product type, tinted with the variant's LED colour.
// Decorative (aria-hidden): the product name/variant is always given as text next to it.
const RGB = ['#ff3b30', '#30d158', '#0a84ff'];

function fills(hex) {
  if (!hex) return ['#dfe6ef'];
  if (hex === 'rgb' || hex === 'rgbw') return RGB;
  if (hex === 'multi') return ['#ff3b30', '#ffd60a', '#30d158', '#0a84ff', '#fbfbf2'];
  return [hex];
}
const pick = (arr, i) => arr[i % arr.length];
let uid = 0;

const SHAPES = {
  modules: c => `
    <rect x="18" y="52" width="164" height="6" rx="3" fill="#2b3a4f"/>
    ${[40, 100, 160].map((x, i) => `
      <rect x="${x - 22}" y="34" width="44" height="42" rx="8" fill="#f2f5f9" stroke="#c9d3df"/>
      <circle cx="${x}" cy="55" r="12" fill="${pick(c, i)}" opacity=".9"/>
      <circle cx="${x}" cy="55" r="18" fill="${pick(c, i)}" opacity=".18"/>`).join('')}`,
  bars: c => `
    <rect x="10" y="44" width="180" height="22" rx="4" fill="#e8edf3" stroke="#c9d3df"/>
    ${Array.from({ length: 9 }, (_, i) => `<circle cx="${22 + i * 19.5}" cy="55" r="5" fill="${pick(c, i)}"/>`).join('')}
    <rect x="10" y="40" width="180" height="30" rx="6" fill="${c[0]}" opacity=".12"/>`,
  strips: c => `
    <path d="M10 70 C 60 70, 70 40, 120 40 S 180 55, 190 40" stroke="#f2f5f9" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M10 70 C 60 70, 70 40, 120 40 S 180 55, 190 40" stroke="#c9d3df" stroke-width="16" fill="none" stroke-linecap="round" opacity=".5"/>
    ${[[22, 69], [44, 66], [64, 58], [82, 48], [102, 41], [124, 40], [146, 44], [166, 48], [184, 43]]
      .map(([x, y], i) => `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" rx="1.5" fill="${pick(c, i)}"/>`).join('')}`,
  neon: c => `
    <path d="M18 72 C 50 20, 90 20, 100 55 S 160 90, 182 34" stroke="${c[0]}" stroke-width="22" fill="none" stroke-linecap="round" opacity=".2"/>
    <path d="M18 72 C 50 20, 90 20, 100 55 S 160 90, 182 34" stroke="${c[0]}" stroke-width="11" fill="none" stroke-linecap="round"/>
    ${c.length > 1 ? `<path d="M18 72 C 50 20, 90 20, 100 55 S 160 90, 182 34" stroke="url(#GID)" stroke-width="11" fill="none" stroke-linecap="round"/>` : ''}`,
  pixel: c => `
    ${[0, 1, 2, 3, 4].map(i => `
      <circle cx="${30 + i * 35}" cy="55" r="15" fill="#2b3a4f"/>
      <circle cx="${30 + i * 35}" cy="55" r="10" fill="${pick(c, i)}"/>
      <circle cx="${30 + i * 35}" cy="55" r="17" fill="${pick(c, i)}" opacity=".2"/>`).join('')}
    <path d="M10 82 H190" stroke="#2b3a4f" stroke-width="2"/>`,
  controllers: () => `
    <rect x="45" y="25" width="110" height="60" rx="8" fill="#2b3a4f"/>
    <rect x="58" y="38" width="44" height="14" rx="3" fill="#00c8e0" opacity=".85"/>
    <circle cx="128" cy="45" r="6" fill="#ff3b30"/><circle cx="142" cy="45" r="6" fill="#30d158"/><circle cx="135" cy="62" r="6" fill="#0a84ff"/>
    <path d="M45 70 H20 M155 70 H180" stroke="#8a97a8" stroke-width="4" stroke-linecap="round"/>`,
  accessories: () => `
    <rect x="30" y="45" width="70" height="20" rx="4" fill="#c9d3df"/>
    <rect x="100" y="40" width="40" height="30" rx="5" fill="#2b3a4f"/>
    <path d="M140 50 H178 M140 60 H178" stroke="#ff3b30" stroke-width="4" stroke-linecap="round"/>
    <path d="M140 60 H178" stroke="#1d2735" stroke-width="4" stroke-linecap="round"/>`,
};

export function productArt(type, hex) {
  const c = fills(hex);
  const gid = `pa${++uid}`;
  const shape = (SHAPES[type] || SHAPES.accessories)(c).replaceAll('GID', gid);
  return `<svg class="p-art" viewBox="0 0 200 110" aria-hidden="true" focusable="false">
    <defs><linearGradient id="${gid}"><stop offset="0" stop-color="#ff3b30"/><stop offset=".5" stop-color="#30d158"/><stop offset="1" stop-color="#0a84ff"/></linearGradient></defs>
    ${shape}</svg>`;
}

/** Small colour dot for a variant (decorative; label is always shown/announced). */
export function swatch(hex) {
  const bg = !hex ? '#dfe6ef' : hex === 'rgb' || hex === 'rgbw' ? 'conic-gradient(#ff3b30,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)'
    : hex === 'multi' ? 'conic-gradient(#ff3b30,#ffd60a,#30d158,#0a84ff,#fbfbf2,#ff3b30)' : hex;
  return `<span class="sw" style="background:${bg}" aria-hidden="true"></span>`;
}
