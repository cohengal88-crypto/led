// Technical line drawings per product type (datasheet style). Only the LED emitters carry colour.
// Decorative (aria-hidden): the product name and variant are always given as text next to it.
const INK = '#2b3036', PART = '#eef0f2', WIRE = '#8a9096', CL = '#b9bec4';
const RGB = ['#ff3b30', '#30d158', '#0a84ff'];
const colors = hex => !hex ? ['#ffc94d'] : (hex === 'rgb' || hex === 'rgbw') ? RGB
  : hex === 'multi' ? ['#ff3b30', '#ffd60a', '#30d158', '#0a84ff'] : [hex];
const pick = (c, i) => c[i % c.length];
const emitter = (x, y, r, fill) =>
  `<circle cx="${x}" cy="${y}" r="${r * 2}" fill="${fill}" opacity=".22"/><circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width=".8"/>`;
const breakLine = (x, y1, y2) => {
  const h = (y2 - y1) / 4;
  return `<polyline points="${x},${y1 - 3} ${x},${y1 + h} ${x - 4},${y1 + 1.5 * h} ${x + 4},${y1 + 2.5 * h} ${x},${y1 + 3 * h} ${x},${y2 + 3}" fill="none" stroke="${INK}" stroke-width="1"/>`;
};

const SHAPES = {
  modules: c => {
    let s = `<line x1="8" y1="70" x2="232" y2="70" stroke="${CL}" stroke-width=".8" stroke-dasharray="6 3 1.5 3"/>`;
    [48, 120, 192].forEach((x, i) => {
      if (i < 2) s += `<path d="M${x + 26} 62 H${x + 46} M${x + 26} 78 H${x + 46}" stroke="${WIRE}" stroke-width="2.2"/>`;
    });
    s += `<path d="M4 62 H22 M4 78 H22 M218 62 H236 M218 78 H236" stroke="${WIRE}" stroke-width="2.2"/>`;
    [48, 120, 192].forEach((x, i) => {
      s += `<rect x="${x - 26}" y="47" width="52" height="46" rx="6" fill="#fff" stroke="${INK}" stroke-width="1.1"/>
        <rect x="${x - 20}" y="53" width="40" height="34" rx="3" fill="${PART}" stroke="${INK}" stroke-width=".6"/>
        ${emitter(x - 9, 70, 4.2, pick(c, i))}${emitter(x + 9, 70, 4.2, pick(c, i))}
        <circle cx="${x}" cy="44" r="2.6" fill="#fff" stroke="${INK}" stroke-width=".8"/>`;
    });
    return s;
  },
  strips: c => {
    let s = `<rect x="14" y="54" width="212" height="32" fill="#fff" stroke="${INK}" stroke-width="1.1"/>`;
    s += `<line x1="14" y1="70" x2="226" y2="70" stroke="${CL}" stroke-width=".6" stroke-dasharray="6 3 1.5 3"/>`;
    for (const k of [1, 2, 3]) {
      const x = 14 + k * 53;
      s += `<rect x="${x - 6}" y="57" width="4" height="6" fill="#e3c08a" stroke="${INK}" stroke-width=".5"/><rect x="${x + 2}" y="57" width="4" height="6" fill="#e3c08a" stroke="${INK}" stroke-width=".5"/>
        <line x1="${x}" y1="50" x2="${x}" y2="90" stroke="${INK}" stroke-width=".8" stroke-dasharray="3 2"/>`;
    }
    for (let i = 0; i < 8; i++) {
      const x = 27 + i * 26.5;
      s += `<rect x="${x + 9}" y="77" width="6" height="3" fill="${CL}"/>
        <rect x="${x - 5.5}" y="64.5" width="11" height="11" fill="#fff" stroke="${INK}" stroke-width=".8"/>${emitter(x, 70, 3.2, pick(c, i))}`;
    }
    return s + breakLine(14, 54, 86) + breakLine(226, 54, 86);
  },
  neon: c => `
    <rect x="22" y="38" width="30" height="62" rx="11" fill="#fff" stroke="${INK}" stroke-width="1.1"/>
    <rect x="29" y="45" width="16" height="36" rx="6" fill="${c[0]}" opacity=".35" stroke="${INK}" stroke-width=".6"/>
    <rect x="31" y="84" width="12" height="4" fill="${INK}"/>
    <line x1="37" y1="30" x2="37" y2="108" stroke="${CL}" stroke-width=".6" stroke-dasharray="6 3 1.5 3"/>
    <path d="M74 96 C100 30, 140 30, 158 70 S205 112, 226 48" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
    <path d="M74 96 C100 30, 140 30, 158 70 S205 112, 226 48" fill="none" stroke="#fff" stroke-width="12.6" stroke-linecap="round"/>
    <path d="M74 96 C100 30, 140 30, 158 70 S205 112, 226 48" fill="none" stroke="${c.length > 1 ? 'url(#GID)' : c[0]}" stroke-width="6" stroke-linecap="round" opacity=".9"/>`,
  pixel: c => {
    let s = `<path d="M6 100 H234 M6 106 H234" stroke="${WIRE}" stroke-width="2"/>`;
    [30, 75, 120, 165, 210].forEach((x, i) => {
      s += `<path d="M${x} 90 V103" stroke="${INK}" stroke-width="1"/>
        <rect x="${x - 13}" y="82" width="26" height="6" rx="1.5" fill="${PART}" stroke="${INK}" stroke-width="1"/>
        <rect x="${x - 9}" y="56" width="18" height="26" fill="#fff" stroke="${INK}" stroke-width="1.1"/>
        <path d="M${x - 9} 56 A9 9 0 0 1 ${x + 9} 56 Z" fill="${pick(c, i)}" stroke="${INK}" stroke-width="1"/>
        <circle cx="${x}" cy="52" r="16" fill="${pick(c, i)}" opacity=".18"/>`;
    });
    return s;
  },
  bars: c => {
    let s = `<rect x="12" y="50" width="216" height="40" rx="3" fill="${PART}" stroke="${INK}" stroke-width="1.1"/>
      <rect x="22" y="58" width="196" height="24" fill="#fff" stroke="${INK}" stroke-width=".7"/>
      <circle cx="17" cy="70" r="2.6" fill="#fff" stroke="${INK}" stroke-width=".8"/><circle cx="223" cy="70" r="2.6" fill="#fff" stroke="${INK}" stroke-width=".8"/>
      <line x1="6" y1="70" x2="234" y2="70" stroke="${CL}" stroke-width=".6" stroke-dasharray="6 3 1.5 3"/>`;
    for (let i = 0; i < 9; i++) s += emitter(36 + i * 21, 70, 3.6, pick(c, i));
    return s;
  },
  controllers: c => {
    const term = x => `<rect x="${x}" y="50" width="18" height="40" fill="${PART}" stroke="${INK}" stroke-width="1"/>` +
      [58, 70, 82].map(y => `<circle cx="${x + 9}" cy="${y}" r="3.6" fill="#fff" stroke="${INK}" stroke-width=".8"/><line x1="${x + 6.5}" y1="${y + 2.5}" x2="${x + 11.5}" y2="${y - 2.5}" stroke="${INK}" stroke-width=".8"/>`).join('');
    const dots = (c.length > 1 ? c : RGB).slice(0, 3);
    return `<path d="M10 58 H42 M10 70 H42 M10 82 H42 M198 58 H230 M198 70 H230 M198 82 H230" stroke="${WIRE}" stroke-width="2"/>
      <rect x="60" y="34" width="120" height="72" rx="4" fill="#fff" stroke="${INK}" stroke-width="1.1"/>
      <rect x="72" y="46" width="62" height="16" fill="${PART}" stroke="${INK}" stroke-width=".6"/>
      <path d="M78 54 H120" stroke="${CL}" stroke-width="2"/>
      ${dots.map((d, i) => `<circle cx="${150 + i * 10}" cy="54" r="3" fill="${d}" stroke="${INK}" stroke-width=".6"/>`).join('')}
      <rect x="72" y="74" width="96" height="20" fill="none" stroke="${INK}" stroke-width=".6" stroke-dasharray="2 2"/>
      ${term(42)}${term(180)}`;
  },
  accessories: () => `
    <path d="M8 62 H86" stroke="#d0453a" stroke-width="2"/><path d="M8 74 H86" stroke="${INK}" stroke-width="2"/>
    <rect x="124" y="56" width="104" height="24" fill="#fff" stroke="${INK}" stroke-width="1.1"/>
    <rect x="132" y="62" width="10" height="10" fill="#fff" stroke="${INK}" stroke-width=".7"/>
    <rect x="164" y="62" width="10" height="10" fill="#fff" stroke="${INK}" stroke-width=".7"/>
    <rect x="196" y="62" width="10" height="10" fill="#fff" stroke="${INK}" stroke-width=".7"/>
    <rect x="84" y="50" width="46" height="36" rx="3" fill="${PART}" stroke="${INK}" stroke-width="1.1"/>
    <rect x="92" y="44" width="30" height="6" fill="#fff" stroke="${INK}" stroke-width=".9"/>
    <path d="M90 60 H124 M90 76 H124" stroke="${INK}" stroke-width=".6"/>
    ${breakLine(228, 56, 80)}`,
};

