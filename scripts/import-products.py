#!/usr/bin/env python3
"""
Imports the item index (ERP export .xlsx) into public/data/products.json.

- Groups SKUs that differ only by color / color temperature / roll length / "דגם 2"
  into one product with variants (each variant keeps its own SKU).
- Categorises by product type (not by ERP sort code, which mixes types).
- Skips non-products (discounts, commissions, inactive items).

Usage: python3 scripts/import-products.py path/to/items.xlsx
"""
import json, re, sys, collections
import openpyxl

SKIP_CATS = {'156', '157'}            # discount / sales commissions
SKIP_NAMES = re.compile(r'^לא פעיל$')

CATEGORIES = [  # order = catalog order
  ('modules',     'מודולי לד',                  'LED modules'),
  ('bars',        'פסים קשיחים לתיבות אור',     'Rigid bars for lightboxes'),
  ('strips',      'סרטי לד',                    'LED strips'),
  ('neon',        'ניאון לד',                   'LED neon'),
  ('pixel',       'לד נעיצה',                   'Pixel LEDs'),
  ('controllers', 'בקרים, מגברים ודימרים',      'Controllers, amplifiers & dimmers'),
  ('accessories', 'מחברים ואביזרים',            'Connectors & accessories'),
]

# ── text clean-up (typos / spelling variants in the source) ──
FIXES = [(r'לבו קר', 'לבן קר'), (r'תורקיז', 'טורקיז'), (r'ארגד', 'ארגז'), (r'סילקון', 'סיליקון'),
         (r'עדש\.', 'עדשה'), (r'נאון', 'ניאון'), (r'(\d)\s*ק\b', r'\1K'), (r'(\d{4})\s*ק\.', r'\1K.'),
         (r'מע\.', 'מעלות'), (r'רביעייה', 'רביעיה'), (r'שלישייה', 'שלישיה'), (r'\s+', ' ')]
def clean(s):
    s = str(s).strip()
    for a, b in FIXES: s = re.sub(a, b, s)
    return s.strip(' .')

COLORS = [  # (regex, he, en, hex)
  (r'RGBW', 'RGBW', 'RGBW', 'rgbw'), (r'7\s*צבעים', '7 צבעים', '7 colors', 'rgb'),
  (r'פול קולור', 'RGB פול קולור', 'RGB full color', 'rgb'), (r'RGB', 'RGB', 'RGB', 'rgb'),
  (r'לבן קר', 'לבן קר', 'Cool white', '#e8f4ff'), (r'לבן חם', 'לבן חם', 'Warm white', '#ffd27a'),
  (r'לבן פיור', 'לבן פיור', 'Pure white', '#f4f8ff'), (r'לבן צח', 'לבן צח', 'Bright white', '#f4f8ff'),
  (r'לבן', 'לבן', 'White', '#fbfbf2'), (r'אדום', 'אדום', 'Red', '#ff3b30'), (r'צהוב', 'צהוב', 'Yellow', '#ffd60a'),
  (r'ירוק', 'ירוק', 'Green', '#30d158'), (r'כחול', 'כחול', 'Blue', '#0a84ff'), (r'כתום', 'כתום', 'Orange', '#ff9f0a'),
  (r'סגול', 'סגול', 'Purple', '#bf5af2'), (r'ורוד', 'ורוד', 'Pink', '#ff6fb5'), (r'תכלת', 'תכלת', 'Sky blue', '#64d2ff'),
  (r'אמבר', 'אמבר', 'Amber', '#ffb340'), (r'טורקיז', 'טורקיז', 'Turquoise', '#40e0d0'),
]
CCT_RX = re.compile(r'\(?\s*(\d{4,5}(?:\s*-\s*\d{4,5})?)\s*K\s*\)?|(?<![\d/.])(2000|2500|2700|3000|4000|4200|6000|8000)(?![\d/.KW])')

def cct_hex(k):
    k = int(re.split(r'\D', k)[0])
    return '#ffc46b' if k <= 2700 else '#ffd27a' if k <= 3200 else '#fff1d6' if k <= 4500 else '#f4f8ff' if k <= 6500 else '#e3f0ff'

def parse_color(n):
    if re.search(r'\(אדום,לבן', n): return {'he': '5 צבעים', 'en': '5 colors', 'hex': 'multi'}
    color = None
    for rx, he, en, hx in COLORS:
        if re.search(rx, n): color = {'he': he, 'en': en, 'hex': hx}; break
    m = CCT_RX.search(n)
    cct = (m.group(1) or m.group(2)).replace(' ', '') if m else None
    if cct and (not color or color['he'] in ('לבן', 'לבן חם', 'לבן קר', 'לבן פיור', 'לבן צח')):
        color = dict(color or {'he': 'לבן', 'en': 'White', 'hex': '#fbfbf2'})
        color['he'] += f' {cct}K'; color['en'] += f' {cct}K'; color['hex'] = cct_hex(cct)
    if not color and re.search(r'\(אדום,לבן', n): color = {'he': '5 צבעים', 'en': '5 colors', 'hex': 'multi'}
    return color

