import { test, expect } from '@playwright/test';

const sampleAppointments = [
  {
    id: '1',
    start: '2024-01-01T10:00:00.000Z',
    end: '2024-01-01T11:00:00.000Z',
    status: 'BOOKED',
    Client: { id: 'c1', name: 'Maria Schmidt', email: 'maria@example.com', phone: '123' },
    Service: { id: 's1', name: 'Massage', durationMin: 60, priceCents: 8000, category: 'THERAPY' },
    Location: { id: 'l1', name: 'Main Office', type: 'OFFICE', address: 'Street 1' }
  },
  {
    id: '2',
    start: '2024-01-02T12:00:00.000Z',
    end: '2024-01-02T13:00:00.000Z',
    status: 'BOOKED',
    Client: { id: 'c2', name: 'Johann Weber', email: 'johann@example.com', phone: '456' },
    Service: { id: 's2', name: 'Consulting', durationMin: 60, priceCents: 5000, category: 'THERAPY' },
    Location: { id: 'l1', name: 'Main Office', type: 'OFFICE', address: 'Street 1' }
  }
];

test.describe('Appointments', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/appointments', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ appointments: sampleAppointments })
      })
    })
    await page.route('**/api/appointments/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ appointment: sampleAppointments[0] })
      })
    })

    // Sign in first
    await page.goto('/auth/sign-in');
    await page.fill('input[name="email"]', 'test@myoflow.at');
    await page.fill('input[name="password"]', 'demo123');
    
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