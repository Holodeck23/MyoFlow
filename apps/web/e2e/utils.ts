import { type Page, expect } from '@playwright/test'

const DEMO_EMAIL = process.env.E2E_DEMO_EMAIL || 'test@myoflow.at'
const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD || 'demo123'

export async function loginAsDemo(page: Page) {
  await page.goto('/auth/sign-in', { waitUntil: 'domcontentloaded' })

  // Wait for React hydration (2 seconds)
  await page.waitForTimeout(2000)

  const emailInput = page.locator('input[name="email"]')
  const passwordInput = page.locator('input[name="password"]')

  // Ensure inputs are visible and enabled
  await expect(emailInput).toBeVisible({ timeout: 10_000 })
  await expect(emailInput).toBeEnabled({ timeout: 10_000 })
  await expect(passwordInput).toBeVisible({ timeout: 10_000 })
  await expect(passwordInput).toBeEnabled({ timeout: 10_000 })

  // Click into field and use pressSequentially (types char-by-char, triggers React properly)
  await emailInput.click()
  await emailInput.pressSequentially(DEMO_EMAIL, { delay: 100 })

  await passwordInput.click()
  await passwordInput.pressSequentially(DEMO_PASSWORD, { delay: 100 })

  // Give React a moment to process the final character
  await page.waitForTimeout(300)

  // Button should now be enabled
  const signInButton = page.getByRole('button', { name: 'Sign in', exact: true })
  await expect(signInButton).toBeEnabled({ timeout: 10_000 })
  await signInButton.click()

  try {
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 })
  } catch (error) {
    const currentUrl = page.url()
    const alertText = await page.locator('[role="alert"]').first().innerText().catch(() => '')
    const screenshot = await page.screenshot({ fullPage: true }).catch(() => null)
    throw new Error(
      `Demo sign-in did not redirect within 30s (url=${currentUrl})${alertText ? ` – message: ${alertText}` : ''}${screenshot ? ' [screenshot captured]' : ''}`
    )
  }

  // If landed on onboarding, navigate to dashboard
  if (page.url().includes('/onboarding')) {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  }

  await page.waitForLoadState('domcontentloaded')
}

export async function ensureSignedOut(page: Page) {
  await page.context().clearCookies()
  await page.goto('/auth/sign-in', { waitUntil: 'domcontentloaded' })
  // Wait for sign-in form to be visible
  await page.locator('#email').waitFor({ state: 'visible', timeout: 10_000 })
}
