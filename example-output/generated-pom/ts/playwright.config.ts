import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: process.env.APP_BASE_URL || 'http://127.0.0.1:8143' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
