import { test, expect } from '@playwright/test'

// Smoke tests for admin login flow using demo credentials (guarded by AUTH_ENABLE_DEMO)

test.describe('Admin', () => {
  test('admin root redirects unauthenticated requests to login', async ({ page }) => {
  await page.goto('/admin', { timeout: 60_000 })

  await page.waitForURL('**/admin/login', { timeout: 60_000 })
    expect(page.url()).toContain('/admin/login')
  })

  test('admin demo login redirects to admin dashboard', async ({ page }) => {
  await page.goto('/admin/login', { timeout: 60_000 })

    await page.locator('input#email').fill(process.env.E2E_ADMIN_EMAIL || 'admin@myoflow.at')
    await page.locator('input#password').fill(process.env.E2E_ADMIN_PASSWORD || '')
    await page.getByRole('button', { name: /sign in/i }).click()

  await page.waitForURL('**/admin/dashboard', { timeout: 60_000 })
    expect(page.url()).toContain('/admin/dashboard')
  })
})
