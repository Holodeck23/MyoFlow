import { test, expect } from '@playwright/test'

// Smoke tests for admin login flow using demo credentials (guarded by AUTH_ENABLE_DEMO)

test.describe('Admin', () => {
  test('admin demo login redirects to admin dashboard', async ({ page }) => {
    await page.goto('/admin/login')

    await page.locator('input#email').fill('admin@myoflow.at')
    await page.locator('input#password').fill('admin123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForURL('**/admin/dashboard', { timeout: 30_000 })
    expect(page.url()).toContain('/admin/dashboard')
  })
})
