# LED IT BE – הנחיות לעבודה בפרויקט

קטלוג מוצרים בלי מחירים, עם סל ובקשת הצעת מחיר (RFQ). את המוצרים מנהל המנהל.
האפיון המלא ותוכנית השלבים נמצאים ב-`docs/SPEC.md`. בסוף כל שלב צריך לעדכן שם את הסטטוס.

## פקודות
- `npm run dev` – שרת פיתוח (http://localhost:5173)
- `npm test` – build ואז כל בדיקות Playwright (desktop + mobile)
- `npm run build` – בונה לתיקייה `dist/`

## מבנה
- עמודים בשורש: `index.html`, `catalog.html`, `product.html`, `quote.html`. כל עמוד טוען את `src/pages/<page>.js`.
- כותרת ופוטר משותפים: `src/partials/nav.html` ו-`footer.html`, נכללים עם `<!-- @include nav.html -->` (תוסף ב-`vite.config.js`). עמוד חדש צריך להירשם ב-`build.rollupOptions.input`.
- מוצרים: `public/data/products.json` נוצר מאינדקס הפריטים (xlsx) עם `python3 scripts/import-products.py <file.xlsx>`, ודורש `pip install openpyxl`. לא עורכים את ה-JSON ידנית: מתקנים את הסקריפט ומריצים אותו שוב. כרטיס: `src/components/product-card.js`, איור: `product-art.js`, עזרים: `src/lib/products.js`.
- נגישות: `tests/e2e/a11y.spec.js` (axe-core, WCAG 2.1 AA) חייב לעבור. כל שדה מקבל label, ולא מעבירים מידע רק באמצעות צבע.
- טקסט דו-לשוני בתוך שורה: `t(he, en)` מ-`src/lib/html.js`, וכל טקסט שמגיע מהנתונים עובר `esc()`.
- `src/lib/quote-cart.js` – הסל, שמור ב-localStorage ומשותף לכל העמודים.
- `src/lib/data/` – שכבת נתונים. עמודים מייבאים רק מ-`index.js`. בלי `.env.local` האתר רץ במצב demo.
- `legacy/` – הקבצים הישנים, לעיון בלבד. לא עורכים אותם ולא מקשרים אליהם.
- עיצוב: בהיר בלבד, במבנה בהשראת Glamox (לבן, ירקרק-אפרפר #F0F5F5, כתום #C2410C, כפתורים בפינות 4px, גופן Heebo מקומי). בלי רקעים או צבעים כהים. הבסיס ב-`src/styles/site.css`, ותוספות לעמוד ב-`catalog.css` / `quote.css`.
- איורים: מוצרים מוצגים באיור SVG מצויר (`product-art.js`), לא בצילומים. צילומי מוצר אמיתיים יגיעו בשלב 4.
- דו-לשוני: טקסט בתוך `.he-text t-in` / `.en-text t-in`. הנראות נקבעת ב-CSS לפי `html[lang]`, וההחלפה נעשית ב-`src/lib/i18n.js`.

## סדר עבודה בכל שלב
1. לבצע את השינויים, וכל פיצ'ר חדש מקבל בדיקה ב-`tests/e2e/`.
2. `npm test` חייב לעבור ירוק.
3. בדיקה ויזואלית דרך Playwright MCP, ב-desktop וב-390px.
4. commit עם הודעה ברורה, ואז push.

## Skills
- עיצוב: `impeccable`, `design-taste-frontend` · אנימציות: `emil-design-eng` · זרימות ונגישות: `ux-designer`

## אסור
- סיסמאות, מפתחות סודיים או נתוני לקוחות בקוד. מפתחות נכנסים ל-`.env.local`, שלא עולה ל-git.
