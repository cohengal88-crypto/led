import { test, expect } from '@playwright/test';

test('language toggle switches to English and persists across pages', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    await page.click('#hamburger');
    await page.click('#mm-lang-btn');
  } else {
    await page.click('#lang-toggle');
  }
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('h1 .en-text')).toBeVisible();
  await expect(page.locator('h1 .he-text')).toBeHidden();

  await page.goto('/quote.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.quote-title .en-text')).toBeVisible();
});

test('mobile menu opens and closes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const menu = page.locator('#mobile-menu');
  await page.click('#hamburger');
  await expect(menu).toHaveClass(/open/);
  await expect(page.locator('#hamburger')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveClass(/open/);
});
