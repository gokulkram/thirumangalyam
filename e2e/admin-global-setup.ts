import { chromium, FullConfig } from "@playwright/test";

const BASE = "http://localhost:3001";

export default async function adminGlobalSetup(_config: FullConfig) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE}/admin-login`);
    await page.waitForSelector("text=Admin Login", { timeout: 10_000 });

    await page.getByPlaceholder("admin@thirumangalyam.com").fill("admin@thirumangalyam.com");
    await page.getByPlaceholder(/password/i).fill("admin123");
    await page.getByRole("button", { name: /authenticate/i }).click();

    // Wait for dashboard — if redirected back, credentials are wrong
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15_000 });

    await page.context().storageState({ path: "e2e/admin-auth-state.json" });
    console.log("[Admin Setup] Auth state saved to e2e/admin-auth-state.json");
  } catch (err) {
    console.error("[Admin Setup] Login failed:", err);
    throw err;
  } finally {
    await browser.close();
  }
}
