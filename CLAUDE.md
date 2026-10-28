# LED IT BE – הנחיות לעבודה בפרויקט

קטלוג מוצרים בלי מחירים, עם סל ובקשת הצעת מחיר (RFQ). את המוצרים מנהל המנהל.
האפיון המלא ותוכנית השלבים נמצאים ב-`docs/SPEC.md`. בסוף כל שלב צריך לעדכן שם את הסטטוס.

## פקודות
- `npm run dev` – שרת פיתוח (http://localhost:5173)
- `npm test` – build ואז כל בדיקות Playwright (desktop + mobile)
- `npm run build` – בונה לתיקייה `dist/`

## מבנה
- עמודים בשורש: `index.html`, `catalog.html`, `quote.html`. כל עמוד טוען את `src/pages/<page>.js`.
- `src/lib/quote-cart.js` – הסל, שמור ב-localStorage ומשותף לכל העמודים.
- `src/lib/data/` – שכבת נתונים. עמודים מייבאים רק מ-`index.js`. בלי `.env.local` האתר רץ במצב demo.
- `legacy/` – הקבצים הישנים, לעיון בלבד. לא עורכים אותם ולא מקשרים אליהם.
- עיצוב: לשמור על העיצוב הקיים (`src/styles/home.css`). תוספות נכנסות ל-`shared.css` או לקובץ CSS של העמוד.
- דו-לשוני: טקסט בתוך `.he-text` / `.en-text`, וההחלפה נעשית ב-`src/lib/i18n.js`.

## סדר עבודה בכל שלב
1. לבצע את השינויים, וכל פיצ'ר חדש מקבל בדיקה ב-`tests/e2e/`.
2. `npm test` חייב לעבור ירוק.
3. בדיקה ויזואלית דרך Playwright MCP, ב-desktop וב-390px.
4. commit עם הודעה ברורה, ואז push.

## Skills
- עיצוב: `impeccable`, `design-taste-frontend` · אנימציות: `emil-design-eng` · זרימות ונגישות: `ux-designer`

## אסור
- סיסמאות, מפתחות סודיים או נתוני לקוחות בקוד. מפתחות נכנסים ל-`.env.local`, שלא עולה ל-git.
