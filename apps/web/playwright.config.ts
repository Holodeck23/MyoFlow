import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for MyoFlow
 * Resolves Jules' timeout issues with extended server startup timeout
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'pnpm --filter @myoflow/web dev --port 3001',
    url: 'http://localhost:3001',
    timeout: 180_000, // 3 minutes for server startup - fixes timeout issues
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: process.env.CI 
        ? 'postgresql://postgres:postgres@localhost:5432/myoflow'
        : process.env.DATABASE_URL || 'postgresql://ZOD@localhost:5432/myoflow',
      NEXTAUTH_URL: 'http://localhost:3001',
      NEXTAUTH_SECRET: 'test-secret-for-e2e',
      NODE_ENV: 'test',
    },
  },
});