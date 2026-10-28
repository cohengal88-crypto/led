import { test, expect } from '@playwright/test';

test('product page: name, SKU, variants, specs', async ({ page }) => {
  await page.goto('/product.html?id=pixel-12001');
  const pd = page.getByTestId('product-detail');
  await expect(pd.locator('h1')).toContainText('לד נעיצה 9');
  await expect(pd.locator('[data-sku]')).toHaveText('12001');
  await expect(pd.locator('input[data-variant]')).toHaveCount(11);
  await expect(pd.locator('.pd-specs')).toContainText('12V');
  await expect(page).toHaveTitle(/לד נעיצה 9/);
});

test('?sku= pre-selects the variant; choosing another updates SKU and URL', async ({ page }) => {
  await page.goto('/product.html?id=pixel-12001&sku=12005');
  const pd = page.getByTestId('product-detail');
  await expect(pd.locator('[data-sku]')).toHaveText('12005');
  await expect(pd.getByLabel(/ירוק/)).not.toBeChecked();
  await pd.locator('label', { hasText: 'ירוק' }).click();
  await expect(pd.locator('[data-sku]')).toHaveText('12004');
  await expect(page).toHaveURL(/sku=12004/);
  await expect(pd.locator('[data-source]')).toContainText('ירוק');
});

test('variants are a keyboard-operable radio group', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard');
  await page.goto('/product.html?id=pixel-12001');
  await page.locator('#var-0').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#var-1')).toBeChecked();
  await expect(page.locator('[data-sku]')).toHaveText('12002');
});

test('adding two variants creates two quote lines with their SKUs', async ({ page }) => {
  await page.goto('/product.html?id=pixel-12001');
  await page.locator('#pd-qty').fill('500');
  await page.locator('.pd [data-add]').click();
  await page.locator('label', { hasText: 'כחול' }).click();
  await page.locator('.pd [data-add]').click();
  await page.goto('/quote.html');
  const items = page.getByTestId('quote-item');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText('12001');
  await expect(items.nth(0).locator('input')).toHaveValue('500');
  await expect(items.nth(1)).toContainText('12005');
});

test('single-variant product has no variant picker', async ({ page }) => {
  await page.goto('/product.html?id=controllers-15102');
  await expect(page.locator('input[data-variant]')).toHaveCount(0);
  await expect(page.locator('[data-sku]')).toHaveText('15102');
});

test('unknown product shows a friendly not-found', async ({ page }) => {
  await page.goto('/product.html?id=does-not-exist');
  await expect(page.getByTestId('not-found')).toBeVisible();
  await page.getByTestId('not-found').getByRole('link').click();
  await expect(page).toHaveURL(/catalog\.html/);
});

test('product page suggests similar products and matching controllers', async ({ page }) => {
  await page.goto('/product.html?id=strips-15189&sku=15204');
  const similar = page.getByTestId('rel-similar').getByTestId('related-item');
  await expect(similar).toHaveCount(4);
  for (const href of await similar.evaluateAll(as => as.map(a => a.getAttribute('href')))) expect(href).toMatch(/id=strips-/);
  const ctrl = page.getByTestId('rel-controllers').getByTestId('related-item');
  expect(await ctrl.count()).toBeGreaterThan(0);
  for (const href of await ctrl.evaluateAll(as => as.map(a => a.getAttribute('href')))) expect(href).toMatch(/id=controllers-/);
  await similar.first().click();
  await expect(page.getByTestId('product-detail')).toBeVisible();
});

test('pixel LEDs suggest pixel controllers; controllers get no controller suggestions', async ({ page }) => {
  await page.goto('/product.html?id=pixel-12001');
  await expect(page.getByTestId('rel-controllers')).toContainText('נעיצה');
  await page.goto('/product.html?id=controllers-15102');
  await expect(page.getByTestId('rel-similar')).toBeVisible();
  await expect(page.getByTestId('rel-controllers')).toHaveCount(0);
});
