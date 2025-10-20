import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-tests/specs',
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false, // Sequential for mobile tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker for mobile stability
  reporter: [
    ['html', { outputFolder: 'e2e-reports/html' }],
    ['json', { outputFile: 'e2e-reports/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:8083',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36',
      },
    },
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro'],
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:8083',
    reuseExistingServer: true,
    timeout: 120000,
  },
})
