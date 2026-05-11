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
    
    // Fill in demo credentials (using the documented demo credentials)
    await page.getByRole('textbox', { name: /email/i }).fill(process.env.E2E_DEMO_EMAIL || 'test@myoflow.at');
    await page.getByRole('textbox', { name: /password/i }).fill(process.env.E2E_DEMO_PASSWORD || '');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for either success message or redirect
    const successMessageLocator = page.locator('text=Sign in successful! Redirecting...');
    const errorMessageLocator = page.locator('text=Invalid email or password');
    
    // Wait for either success or error message to appear
    try {
      await Promise.race([
        successMessageLocator.waitFor({ timeout: 5000 }),
        errorMessageLocator.waitFor({ timeout: 5000 })
      ]);
      
      // Check if we got success message
      if (await successMessageLocator.isVisible()) {
        console.log('✅ Success message appeared');
        // Wait for the redirect (the code sets a 1-second timeout)
        await page.waitForURL('/dashboard', { timeout: 10000 });
      } else if (await errorMessageLocator.isVisible()) {
        const errorText = await errorMessageLocator.textContent();
        console.log('❌ Authentication failed:', errorText);
        throw new Error('Authentication failed with credentials');
      }
    } catch (error) {
      console.log('⚠️  No success/error message appeared, checking URL directly');
      // If no message, check if we redirected anyway
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      if (!currentUrl.includes('/dashboard')) {
        throw new Error('Authentication did not redirect to dashboard');
      }
    }
    
    // Final verification - should be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to sign-in page
    await expect(page).toHaveURL('/auth/sign-in');
  });
});