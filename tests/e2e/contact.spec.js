import { test, expect } from '@playwright/test';

test('home contact form: validation, submit, saved message', async ({ page }) => {
  await page.goto('/#contact');
  await page.locator('#contact-form[data-ready]').waitFor({ state: 'attached' });
  await page.click('#c-submit');
  await expect(page.locator('#ce-message')).toHaveText('נא לכתוב כמה מילים');
  await expect(page.locator('#c-name')).toBeFocused();

  await page.fill('#c-name', 'יוסי');
  await page.fill('#c-phone', '052-9876543');
  await page.fill('#c-email', 'yossi@example.com');
  await page.fill('#c-message', 'מחפש תאורה לשלט של 6 מטר');
  await page.click('#c-submit');
  await expect(page.getByTestId('contact-done')).toBeVisible();
  await expect(page.locator('#contact-form')).toBeHidden();

  const msgs = await page.evaluate(() => JSON.parse(localStorage.getItem('led_demo_messages')));
  expect(msgs).toHaveLength(1);
  expect(msgs[0]).toMatchObject({ name: 'יוסי', phone: '0529876543', message: 'מחפש תאורה לשלט של 6 מטר' });
});

test('home contact form is prefilled for a known customer', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('led_customer_v1', JSON.stringify({ name: 'רון', company: 'X', phone: '0501111111', email: 'r@x.co' })));
  await page.goto('/#contact');
  await expect(page.locator('#c-name')).toHaveValue('רון');
  await expect(page.locator('#c-email')).toHaveValue('r@x.co');
  await expect(page.locator('#c-message')).toHaveValue('');
});

test('no mailto buttons left in the contact section', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#contact button[onclick*="mailto"]')).toHaveCount(0);
});

test('before scripts load, submitting never puts personal data in the URL', async ({ page }) => {
  await page.route('**/assets/*.js', r => r.abort()); // JS never arrives
  await page.goto('/#contact', { waitUntil: 'domcontentloaded' });
  await page.fill('#c-name', 'יוסי');
  await page.fill('#c-phone', '0521234567');
  await page.click('#c-submit');
  await page.waitForTimeout(300);
  expect(page.url()).not.toContain('0521234567');
  expect(page.url()).not.toContain('name=');
});