def num(rx, s, cast=float):
    m = re.search(rx, s); return cast(m.group(1)) if m else None

def attrs(n):
    a = {}
    a['voltage'] = num(r'(?<![\d.])(5|12|24)\s*V\b', n, int)
    a['watt'] = num(r'(\d+(?:\.\d+)?)\s*W', n)
    a['roll'] = num(r'גליל\s*(\d+)\s*מ', n, int)
    a['ip'] = num(r'IP\s*-?\s*(\d\d)', n, int)
    m = re.search(r'(2835|3528|5050)\s*(?:/\s*(\d+))?', n)
    if m: a['chip'] = m.group(1); a['density'] = int(m.group(2)) if m.group(2) else None
    if 'ליסה' in n: a['density'] = num(r'(\d+)\s*לד למטר', n, int)
    m = re.search(r'(\d+)\s*[Xx]\s*(\d+)', n)
    if m: a['size'] = f'{min(int(m.group(1)), int(m.group(2)))}×{max(int(m.group(1)), int(m.group(2)))}'
    a['angle'] = num(r'(\d+)\s*מעלות', n, int) or (45 if re.search(r'לד 45\b', n) else None)
    a['outdoor'] = bool(re.search(r'חוץ', n)) or (a['ip'] or 0) >= 65
    a['indoor'] = bool(re.search(r'פנים', n))
    a['model2'] = bool(re.search(r'דגם\s*2', n))
    return a

def ptype(n):
    if re.search(r'^(בקר|מגבר|דימר)|^24V ?בקר', n): return 'controllers'
    if re.search(r'מחבר|כיפה|סיומת|קליפס|פקק|כבל|תופסן|פרופיל|דבק|שפופרת|כובע|שלת|פינים|בורג|סכין|כרסום|חיבור 4 פינים', n): return 'accessories'
    if re.search(r'^פס|פס לד|פס קשיח|פס 160', n): return 'bars'
    if re.search(r'ניאון', n): return 'neon'
    if re.search(r'נעיצה', n): return 'pixel'
    if re.search(r'סרט|ליסה', n): return 'strips'
    return 'modules'

# ── per-type family key + display names ──
def strip_kind(n):
    for rx, he, en in [(r'מתקפל', 'מתקפל', 'Foldable'), (r'שקוף', 'שקוף IP65', 'Clear IP65'), (r'סיליקון', 'סיליקון IP68', 'Silicone IP68'),
                       (r'ליסה', 'ליסה', 'Lisa'), (r'דרים', 'דרים', 'Dream')]:
        if re.search(rx, n): return he, en
    return '', ''

def neon_kind(n):
    for rx, he, en in [(r'דמוי ניאון:', None, None), (r'דמוי ניאון', 'סיליקון דמוי ניאון לחריטה', 'Engravable neon-look silicone'),
                       (r'חבל ניאון', 'חבל ניאון', 'Neon rope'), (r'תקול.*RGB|RGB.*תקול', 'סרט ניאון תקול RGB', 'Neon tube RGB'),
                       (r'תקול', 'סרט ניאון תקול גמיש', 'Flexible neon tube'), (r'IP65', 'סרט ניאון סיליקון IP65', 'Silicone neon flex IP65'),
                       (r'דרים', 'סרט ניאון סיליקון דרים', 'Silicone neon flex Dream'), (r'.', 'סרט ניאון סיליקון', 'Silicone neon flex')]:
        if re.search(rx, n): return he, en
    return 'ניאון', 'Neon'

MODULE_FORMS = [  # (regex, he, en, leds) — order matters
  (r'מיני-שלישיה', 'מיני שלישיה לד עדשה', 'Mini triple LED lens module', 3),
  (r'שלישיה קטנה', 'שלישיה קטנה לד עדשה', 'Small triple LED lens module', 3),
  (r'לד מינימלי', 'לד מינימלי עדשה', 'Minimal LED lens module', 1),
  (r'מיני לד עדשה', 'מיני לד עדשה', 'Mini LED lens module', 1),
  (r'מיני לד|מיני RGB', 'מיני לד יחיד', 'Mini single LED module', 1),
  (r'לד 45|45 מעלות לצד|45 מעלות לדופן', 'לד 45° לדופן ארגז', '45° side-lit LED module', 3),
  (r'מודול 2\.4W.*160', 'מודול 2.4W עדשה 160°', '2.4W lens module 160°', 3),
  (r'מודול 2\.4W.*45', 'מודול 2.4W עדשה 45° לצד ארגז', '2.4W lens module 45° side-lit', 3),
  (r'מודול עדשה 160', 'מודול עדשה 160°', 'Lens module 160°', 3),
  (r'מפזרת', 'רביעיה מפזרת', 'Diffused quad module', 4),
  (r'רביעיה', 'רביעיה לד', 'Quad LED module', 4),
  (r'שלישיה', 'שלישיה לד', 'Triple LED module', 3),
  (r'זוג', 'זוגות לד', 'Dual LED module', 2),
]

