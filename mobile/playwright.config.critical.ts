/**
 * Configuration Playwright pour tests critiques
 * Utilise le serveur Expo déjà en cours d'exécution sur le port 9001
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-tests',
  testMatch: '**/critical-app-load.spec.ts',
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e-reports/critical' }],
  ],
  use: {
    baseURL: 'http://localhost:9001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Pas de webServer - on utilise le serveur déjà en cours
  // Pour lancer les tests : npm run test:critical
})
