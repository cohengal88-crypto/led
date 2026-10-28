import { test, expect } from '@playwright/test';
import { trackErrors, PAGES } from './helpers.js';

for (const pg of PAGES) {
  test.describe(pg.path, () => {
    test('loads without JS errors, RTL, title', async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(pg.path);
      await page.waitForLoadState('load');
      await expect(page).toHaveTitle(pg.title);
      expect(await page.getAttribute('html', 'dir')).toBe('rtl');
      expect(errors, errors.join('\n')).toEqual([]);
    });

    test('no horizontal overflow', async ({ page }) => {
      await page.goto(pg.path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });

    test('internal links resolve', async ({ page, request }) => {
      await page.goto(pg.path);
      const hrefs = await page.$$eval('a[href]', as => [...new Set(as
        .map(a => a.getAttribute('href'))
        .filter(h => h && !/^(#|mailto:|tel:|https?:)/.test(h))
        .map(h => h.replace(/#.*$/, '').replace(/^\.\//, '/')))]);
      for (const h of hrefs) {
        const res = await request.get(h.startsWith('/') ? h : '/' + h);
        expect(res.status(), h).toBe(200);
      }
    });
  });
}

test('no links to the removed customer portal', async ({ page }) => {
  for (const pg of PAGES) {
    await page.goto(pg.path);
    await expect(page.locator('a[href*="portal.html"], a[href*="ledtech.html"]')).toHaveCount(0);
  }
});
