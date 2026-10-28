import { test, expect } from '@playwright/test';

async function addProduct(page, id, qty = 1, sku) {
  await page.goto(`/product.html?id=${id}${sku ? `&sku=${sku}` : ''}`);
  await page.locator('#pd-qty').fill(String(qty));
  await page.locator('.pd [data-add]').click();
}
async function fillValid(page) {
  await page.fill('#f-name', 'גל כהן');
  await page.fill('#f-company', 'LED Signs בע"מ');
  await page.fill('#f-phone', '050-123 4567');
  await page.fill('#f-email', 'Gal@Example.com');
}
async function openQuote(page) { await page.goto('/quote.html'); await page.locator('#quote-form[data-ready]').waitFor({ state: 'attached' }); }
const stored = (page, key) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), key);

test('form is hidden when the cart is empty', async ({ page }) => {
  await openQuote(page);
  await expect(page.getByTestId('quote-empty')).toBeVisible();
  await expect(page.locator('#quote-form')).toBeHidden();
});

test('required fields show Hebrew errors and focus the first invalid field', async ({ page }) => {
  await addProduct(page, 'pixel-12001');
  await openQuote(page);
  await page.click('#submit-btn');
  await expect(page.locator('#e-name')).toHaveText('נא למלא שם מלא');
  await expect(page.locator('#e-phone')).toContainText('טלפון לא תקין');
  await expect(page.locator('#e-email')).toHaveText('כתובת מייל לא תקינה');
  await expect(page.locator('#f-name')).toBeFocused();
  await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');

  // error clears as soon as the field becomes valid
  await page.fill('#f-name', 'גל');
  await expect(page.locator('#e-name')).toHaveText('');
});

for (const [phone, ok] of [['0501234567', true], ['+972-50-123-4567', true], ['03-1234567', true], ['077-1234567', true], ['12345', false], ['050-12345', false]]) {
  test(`phone validation: ${phone} → ${ok ? 'valid' : 'invalid'}`, async ({ page }) => {
    await addProduct(page, 'pixel-12001');
    await openQuote(page);
    await page.fill('#f-phone', phone);
    await page.click('#submit-btn');
    if (ok) await expect(page.locator('#f-phone')).not.toHaveAttribute('aria-invalid', 'true');
    else await expect(page.locator('#f-phone')).toHaveAttribute('aria-invalid', 'true');
    if (ok) await expect(page.locator('#e-phone')).toHaveText('');
  });
}

test('successful request: thank-you screen, request saved, cart cleared, details remembered', async ({ page }) => {
  await addProduct(page, 'pixel-12001', 150);
  await addProduct(page, 'strips-15189', 3, '15204');
  await openQuote(page);
  await fillValid(page);
  await page.selectOption('#f-type', 'lightbox');
  await page.fill('#f-annual', '20000');
  await page.selectOption('#f-timeline', '1m');
  await page.fill('#f-notes', 'לשלט חזית');
  await page.click('#submit-btn');

  const done = page.getByTestId('quote-done');
  await expect(done).toBeVisible();
  await expect(page.locator('#done-number')).toHaveText(/^Q-\d{4}-0001$/);
  await expect(page.locator('#done-items li')).toHaveCount(2);
  await expect(page.locator('#demo-note')).toBeVisible();
  await expect(page.locator('.quote-nav-btn [data-quote-count]')).toBeHidden();

  const [req] = await stored(page, 'led_demo_quotes');
  expect(req.customer).toMatchObject({ name: 'גל כהן', phone: '0501234567', email: 'gal@example.com' });
  expect(req.project).toEqual({ type: 'lightbox', annualQty: '20000', timeline: '1m' });
  expect(req.items).toEqual([
    { productId: 'pixel-12001', model: 'לד נעיצה 9 מ"מ · 12V', variant: 'אדום', sku: '12001', qty: 150 },
    { productId: 'strips-15189', model: 'סרט לד 5050/60 · 12V', variant: 'אדום', sku: '15204', qty: 3 },
  ]);
  await expect(page.locator('#done-items')).toContainText('15204');
  expect(req.status).toBe('new');
  expect(await stored(page, 'led_quote_v1')).toEqual([]);
  expect(await stored(page, 'led_quote_draft_v1')).toBeNull();

  // next visit: contact details are prefilled, project fields are not
  await addProduct(page, 'controllers-15102');
  await openQuote(page);
  await expect(page.locator('#form-remembered')).toBeVisible();
  await expect(page.locator('#f-name')).toHaveValue('גל כהן');
  await expect(page.locator('#f-email')).toHaveValue('Gal@Example.com');
  await expect(page.locator('#f-notes')).toHaveValue('');

  // "not you?" clears them
  await page.locator('#forget-me').click();
  await expect(page.locator('#f-name')).toHaveValue('');
  expect(await stored(page, 'led_customer_v1')).toBeNull();
});

test('second request gets the next number', async ({ page }) => {
  for (let n = 1; n <= 2; n++) {
    await addProduct(page, 'pixel-12001');
    await openQuote(page);
    await fillValid(page);
    await page.click('#submit-btn');
    await expect(page.locator('#done-number')).toHaveText(new RegExp(`-000${n}$`));
  }
});

test('half-filled form survives a page refresh (draft)', async ({ page }) => {
  await addProduct(page, 'pixel-12001');
  await openQuote(page);
  await page.fill('#f-name', 'דנה');
  await page.fill('#f-notes', 'צריך עד סוף החודש');
  await page.reload();
  await expect(page.locator('#f-name')).toHaveValue('דנה');
  await expect(page.locator('#f-notes')).toHaveValue('צריך עד סוף החודש');
});

test('spam trap: a filled honeypot does not save a request', async ({ page }) => {
  await addProduct(page, 'pixel-12001');
  await openQuote(page);
  await fillValid(page);
  await page.evaluate(() => { document.getElementById('f-website').value = 'http://spam.example'; });
  await page.click('#submit-btn');
  await expect(page.getByTestId('quote-done')).toBeVisible();
  expect(await stored(page, 'led_demo_quotes')).toBeNull();
});

test('no packaging hint when the product has no bag/box data', async ({ page }) => {
  await addProduct(page, 'pixel-12001', 150);
  await openQuote(page);
  await expect(page.getByTestId('pack-hint')).toHaveCount(0);
});

test('quote list can be printed / saved as PDF, before and after sending', async ({ page }) => {
  await page.addInitScript(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await addProduct(page, 'pixel-12001', 250, '12004');
  await addProduct(page, 'controllers-15102', 2);
  await openQuote(page);
  await page.fill('#f-name', 'דנה לוי');
  await page.click('#print-list');
  expect(await page.evaluate(() => window.__printed)).toBe(1);
  const sheet = page.getByTestId('print-sheet');
  await expect(sheet.locator('tbody tr')).toHaveCount(2);
  await expect(sheet).toContainText('12004');
  await expect(sheet).toContainText('דנה לוי');
  await page.emulateMedia({ media: 'print' });
  await expect(sheet).toBeVisible();
  await expect(page.locator('#quote-form')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await expect(sheet).toBeHidden();

  await page.fill('#f-phone', '0501234567');
  await page.fill('#f-email', 'dana@example.com');
  await page.click('#submit-btn');
  await expect(page.getByTestId('quote-done')).toBeVisible();
  await page.click('#print-done');
  await expect(sheet).toContainText(/Q-\d{4}-0001/);
  await expect(sheet.locator('tbody tr')).toHaveCount(2);
});
