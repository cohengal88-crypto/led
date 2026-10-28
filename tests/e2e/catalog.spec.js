import { test, expect } from '@playwright/test';

const cards = page => page.getByTestId('product-card');
let data;
test.beforeAll(async ({ request }) => { data = await (await request.get('/data/products.json')).json(); });

test('import: every SKU from the item file is in exactly one product', async () => {
  const skus = data.products.flatMap(p => p.skus);
  expect(new Set(skus).size).toBe(skus.length);
  expect(skus.length).toBe(671);
  expect(skus).not.toContain('15601'); // discount line
  expect(skus).not.toContain('15701'); // commissions
  expect(skus).not.toContain('15516'); // inactive
  for (const p of data.products) {
    expect(p.variants.map(v => v.sku)).toEqual(p.skus);
    expect(new Set(p.variants.map(v => v.he)).size, `duplicate variant labels in ${p.id}`).toBe(p.variants.length);
  }
});

test('first page shows 24 cards, "show more" loads the rest', async ({ page }) => {
  await page.goto('/catalog.html');
  await expect(cards(page)).toHaveCount(24);
  await expect(page.locator('#results-lbl')).toContainText(`24`);
  await expect(page.locator('#results-lbl')).toContainText(String(data.products.length));
  await page.locator('#more').click();
  await expect(cards(page)).toHaveCount(48);
  await expect(page.locator('[data-count-skus]')).toHaveText('671');
});

test('default order is by SKU', async ({ page }) => {
  await page.goto('/catalog.html');
  const skus = await cards(page).locator('[data-sku]').allTextContents();
  const first = skus.map(s => s.split('–')[0]);
  expect(first).toEqual([...first].sort());
});

test('search by exact SKU finds the product and pre-selects that variant', async ({ page }) => {
  await page.goto('/catalog.html');
  await page.fill('#search', '12005');
  await expect(cards(page)).toHaveCount(1);
  const card = cards(page).first();
  await expect(card).toContainText('לד נעיצה 9');
  await expect(card.locator('[data-sku]')).toHaveText('12005');
  await expect(card.locator('select[data-variant] option:checked')).toContainText('כחול');
  await expect(page).toHaveURL(/q=12005/);
});

test('search by name is forgiving (spaces, ×/x)', async ({ page }) => {
  await page.goto('/catalog.html');
  await page.fill('#search', 'ניאון 6x12');
  await expect(cards(page).first()).toContainText('6×12');
  for (const c of await cards(page).all()) await expect(c).toContainText('6×12');
});

test('category filter shows counts, filters, and is kept in the URL', async ({ page }) => {
  await page.goto('/catalog.html');
  const neon = data.categories.find(c => c.id === 'neon');
  const pill = page.locator('[data-filter="neon"]');
  await expect(pill).toContainText(String(neon.count));
  await pill.click();
  await expect(pill).toHaveAttribute('aria-pressed', 'true');
  await expect(cards(page)).toHaveCount(Math.min(24, neon.count));
  await expect(page).toHaveURL(/cat=neon/);
  await page.reload();
  await expect(page.locator('[data-filter="neon"]')).toHaveAttribute('aria-pressed', 'true');
});

test('empty state + reset', async ({ page }) => {
  await page.goto('/catalog.html');
  await page.fill('#search', 'zzzz-nothing');
  await expect(page.getByTestId('no-results')).toBeVisible();
  await page.locator('[data-reset]').click();
  await expect(cards(page)).toHaveCount(24);
});

test('changing the variant on a card updates its SKU', async ({ page }) => {
  await page.goto('/catalog.html?q=' + encodeURIComponent('לד נעיצה 9'));
  const card = cards(page).filter({ hasText: '12V' }).first();
  await card.locator('select[data-variant]').selectOption({ index: 3 });
  await expect(card.locator('[data-sku]')).toHaveText('12004');
  await expect(card.locator('a[data-link]')).toHaveAttribute('href', /sku=12004/);
});

test('add to quote from a card keeps the SKU', async ({ page }) => {
  await page.goto('/catalog.html?q=15204');
  const card = cards(page).first();
  await card.locator('[data-qty]').fill('3');
  await card.locator('[data-add]').click();
  await expect(page.locator('.ui-toast')).toContainText('× 3');
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('led_quote_v1')));
  expect(cart).toEqual([expect.objectContaining({ sku: '15204', qty: 3, variant: 'אדום' })]);
});

test('each card shows a drawn illustration that follows the selected colour', async ({ page }) => {
  await page.goto('/catalog.html?q=' + encodeURIComponent('לד נעיצה 9'));
  const card = cards(page).filter({ hasText: '12V' }).first();
  await expect(card.locator('.pv svg.p-art')).toBeVisible();
  await expect(card.locator('img')).toHaveCount(0);
  const art = () => card.locator('.pv svg').innerHTML().then(h => h.replace(/pa\d+/g, ''));
  const before = await art();
  await card.locator('select[data-variant]').selectOption({ index: 3 });
  await expect.poll(art).not.toBe(before);
});
