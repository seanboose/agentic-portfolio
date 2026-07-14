import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:4000",
  },
  webServer: {
    // NODE_ENV=development pinned explicitly so e2e always runs against dev-safe
    // config (once one exists), never whatever's ambient — this exercises the real
    // production code path (built dist/, SPA fallback) with test-safe values, not
    // real prod config/data.
    command: "NODE_ENV=development npm run build --prefix .. && NODE_ENV=development npm run start --prefix ..",
    url: "http://localhost:4000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
