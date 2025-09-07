import { test, expect } from '@playwright/test'

test.describe('Home', () => {
  test('shows landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'MyoFlow' })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })
})
