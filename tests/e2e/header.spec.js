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

test('English header: top links and categories are shown in English', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop header only');
  await page.addInitScript(() => localStorage.setItem('led_lang', 'en'));
  await page.goto('/');
  await expect(page.locator('.top-links a[href$="#contact"]')).toHaveText('Contact', { useInnerText: true });
  await expect(page.locator('.cat-nav a[href$="cat=neon"]')).toHaveText('Neon', { useInnerText: true });
});

test('header search goes to the catalog with the query', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) { await page.click('#hamburger'); await page.fill('#mm-q', '15204'); await page.press('#mm-q', 'Enter'); }
  else { await page.fill('#site-q', '15204'); await page.press('#site-q', 'Enter'); }
  await expect(page).toHaveURL(/catalog\.html\?q=15204/);
  await expect(page.locator('#search')).toHaveValue('15204');
  await expect(page.getByTestId('product-card')).toHaveCount(1);
});

test('home shows every category with its product count', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#cat-grid .cat-card:not(.cat-card--all)');
  await expect(cards).toHaveCount(7);
  await expect(cards.filter({ hasText: 'ניאון לד' })).toContainText('13');
  await expect(page.locator('.hero [data-count-skus]')).toHaveText('671');
});