def family(it):
    n, t, a = it['name'], it['type'], it['attrs']
    v = a['voltage']
    if t == 'strips':
        k_he, k_en = strip_kind(n)
        if 'דרים' in n: chip = ''
        else: chip = f"{a.get('chip','')}/{a.get('density') or ''}".rstrip('/')
        volt = v or 12
        he = ' '.join(x for x in ['סרט לד', k_he, chip] if x); en = ' '.join(x for x in ['LED strip', k_en, chip] if x)
        return ('strips', k_he, chip, volt), f'{he} · {volt}V', f'{en} · {volt}V'
    if t == 'neon':
        k_he, k_en = neon_kind(n)
        size = a.get('size') or ''
        rgb = 'RGB' if re.search(r'RGB', n) else ''
        if k_he is None:  # tools for neon-look silicone
            return ('neon-tool', n), clean(re.sub(r'^סיליקון דמוי ניאון:\s*', 'כלי לסיליקון דמוי ניאון: ', n)), None
        he = ' '.join(x for x in [k_he, rgb if 'RGB' not in k_he else '', size] if x)
        en = ' '.join(x for x in [k_en, rgb if 'RGB' not in k_en else '', size] if x)
        volt = v or (12 if 'סיליקון' in k_he and 'דמוי' not in k_he else None)
        if volt: he += f' · {volt}V'; en += f' · {volt}V'
        return ('neon', k_he, rgb, size, volt), he, en
    if t == 'pixel':
        d = num(r'(\d+)\s*מ', n, int); volt = v or 12
        return ('pixel', d, volt), f'לד נעיצה {d} מ"מ · {volt}V', f'Pixel LED {d}mm · {volt}V'
    if t == 'modules':
        for rx, he, en, leds in MODULE_FORMS:
            if re.search(rx, n):
                lens = ('עדשה' in n or 'עדשה' in he) and 'עדשה' not in he
                he2 = he + (' עדשה' if lens else ''); en2 = en if not lens else en.replace('module', 'lens module')
                if 'חזק' in n: he2 += ' חזק'; en2 = 'High-power ' + en2
                w = a['watt']; volt = v or 12
                tail_he = f' · {w:g}W' if w else ''
                return ('modules', he2, w, volt), f'{he2}{tail_he} · {volt}V', f'{en2}{tail_he} · {volt}V'
        return ('modules', n), n, None
    if t == 'bars':
        if re.search(r'45', n): he, en = 'פס לד 45° לדופן ארגז · 96 ס"מ', '45° side-lit LED bar · 96cm'
        elif re.search(r'מחובר 10', n): he, en = 'פס לד 160° מחובר 10 יח׳', '160° LED bar, chain of 10'
        elif re.search(r'קשיח 92', n): return ('bars', n), clean(n), None
        else: he, en = 'פס לד 160° לארגז נמוך · 96 ס"מ', '160° LED bar for shallow boxes · 96cm'
        volt = v or 12
        return ('bars', he, volt), f'{he} · {volt}V', f'{en} · {volt}V'
    # controllers / accessories: one product per SKU
    return (t, it['sku']), clean(n), None

def variant_label(it, fam_items):
    a, c = it['attrs'], it['color']
    he, en = [], []
    if c: he.append(c['he']); en.append(c['en'])
    if a['roll']: he.append(f"גליל {a['roll']} מ'"); en.append(f"{a['roll']}m roll")
    if a['model2']: he.append('דגם 2'); en.append('model 2')
    if not he and len(fam_items) > 1: he.append(f"מק\"ט {it['sku']}"); en.append(f"SKU {it['sku']}")
    return ' · '.join(he), ' · '.join(en)