let uid = 0;
const label = (x, y, he, en) =>
  `<text x="${x}" y="${y}" direction="rtl" text-anchor="end" class="he-text">${he}</text><text x="${x}" y="${y}" direction="ltr" text-anchor="start" class="en-text">${en}</text>`;

/** callouts: labelled leader lines (used for the large drawing on the home page). */
export function productArt(type, hex, { callouts = false } = {}) {
  const c = colors(hex);
  const gid = `pa${++uid}`;
  const body = (SHAPES[type] || SHAPES.accessories)(c).replaceAll('GID', gid);
  const co = callouts && type === 'strips' ? `
    <g font-size="6.4" fill="${INK}" class="art-callouts">
      <path d="M27 64 L27 30 H40" fill="none" stroke="${INK}" stroke-width=".6"/><circle cx="27" cy="64" r="1.2" fill="${INK}"/>
      ${label(42, 32, 'שבב LED', 'LED chip')}
      <path d="M120 50 L120 22 H134" fill="none" stroke="${INK}" stroke-width=".6"/><circle cx="120" cy="50" r="1.2" fill="${INK}"/>
      ${label(136, 24, 'נקודת חיתוך', 'Cut point')}
      <path d="M71 60 L71 118 H86" fill="none" stroke="${INK}" stroke-width=".6"/><circle cx="71" cy="60" r="1.2" fill="${INK}"/>
      ${label(88, 120, 'פדים להלחמה', 'Solder pads')}
    </g>` : '';
  return `<svg class="p-art" viewBox="0 0 240 140" aria-hidden="true" focusable="false">
    <defs><linearGradient id="${gid}"><stop offset="0" stop-color="#ff3b30"/><stop offset=".5" stop-color="#30d158"/><stop offset="1" stop-color="#0a84ff"/></linearGradient></defs>
    ${body}${co}</svg>`;
}

