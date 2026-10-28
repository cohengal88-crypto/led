import { test, expect } from '@playwright/test';

test('adding from the catalog updates the header badge and the quote page', async ({ page }) => {
  await page.goto('/catalog.html');
  const firstQuoteBtn = page.locator('.sheet:not(.hidden) .btn-order').first();
  await firstQuoteBtn.click();
  await firstQuoteBtn.click();
  await expect(page.locator('#cart-count')).toHaveText('2');

  await page.goto('/');
  await expect(page.locator('.quote-nav-btn [data-quote-count]')).toHaveText('2');
  await expect(page.getByTestId('quote-nav')).toBeVisible();

  await page.goto('/quote.html');
  const items = page.getByTestId('quote-item');
  await expect(items).toHaveCount(1);
  await expect(items.locator('input')).toHaveValue('2');

  await items.getByRole('button', { name: 'הוסף כמות' }).click();
  await expect(items.locator('input')).toHaveValue('3');
  await items.locator('input').fill('10');
  await items.locator('input').blur();
  await expect(items.locator('input')).toHaveValue('10');

  await items.locator('[data-rm]').click();
  await expect(page.getByTestId('quote-empty')).toBeVisible();
});

test('quote badge is hidden when the cart is empty', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-quote-count]').first()).toBeHidden();
});
