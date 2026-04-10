import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/integration',
  timeout: 30_000,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
  },
})
