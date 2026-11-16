import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end UI tests: the production build, in a real browser, with the API
 * answered at the network boundary by a fake (e2e/fakeApi.ts). The server's own
 * behaviour is the unit and integration suite's job; these tests are about what
 * the person using the app sees and does.
 *
 * `npm run test:e2e` builds first (with source maps, into .next-e2e) and then
 * runs this. The global teardown fails the run unless every browser module is
 * 100 % covered — see e2e/coverage.ts and the e2e-ui-coverage skill.
 */

const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  // A test that needs a retry to pass is broken; fix it rather than hide it.
  retries: 0,
  reporter: [['list']],
  globalSetup: './e2e/globalSetup.ts',
  globalTeardown: './e2e/globalTeardown.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // The browser is the one this @playwright/test version installs
    // (`npx playwright install chromium`), locally and on CI alike. Don't point
    // it at a browser the machine happens to have: its revision
    // follows the machine's image, not the lockfile.
    launchOptions: {
      // An HTTP(S)_PROXY in the environment would otherwise swallow localhost.
      args: ['--no-proxy-server'],
    },
  },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'], browserName: 'chromium' } }],
  webServer: {
    command: `next start -p ${PORT}`,
    env: { E2E_COVERAGE: '1' },
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
