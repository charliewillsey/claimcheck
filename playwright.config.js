import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 120_000,
  workers: 1,
  reporter: 'list',
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3187/health',
    env: { PORT: '3187', CLAIMS: 'off' },
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
