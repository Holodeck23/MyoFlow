import { test, expect } from '@playwright/test'
import { loginAsDemo, ensureSignedOut } from './utils'

test.describe('Invoices workflow', () => {
  test.beforeEach(async ({ page }) => {
    await ensureSignedOut(page)
    await loginAsDemo(page)
  })

  test('create invoice and download PDF', async ({ page }) => {
    const uniqueSuffix = Date.now()
    const clientEmail = `qa-${uniqueSuffix}@example.com`
    const clientName = `QA Invoice ${uniqueSuffix}`

    const clientResponse = await page.request.post('/api/clients', {
      data: {
        name: clientName,
        email: clientEmail,
        street: 'Praterstraße 1',
        postalCode: '1020',
        city: 'Wien',
        country: 'Austria'
      }
    })

    expect(clientResponse.status()).toBe(201)
    const client = await clientResponse.json()

    await page.goto('/dashboard/invoices/new')

    await page.waitForSelector('#clientId')
    await page.selectOption('#clientId', client.id)

    // Service date defaults to today; ensure field contains a valid iso formatted date
    const todayIso = await page.evaluate(() => new Date().toISOString().slice(0, 10))
    await page.fill('#serviceDate', todayIso)
    await page.locator('#serviceDate').press('Enter')

    await page.getByRole('button', { name: 'Create Invoice' }).click()

    await page.waitForURL(/\/dashboard\/invoices\/[a-zA-Z0-9-]+/)
    await expect(page.getByText(clientName)).toBeVisible()

    const fakePdf = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'
    await page.route(/\/api\/invoices\/.*\/pdf$/, async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/pdf'
        },
        body: fakePdf
      })
    })

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'PDF' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    expect(await download.failure()).toBeNull()
  })
})
