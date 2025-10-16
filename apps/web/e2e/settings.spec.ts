import { test, expect } from '@playwright/test';

test('save profile settings', async ({ page }) => {
  await page.goto('/dashboard/settings');
  await page.fill('input[name="businessName"]', 'Praxis Müller');
  await page.fill('input[name="uidNumber"]', 'ATU12345678');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=successfully')).toBeVisible();
});

test('show validation error for invalid postal', async ({ page }) => {
  await page.goto('/dashboard/settings');
  await page.click('text=Travel');
  await page.fill('input[name="basePostalCode"]', '1234');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=4xxx')).toBeVisible();
});
