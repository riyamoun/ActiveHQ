import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3002'

export default defineConfig({
  testDir: './tests',
  // First navigation after webServer is "ready" can still wait on Vite cold compile.
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  // Local runs share a single Vite dev server; parallel navigation can flake (ERR_ABORTED / HMR).
  // CI runs against a static server and can safely parallelize.
  fullyParallel: Boolean(process.env.CI),
  workers: process.env.CI ? undefined : 1,
  retries: 0,
  reporter: 'list',
  // Local dev ergonomics: start Vite automatically unless CI already started a server
  // (GitHub Actions uses `nohup npm run dev ... &` + `PLAYWRIGHT_BASE_URL`).
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: 'npm run dev -- --host 127.0.0.1 --port 3002 --strictPort',
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }),
  use: {
    baseURL,
    trace: 'on-first-retry',
    navigationTimeout: 90_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
