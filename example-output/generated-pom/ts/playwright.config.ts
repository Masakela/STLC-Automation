import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: process.env.APP_BASE_URL || 'http://localhost:7099' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
