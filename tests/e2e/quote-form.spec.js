import { test, expect } from '@playwright/test';

async function addProduct(page, id, qty = 1) {
  await page.goto(`/product.html?id=${id}`);
  await page.locator('.buy-box [data-qty]').fill(String(qty));
  await page.locator('.buy-box [data-add]').click();
}
async function fillValid(page) {
  await page.fill('#f-name', 'גל כהן');
  await page.fill('#f-company', 'LED Signs בע"מ');
  await page.fill('#f-phone', '050-123 4567');
  await page.fill('#f-email', 'Gal@Example.com');
}
const stored = (page, key) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), key);

test('form is hidden when the cart is empty', async ({ page }) => {
  await page.goto('/quote.html');
  await expect(page.getByTestId('quote-empty')).toBeVisible();
  await expect(page.locator('#quote-form')).toBeHidden();
});

test('required fields show Hebrew errors and focus the first invalid field', async ({ page }) => {
  await addProduct(page, '6616b');
  await page.goto('/quote.html');
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
    await addProduct(page, '6616b');
    await page.goto('/quote.html');
    await page.fill('#f-phone', phone);
    await page.click('#submit-btn');
    if (ok) await expect(page.locator('#f-phone')).not.toHaveAttribute('aria-invalid', 'true');
    else await expect(page.locator('#f-phone')).toHaveAttribute('aria-invalid', 'true');
    if (ok) await expect(page.locator('#e-phone')).toHaveText('');
  });
}

test('successful request: thank-you screen, request saved, cart cleared, details remembered', async ({ page }) => {
  await addProduct(page, '6616b', 150);
  await addProduct(page, 'mfw8a3d', 3);
  await page.goto('/quote.html');
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
    { productId: '6616b', model: '6616B', variant: 'Cool White · 10000K', qty: 150 },
    { productId: 'mfw8a3d', model: 'MFW8A3D', variant: 'Pure White · 6500K', qty: 3 },
  ]);
  expect(req.status).toBe('new');
  expect(await stored(page, 'led_quote_v1')).toEqual([]);
  expect(await stored(page, 'led_quote_draft_v1')).toBeNull();

  // next visit: contact details are prefilled, project fields are not
  await addProduct(page, '4116b');
  await page.goto('/quote.html');
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
    await addProduct(page, '6616b');
    await page.goto('/quote.html');
    await fillValid(page);
    await page.click('#submit-btn');
    await expect(page.locator('#done-number')).toHaveText(new RegExp(`-000${n}$`));
  }
});

test('half-filled form survives a page refresh (draft)', async ({ page }) => {
  await addProduct(page, '6616b');
  await page.goto('/quote.html');
  await page.fill('#f-name', 'דנה');
  await page.fill('#f-notes', 'צריך עד סוף החודש');
  await page.reload();
  await expect(page.locator('#f-name')).toHaveValue('דנה');
  await expect(page.locator('#f-notes')).toHaveValue('צריך עד סוף החודש');
});

test('spam trap: a filled honeypot does not save a request', async ({ page }) => {
  await addProduct(page, '6616b');
  await page.goto('/quote.html');
  await fillValid(page);
  await page.evaluate(() => { document.getElementById('f-website').value = 'http://spam.example'; });
  await page.click('#submit-btn');
  await expect(page.getByTestId('quote-done')).toBeVisible();
  expect(await stored(page, 'led_demo_quotes')).toBeNull();
});

test('packaging hint: shows bag/box sizes and rounds up to whole bags', async ({ page }) => {
  await addProduct(page, '6616b', 150);
  await page.goto('/quote.html');
  const hint = page.getByTestId('pack-hint').first();
  await expect(hint).toContainText('100');
  await expect(hint).toContainText('2,500');
  await hint.locator('[data-round]').click();
  await expect(page.getByTestId('quote-item').locator('input')).toHaveValue('200');
  await expect(page.getByTestId('pack-hint').first().locator('[data-round]')).toHaveCount(0);
});

test('packaging hint on the product page follows the quantity field', async ({ page }) => {
  await page.goto('/product.html?id=4116b');
  await page.locator('.buy-box [data-qty]').fill('250');
  const hint = page.locator('.buy-box [data-pack]');
  await expect(hint.locator('[data-round]')).toContainText('300');
  await hint.locator('[data-round]').click();
  await expect(page.locator('.buy-box [data-qty]')).toHaveValue('300');
});

test('no packaging hint for products without bag/box data', async ({ page }) => {
  await addProduct(page, 'mfw8a3d');
  await page.goto('/quote.html');
  await expect(page.getByTestId('pack-hint')).toHaveCount(1);
  await expect(page.getByTestId('pack-hint')).toBeEmpty();
});
