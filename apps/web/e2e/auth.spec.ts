import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should load sign-in page', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Check for sign-in form elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should authenticate with demo credentials', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Fill in demo credentials (any email with 'demo' password works)
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill('demo');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to sign-in page
    await expect(page).toHaveURL('/auth/sign-in');
  });
});