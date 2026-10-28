import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  ['home', '/'],
  ['catalog', '/catalog.html'],
  ['catalog search', '/catalog.html?q=15204'],
  ['product (many variants)', '/product.html?id=strips-15189&sku=15204'],
  ['product (single)', '/product.html?id=controllers-15102'],
  ['quote (empty)', '/quote.html'],
];

for (const [label, path] of PAGES) {
  test(`WCAG 2.1 AA: ${label}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = violations.map(v => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
    expect(summary, summary.join('\n')).toEqual([]);
  });
}

test('WCAG 2.1 AA: quote page with items and form errors', async ({ page }) => {
  await page.goto('/product.html?id=pixel-12001');
  await page.locator('.pd [data-add]').click();
  await page.goto('/quote.html');
  await page.click('#submit-btn');
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
});

test('WCAG 2.1 AA: English mode (home + catalog)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('led_lang', 'en'));
  for (const path of ['/', '/catalog.html']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(violations.map(v => `${path} ${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  }
});

test('keyboard: catalog search → card → add to quote works without a mouse', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard flow is desktop');
  await page.goto('/catalog.html');
  await page.locator('#search').focus();
  await page.keyboard.type('12005');
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  const card = page.getByTestId('product-card').first();
  await card.locator('[data-add]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.quote-nav-btn [data-quote-count]')).toHaveText('1');
});
