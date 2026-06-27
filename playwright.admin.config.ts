import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "admin-journey.spec.ts",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report-admin" }]],
  globalSetup: "./e2e/admin-global-setup.ts",
  use: {
    baseURL: "http://localhost:3001",
    headless: true,
    screenshot: "only-on-failure",
    video: "off",
    storageState: "e2e/admin-auth-state.json",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
