/**
 * Runs once before all tests.
 * Logs in via OTP (demo mode) and saves auth cookies to e2e/auth-state.json
 * so all tests can reuse the session without re-logging in.
 */

import { chromium, FullConfig } from "@playwright/test";

const BASE = "http://localhost:3001";
const TEST_PHONE = "8596741235";

export default async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE}/login`);
    await page.waitForSelector("h1", { timeout: 10_000 });

    // Switch to OTP login
    const otpBtn = await page.getByRole("button", { name: /login with otp|otp/i });
    await otpBtn.click();

    // Enter phone and send OTP
    await page.getByLabel(/phone number/i).fill(TEST_PHONE);
    await page.getByRole("button", { name: /send otp/i }).click();

    // Wait for demo OTP banner
    await page.waitForSelector("text=Demo Mode", { timeout: 15_000 });

    // Auto-fill OTP
    await page.getByRole("button", { name: /auto-fill/i }).click();

    // Verify
    await page.getByRole("button", { name: /verify.*login/i }).click();

    // Wait for dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    // Save auth state
    await page.context().storageState({ path: "e2e/auth-state.json" });
    console.log("[Setup] Auth state saved to e2e/auth-state.json");
  } catch (err) {
    console.error("[Setup] Login failed:", err);
    throw err;
  } finally {
    await browser.close();
  }
}
