import { test, expect } from '@playwright/test';

const cards = page => page.getByTestId('product-card');

test('shows all products from the data file', async ({ page, request }) => {
  const all = await (await request.get('/data/products.json')).json();
  await page.goto('/catalog.html');
  await expect(cards(page)).toHaveCount(all.length);
  await expect(page.locator('#results-lbl')).toContainText(String(all.length));
  await expect(page.locator('[data-count-total]')).toHaveText(String(all.length));
});

test('search narrows results, is forgiving about spaces/dashes, and is kept in the URL', async ({ page }) => {
  await page.goto('/catalog.html');
  await page.fill('#search', 'mfw 8a3d');
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText('MFW8A3D');
  await expect(page).toHaveURL(/q=mfw/);

  await page.reload();
  await expect(cards(page)).toHaveCount(1);
});

test('category filter + empty state + reset', async ({ page }) => {
  await page.goto('/catalog.html');
  await page.locator('[data-filter="jds"]').click();
  await expect(page.locator('[data-filter="jds"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(cards(page)).toHaveCount(2);
  for (const c of await cards(page).all()) await expect(c).toContainText('JDS');

  await page.fill('#search', 'zzz-not-a-product');
  await expect(page.getByTestId('no-results')).toBeVisible();
  await page.locator('[data-reset]').click();
  await expect(cards(page)).toHaveCount(6);
  await expect(page.locator('#search')).toHaveValue('');
});

test('add to quote from a card with chosen variant and quantity', async ({ page }) => {
  await page.goto('/catalog.html?q=6616b');
  const card = cards(page).first();
  await card.locator('[data-variant]').selectOption({ label: 'Warm White · 3000K' });
  await card.locator('[data-qty]').fill('25');
  await card.locator('[data-add]').click();
  await expect(page.locator('.ui-toast')).toContainText('6616B');
  await expect(page.locator('.quote-nav-btn [data-quote-count]')).toHaveText('25');

  await page.goto('/quote.html');
  const item = page.getByTestId('quote-item');
  await expect(item).toHaveCount(1);
  await expect(item).toContainText('Warm White · 3000K');
  await expect(item.locator('input')).toHaveValue('25');
});

test('card links to the product page', async ({ page }) => {
  await page.goto('/catalog.html');
  await cards(page).filter({ hasText: '4116B' }).locator('.btn-details').click();
  await expect(page).toHaveURL(/product\.html\?id=4116b/);
  await expect(page.locator('h1.sh-model')).toHaveText('4116B');
});

test('spec sheets read left-to-right (units after numbers)', async ({ page }) => {
  await page.goto('/catalog.html');
  await expect(cards(page).first()).toHaveAttribute('dir', 'ltr');
});
