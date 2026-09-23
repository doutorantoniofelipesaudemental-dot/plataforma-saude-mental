// Suíte E2E (npm run test:e2e). Sem E2E_BASE_URL, sobe o servidor local
// (precisa de MONGODB_URI no .env — o SSR consulta o banco real). Para auditar
// a produção: E2E_BASE_URL=https://drsaudemental.vercel.app npm run test:e2e
const { defineConfig } = require('@playwright/test');

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

module.exports = defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  workers: 6,
  timeout: 10 * 60_000,
  reporter: [['list']],
  use: { baseURL },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'node --env-file-if-exists=.env index.js',
        url: `${baseURL}/api/health`,
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
