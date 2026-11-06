import { defineConfig, devices } from '@playwright/test';

const iphone = { ...devices['iPhone 13'] };
// Usa o Chromium pré-instalado com viewport/UA de iPhone (WebKit não está disponível neste ambiente).
delete (iphone as Record<string, unknown>).defaultBrowserType;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'off', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' },
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    { name: 'iphone', use: { ...iphone, browserName: 'chromium' }, testIgnore: /desktop\.spec\.ts/ },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testMatch: /desktop\.spec\.ts/ }
  ]
});
