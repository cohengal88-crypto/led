import { test, expect } from '@playwright/test';

test('product page shows the full sheet', async ({ page }) => {
  await page.goto('/product.html?id=6616b');
  const sheet = page.getByTestId('product-sheet');
  await expect(sheet.locator('h1')).toHaveText('6616B');
  await expect(sheet.locator('.spec-table tr')).toHaveCount(10);
  await expect(sheet.locator('.ordering-table tbody tr')).toHaveCount(3);
  await expect(sheet.locator('.sh-bottom .bottom-block')).toHaveCount(2);
  await expect(sheet.locator('.ship-cell')).toHaveCount(5);
  await expect(page.locator('#crumb-model')).toHaveText('6616B');
  await expect(page).toHaveTitle(/6616B/);
});

test('clicking an ordering-guide row selects that variant and adds it', async ({ page }) => {
  await page.goto('/product.html?id=6616b');
  const rows = page.locator('.ordering-table tbody tr');
  await rows.nth(2).click();
  await expect(rows.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('.buy-box [data-variant]')).toHaveValue('2');

  await page.locator('.buy-box [data-qty]').fill('100');
  await page.locator('.buy-box [data-add]').click();

  await page.goto('/quote.html');
  await expect(page.getByTestId('quote-item')).toContainText('Warm White · 3000K');
  await expect(page.getByTestId('quote-item').locator('input')).toHaveValue('100');
});

test('same product + same variant merges quantities; different variant is a new line', async ({ page }) => {
  await page.goto('/product.html?id=4116b');
  const add = page.locator('.buy-box [data-add]');
  await add.click();
  await add.click();
  await page.locator('.buy-box [data-variant]').selectOption('1');
  await add.click();
  await page.goto('/quote.html');
  const items = page.getByTestId('quote-item');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0).locator('input')).toHaveValue('2');
});

test('unknown product shows a friendly not-found', async ({ page }) => {
  await page.goto('/product.html?id=does-not-exist');
  await expect(page.getByTestId('not-found')).toBeVisible();
  await page.getByTestId('not-found').getByRole('link').click();
  await expect(page).toHaveURL(/catalog\.html/);
});