def specs_for(t, items):
    a = items[0]['attrs']
    rows = []
    def add(he, en, v):
        if v not in (None, '', False): rows.append({'he': he, 'en': en, 'value': str(v)})
    volts = sorted({i['attrs']['voltage'] for i in items if i['attrs']['voltage']})
    add('מתח', 'Voltage', ' / '.join(f'{x}V' for x in volts) or ('12V' if t in ('strips', 'modules', 'neon', 'pixel', 'bars') else None))
    watts = sorted({i['attrs']['watt'] for i in items if i['attrs']['watt']})
    unit = " למטר" if t in ('strips', 'neon') else ''
    add('הספק', 'Power', ' / '.join(f'{w:g}W' for w in watts) + (unit if watts else '') if watts else None)
    if a.get('chip'): add('סוג שבב', 'LED chip', f"SMD {a['chip']}")
    if a.get('density'): add('לדים למטר', 'LEDs per meter', a['density'])
    if a.get('size'): add('חתך (מ"מ)', 'Profile (mm)', a['size'])
    if a.get('angle'): add('זווית', 'Beam angle', f"{a['angle']}°")
    ips = sorted({i['attrs']['ip'] for i in items if i['attrs']['ip']})
    add('עמידות', 'Ingress protection', ' / '.join(f'IP{x}' for x in ips) or None)
    out = any(i['attrs']['outdoor'] for i in items); ind = any(i['attrs']['indoor'] for i in items)
    add('שימוש', 'Use', 'פנים וחוץ' if out and ind else 'חוץ' if out else 'פנים' if ind else None)
    rolls = sorted({i['attrs']['roll'] for i in items if i['attrs']['roll']})
    if rolls: add('אריזה', 'Packaging', ' / '.join(f"גליל {r} מ'" for r in rolls) + (" / לפי מטר" if any(not i['attrs']['roll'] for i in items) else ''))
    return rows

def slug(key):
    s = '-'.join(str(x) for x in key if x not in (None, ''))
    tr = {'modules': 'mod', 'strips': 'strip', 'neon': 'neon', 'pixel': 'pixel', 'bars': 'bar'}
    s = re.sub(r'[^a-z0-9.]+', '-', s.lower()).strip('-')
    return s or 'p'

def main(path):
    ws = openpyxl.load_workbook(path, data_only=True).active
    items, skipped = [], []
    for r in ws.iter_rows(min_row=4, values_only=True):
        if r[0] == 'קוד מיון' or not r[5]: continue
        sku, name, cat = str(r[5]).strip(), clean(r[6] or ''), str(r[4])
        if cat in SKIP_CATS or SKIP_NAMES.match(name): skipped.append(sku); continue
        it = {'sku': sku, 'name': name, 'erpCat': cat}
        it['type'] = ptype(name); it['attrs'] = attrs(name); it['color'] = parse_color(name)
        items.append(it)

    fams = collections.OrderedDict()
    for it in sorted(items, key=lambda i: i['sku']):
        key, he, en = family(it)
        f = fams.setdefault(key, {'key': key, 'type': it['type'], 'he': he, 'en': en, 'items': []})
        f['items'].append(it)

    products, used = [], set()
    for f in fams.values():
        its = f['items']; t = f['type']
        base = f"{t}-{its[0]['sku']}"
        pid = base if base not in used else f"{base}-{len(used)}"; used.add(pid)
        variants = []
        for it in its:
            vh, ve = variant_label(it, its)
            variants.append({'sku': it['sku'], 'he': vh or '—', 'en': ve or '—', 'hex': (it['color'] or {}).get('hex'), 'source': it['name']})
        # make labels unique within the product
        cnt = collections.Counter(v['he'] for v in variants)
        for v in variants:
            if cnt[v['he']] > 1: v['he'] += f" · מק\"ט {v['sku']}"; v['en'] += f" · SKU {v['sku']}"
        name_he = f['he'] if len(its) > 1 or t not in ('controllers', 'accessories') else its[0]['name']
        if len(its) == 1 and t in ('modules', 'strips', 'neon', 'pixel', 'bars') and its[0]['color']:
            name_he = f['he']
        products.append({
            'id': pid, 'type': t, 'category': t,
            'name': {'he': name_he, 'en': f['en'] or ''},
            'skus': [v['sku'] for v in variants],
            'variants': variants,
            'specs': specs_for(t, its),
            'images': [], 'datasheetUrl': '',
            'published': True, 'price': None, 'showPrice': False,
        })
    order = {c[0]: i for i, c in enumerate(CATEGORIES)}
    products.sort(key=lambda p: (order[p['type']], p['skus'][0]))
    for i, p in enumerate(products): p['order'] = i + 1
    out = {'categories': [{'id': c, 'he': he, 'en': en, 'count': sum(1 for p in products if p['type'] == c)} for c, he, en in CATEGORIES],
           'products': products}
    json.dump(out, open('public/data/products.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(items)} SKUs → {len(products)} products; skipped {len(skipped)}: {skipped}')
    for c in out['categories']: print(f"  {c['id']:12} {c['count']}")

if __name__ == '__main__':
    main(sys.argv[1])
