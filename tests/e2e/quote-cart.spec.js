import { test, expect } from '@playwright/test';

test('quote page: change quantity, type quantity, remove', async ({ page }) => {
  await page.goto('/product.html?id=mfw8g5d');
  await page.locator('.buy-box [data-qty]').fill('2');
  await page.locator('.buy-box [data-add]').click();

  await page.goto('/');
  await expect(page.locator('.quote-nav-btn [data-quote-count]')).toHaveText('2');
  await expect(page.getByTestId('quote-nav')).toBeVisible();

  await page.goto('/quote.html');
  const items = page.getByTestId('quote-item');
  await expect(items).toHaveCount(1);
  await items.getByRole('button', { name: 'הוסף כמות' }).click();
  await expect(items.locator('input')).toHaveValue('3');
  await items.locator('input').fill('10');
  await items.locator('input').blur();
  await expect(items.locator('input')).toHaveValue('10');
  await expect(page.locator('.quote-nav-btn [data-quote-count]')).toHaveText('10');

  await items.locator('[data-rm]').click();
  await expect(page.getByTestId('quote-empty')).toBeVisible();
});

test('quote badge is hidden when the cart is empty', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-quote-count]').first()).toBeHidden();
});