/** Small colour dot for a variant (decorative; label is always shown/announced). */
export function swatch(hex) {
  const bg = !hex ? '#dfe6ef' : hex === 'rgb' || hex === 'rgbw' ? 'conic-gradient(#ff3b30,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff3b30)'
    : hex === 'multi' ? 'conic-gradient(#ff3b30,#ffd60a,#30d158,#0a84ff,#fbfbf2,#ff3b30)' : hex;
  return `<span class="sw" style="background:${bg}" aria-hidden="true"></span>`;
}

/** Colour chip for the selected variant (decorative; the variant name is always shown as text). */
export function colorChip(hex) {
  return hex ? `<span class="pv-chip" data-chip aria-hidden="true">${swatch(hex)}</span>` : '<span class="pv-chip" data-chip hidden></span>';
}

/** Drawn illustration per product type with a chip in the variant's colour (decorative). */
export function productVisual(type, hex) {
  return `<figure class="pv" data-visual>${productArt(type, hex)}${colorChip(hex)}</figure>`;
}

export function updateChip(root, hex) {
  const chip = root.querySelector('[data-chip]');
  if (!chip) return;
  chip.hidden = !hex;
  chip.innerHTML = hex ? swatch(hex) : '';
}

/** Re-tint the illustration and chip inside root for a newly selected variant. */
export function updateVisual(root, type, hex) {
  const fig = root.querySelector('[data-visual]');
  if (fig) fig.outerHTML = productVisual(type, hex);
}
