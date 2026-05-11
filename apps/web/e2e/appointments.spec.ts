import { test, expect } from '@playwright/test';

test.describe('Appointments', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in first
    await page.goto('/auth/sign-in');
    await page.fill('input[name="email"]', process.env.E2E_DEMO_EMAIL || 'test@myoflow.at');
    await page.fill('input[name="password"]', process.env.E2E_DEMO_PASSWORD || '');
    
    // Wait for both navigation and sign-in to complete
    await Promise.all([
      page.waitForURL('/dashboard', { timeout: 10000 }),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);
  });

  test('should display appointments list', async ({ page }) => {
    // Navigate to appointments
    await page.getByRole('link', { name: /appointments/i }).click();
    await page.waitForURL('/dashboard/appointments');
    
    // Check page loaded
    await expect(page.getByText('Appointments')).toBeVisible();
    
    // Should have appointment data
    await expect(page.getByText('Maria Schmidt')).toBeVisible();
    await expect(page.getByText('Johann Weber')).toBeVisible();
  });

  test('should navigate to appointment detail', async ({ page }) => {
    // Go to appointments list
    await page.goto('/dashboard/appointments');
    
    // Click on first appointment
    await page.getByText('Maria Schmidt').click();
    
    // Should navigate to detail page
    await expect(page.url()).toContain('/dashboard/appointments/');
    await expect(page.getByText('Maria Schmidt')).toBeVisible();
    await expect(page.getByText('Appointment Time')).toBeVisible();
    await expect(page.getByText('Service Details')).toBeVisible();
  });

  test('should show appointment details correctly', async ({ page }) => {
    // Go directly to appointments list and click first appointment
    await page.goto('/dashboard/appointments');
    await page.getByText('Maria Schmidt').click();
    
    // Check all sections are present
    await expect(page.getByText('📅 Appointment Time')).toBeVisible();
    await expect(page.getByText('💆‍♀️ Service Details')).toBeVisible();
    await expect(page.getByText('👤 Client Information')).toBeVisible();
    await expect(page.getByText('📍 Location')).toBeVisible();
    
    // Check back navigation
    await page.getByText('← Back to Appointments').click();
    await expect(page.url()).toContain('/dashboard/appointments');
  });
});