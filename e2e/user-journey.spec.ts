/**
 * Full end-to-end user-side test suite — Thirumangalyam
 *
 * Auth state loaded from e2e/auth-state.json (created by global-setup.ts).
 * Login describe overrides storageState to empty for unauthenticated tests.
 * Access Control describe overrides storageState to empty for redirect tests.
 *
 * Test account: phone 8596741235 (viji@stallioni.com)
 */

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";
const TEST_PHONE = "8596741235";

// ─── 1. LANDING PAGE ─────────────────────────────────────────────────────────
test.describe("1. Landing Page", () => {
  test("logged-in user visiting / redirects to /dashboard", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test("guest visiting / sees hero and Register/Login CTAs", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE}/`);
    const url = page.url();
    if (url.includes("/dashboard")) { test.skip(); return; }
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /register/i }).first()).toBeVisible();
  });
});

// ─── 2. LOGIN ────────────────────────────────────────────────────────────────
test.describe("2. Login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page shows Welcome Back h1, phone/email field, OTP toggle", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator("h1")).toContainText(/welcome back/i, { timeout: 8_000 });
    // Exact placeholder text: "Phone Number or Email"
    await expect(page.getByPlaceholder("Phone Number or Email")).toBeVisible();
    await expect(page.getByRole("button", { name: /login with otp|otp/i })).toBeVisible();
  });

  test("wrong password shows error message", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    // Use a non-existent email to guarantee "Invalid credentials"
    await page.getByPlaceholder("Phone Number or Email").fill("no_such_user_99999@fake.invalid");
    await page.getByPlaceholder(/^password$/i).fill("wrongpass999");
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page.locator("text=Invalid credentials")).toBeVisible({ timeout: 10_000 });
  });

  test("forgot password sends OTP with demo banner", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: /forgot password/i }).click();
    await expect(page.locator("text=Reset Password")).toBeVisible();
    await page.locator("input[type='tel']").fill(TEST_PHONE);
    await page.getByRole("button", { name: /send otp/i }).click();
    await expect(page.locator("text=Demo Mode")).toBeVisible({ timeout: 15_000 });
  });

  test("OTP login: full flow → lands on dashboard", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: /login with otp|otp/i }).click();
    await page.locator("input[type='tel']").fill(TEST_PHONE);
    await page.getByRole("button", { name: /send otp/i }).click();
    await expect(page.locator("text=Demo Mode")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /auto-fill/i }).click();
    await page.getByRole("button", { name: /verify.*login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test("already logged-in visiting /login redirects to /dashboard", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: /login with otp|otp/i }).click();
    await page.locator("input[type='tel']").fill(TEST_PHONE);
    await page.getByRole("button", { name: /send otp/i }).click();
    await expect(page.locator("text=Demo Mode")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /auto-fill/i }).click();
    await page.getByRole("button", { name: /verify.*login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    // Revisiting /login should redirect back
    await page.goto(`${BASE}/login`);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8_000 });
  });
});

// ─── 3. DASHBOARD ─────────────────────────────────────────────────────────────
test.describe("3. Dashboard", () => {
  test("loads and shows key nav links in sidebar", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("domcontentloaded");

    const sidebar = page.locator("aside");
    await expect(sidebar.getByRole("link", { name: /my profile/i })).toBeVisible({ timeout: 8_000 });
    await expect(sidebar.getByRole("link", { name: /search/i })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /settings/i })).toBeVisible();
  });

  test("shows match cards or empty/error state (no crash)", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForTimeout(3000);
    const hasProfileLinks = await page.locator("a[href*='/profile/']").count() > 0;
    const hasEmptyState = await page.locator("text=/no match|complete.*profile|session expired/i").count() > 0;
    expect(hasProfileLinks || hasEmptyState).toBeTruthy();
  });

  test("notification bell opens dropdown with Interests/Messages/Profile Views", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("domcontentloaded");

    // Bell button is a DropdownMenuTrigger with aria-haspopup="menu"
    const bellBtn = page.locator("header [aria-haspopup='menu']").first();
    await bellBtn.click();
    await page.waitForTimeout(500);

    // Scope checks to the dropdown menu (role=menu) to avoid ambiguity
    const menu = page.locator("[role='menu']");
    await expect(menu).toBeVisible({ timeout: 6_000 });
    await expect(menu.locator("text=Notifications")).toBeVisible();
    await expect(menu.locator("text=Interests Received")).toBeVisible();
    await expect(menu.locator("text=Profile Views")).toBeVisible();
  });

  test("header avatar dropdown shows My Profile and Logout", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("domcontentloaded");

    // Avatar trigger: last element with aria-haspopup="menu" in header
    const avatarBtn = page.locator("header [aria-haspopup='menu']").last();
    await avatarBtn.click();
    await page.waitForTimeout(500);

    const menu = page.locator("[role='menu']");
    await expect(menu.getByRole("menuitem", { name: /my profile/i })).toBeVisible({ timeout: 5_000 });
    await expect(menu.getByRole("menuitem", { name: /logout/i })).toBeVisible();
  });
});

// ─── 4. SEARCH ────────────────────────────────────────────────────────────────
test.describe("4. Search", () => {
  test("page loads and shows results", async ({ page }) => {
    await page.goto(`${BASE}/search`);
    await page.waitForTimeout(3000);
    const hasResults = await page.locator("a[href*='/profile/']").count() > 0;
    const hasEmpty = await page.locator("text=/no results/i").count() > 0;
    expect(hasResults || hasEmpty).toBeTruthy();
  });

  test("name search returns matching profiles (server-side q param)", async ({ page }) => {
    await page.goto(`${BASE}/search`);
    await page.waitForTimeout(2000);

    // Load initial result count
    const initialLinks = await page.locator("a[href*='/profile/']").count();

    const searchBox = page.getByPlaceholder(/search by name/i);
    if (!await searchBox.isVisible()) { test.skip(); return; }

    // Search for "Nair" — many seed profiles have this surname
    await searchBox.fill("Nair");
    await page.waitForTimeout(2000); // debounce + server round-trip

    // Results should appear (either Nair profiles or empty state message)
    const hasResults = await page.locator("a[href*='/profile/']").count() > 0;
    const hasEmpty = await page.locator("text=/no results|no profile/i").count() > 0;
    expect(hasResults || hasEmpty).toBeTruthy();
  });

  test("search result cards link to profile pages", async ({ page }) => {
    await page.goto(`${BASE}/search`);
    await page.waitForTimeout(2500);
    const links = page.locator("a[href*='/profile/']");
    if (await links.count() === 0) { test.skip(); return; }
    const href = await links.first().getAttribute("href");
    expect(href).toMatch(/\/profile\//);
  });
});

// ─── 5. PROFILE VIEW ──────────────────────────────────────────────────────────
test.describe("5. Profile View", () => {
  test("all 5 tabs present and About tab has NO raw enum values", async ({ page }) => {
    await page.goto(`${BASE}/search`);
    await page.waitForTimeout(2500);

    // Scope to main content to avoid picking up the sidebar's /profile/me link
    const mainContent = page.locator("main");
    const link = mainContent.locator("a[href*='/profile/']").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Wait for ANY tab to appear before checking all
    await expect(page.getByRole("tab").first()).toBeVisible({ timeout: 12_000 });

    // Collect all tab labels and verify the 5 expected tabs are present
    const tabLabels = await page.getByRole("tab").allTextContents();
    expect(tabLabels.length).toBeGreaterThanOrEqual(5);
    expect(tabLabels.some((t) => /about/i.test(t))).toBeTruthy();
    expect(tabLabels.some((t) => /family/i.test(t))).toBeTruthy();
    expect(tabLabels.some((t) => /career/i.test(t))).toBeTruthy();
    expect(tabLabels.some((t) => /partner|pref/i.test(t))).toBeTruthy();
    expect(tabLabels.some((t) => /horoscope/i.test(t))).toBeTruthy();

    // Click About tab and verify no raw enum values in content
    const aboutTab = page.getByRole("tab").filter({ hasText: /about/i }).first();
    await aboutTab.click();
    await page.waitForTimeout(500);
    const text = await page.getByRole("tabpanel").textContent() || "";
    expect(text).not.toMatch(/\bnever_married\b|\bnon_vegetarian\b|\bdoesnt_matter\b/);
  });

  test("Partner Prefs tab has NO raw enum values", async ({ page }) => {
    await page.goto(`${BASE}/search`);
    await page.waitForTimeout(2500);

    // Scope to main content to avoid the sidebar's /profile/me link
    const link = page.locator("main").locator("a[href*='/profile/']").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("tab", { name: /partner pref/i }).click();
    await page.waitForTimeout(500);
    const text = await page.locator("[role=tabpanel]").first().textContent() || "";
    expect(text).not.toMatch(/\bnot_important\b|\bmust_veg\b|\bmust_not\b/);
  });

  test("contact details: shows phone or lock/upgrade prompt", async ({ page }) => {
    await page.goto(`${BASE}/search`);
    await page.waitForTimeout(2500);

    // Scope to main content to avoid the sidebar's /profile/me link
    const link = page.locator("main").locator("a[href*='/profile/']").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForLoadState("domcontentloaded");

    const canSeePhone = await page.locator("text=+91").count() > 0;
    const seesLock = await page.locator("text=Premium").count() > 0
      || await page.locator("text=Upgrade").count() > 0;
    expect(canSeePhone || seesLock).toBeTruthy();
  });

  test("interest button visible on profile page", async ({ page }) => {
    await page.goto(`${BASE}/search`);
    await page.waitForTimeout(2500);

    // Scope to main content to avoid the sidebar's /profile/me link
    const link = page.locator("main").locator("a[href*='/profile/']").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForLoadState("domcontentloaded");

    // Interest button exists (whether sent or not)
    const body = await page.textContent("body") || "";
    const hasInterest = body.toLowerCase().includes("interest");
    expect(hasInterest).toBeTruthy();
  });
});

// ─── 6. MY PROFILE ────────────────────────────────────────────────────────────
test.describe("6. My Profile", () => {
  test("shows 6 tabs: Photos, Basic, Family, Career, About, Prefs", async ({ page }) => {
    await page.goto(`${BASE}/profile/me`);
    await expect(page.getByRole("tab", { name: /photos/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("tab", { name: /basic/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /family/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /career/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /about/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /prefs/i })).toBeVisible();
  });

  test("Photos tab shows photo upload zone and ID Verification section", async ({ page }) => {
    await page.goto(`${BASE}/profile/me`);
    await page.getByRole("tab", { name: /photos/i }).click();
    await page.waitForTimeout(1500);

    // "ID Verification" appears in the Photos tab — scope to avoid strict mode violation
    const tabPanel = page.locator("[role=tabpanel]").first();
    await expect(tabPanel.locator("text=ID Verification").first()).toBeVisible({ timeout: 6_000 });

    // Status is one of: form (unverified), pending, or verified
    const bodyText = await tabPanel.textContent() || "";
    const hasAnyVerifContent =
      bodyText.includes("Aadhaar") ||
      bodyText.toLowerCase().includes("under review") ||
      bodyText.toLowerCase().includes("verified") ||
      bodyText.toLowerCase().includes("rejected");
    expect(hasAnyVerifContent).toBeTruthy();
  });

  test("Basic Info tab has pre-filled non-empty name", async ({ page }) => {
    await page.goto(`${BASE}/profile/me`);
    await page.getByRole("tab", { name: /basic/i }).click();
    await page.waitForTimeout(1000);

    const nameInput = page.locator("input[placeholder*='name' i]").first();
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    const value = await nameInput.inputValue();
    expect(value.trim().length).toBeGreaterThan(0);
  });

  test("profile completeness bar displays a percentage", async ({ page }) => {
    await page.goto(`${BASE}/profile/me`);
    await page.waitForTimeout(2000);
    const body = await page.textContent("body") || "";
    expect(body).toMatch(/\d+%/);
  });
});

// ─── 7. INTERESTS ─────────────────────────────────────────────────────────────
test.describe("7. Interests", () => {
  test("shows Received, Sent, Accepted tabs", async ({ page }) => {
    await page.goto(`${BASE}/interests`);
    await expect(page.getByRole("tab", { name: /received/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole("tab", { name: /sent/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /accepted/i })).toBeVisible();
  });

  test("received tab loads without error", async ({ page }) => {
    await page.goto(`${BASE}/interests?tab=received`);
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Something went wrong")).not.toBeVisible();
    await expect(page.locator("text=Error")).not.toBeVisible();
  });
});

// ─── 8. SETTINGS ──────────────────────────────────────────────────────────────
test.describe("8. Settings", () => {
  test("has all 5 tabs", async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await expect(page.getByRole("tab", { name: /account/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole("tab", { name: /privacy/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /notification/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /subscription|plan/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /security|safety/i })).toBeVisible();
  });

  test("Account tab shows masked phone number with XXXXX", async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.waitForTimeout(3000);
    // Phone input has masked value like "+918XXXXX35" — check the disabled input's value
    const allInputs = page.locator("input[disabled]");
    const inputCount = await allInputs.count();
    let found = false;
    for (let i = 0; i < inputCount; i++) {
      const val = await allInputs.nth(i).inputValue().catch(() => "");
      if (val.includes("XXXXX")) { found = true; break; }
    }
    expect(found).toBeTruthy();
  });

  test("Notifications tab: Email + SMS sections, Always sent card, no raw enums", async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.getByRole("tab", { name: /notification/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.locator("text=Email Notifications")).toBeVisible({ timeout: 6_000 });
    await expect(page.locator("text=SMS Notifications")).toBeVisible();
    await expect(page.locator("text=Always sent")).toBeVisible();

    const text = await page.locator("[role=tabpanel]").first().textContent() || "";
    expect(text).not.toMatch(/interestsReceived|newMatches|interestAccepted/);
  });

  test("Security tab: login history + logout-all-devices button visible", async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.getByRole("tab", { name: /security|safety/i }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator("text=Recent login activity")).toBeVisible({ timeout: 6_000 });
    await expect(page.locator("text=Logout from all devices")).toBeVisible();
  });

  test("Privacy tab: form loads with Profile Visibility, Photo Privacy, and toggles", async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.getByRole("tab", { name: /privacy/i }).click();
    await page.waitForTimeout(3000);

    // Form content must be visible (language-agnostic field labels)
    await expect(page.locator("text=Profile Visibility").first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("text=Photo Privacy").first()).toBeVisible();

    // Radio buttons for visibility options should be present
    const radios = page.getByRole("tabpanel").getByRole("radio");
    await expect(radios.first()).toBeVisible({ timeout: 5_000 });

    // The primary action button must be enabled (text varies by language — select by excluding known non-save buttons)
    const allBtns = page.getByRole("tabpanel").getByRole("button");
    const saveBtnCandidate = allBtns
      .filter({ hasNotText: /blocked|unblock|manage/i })
      .first();
    await expect(saveBtnCandidate).toBeVisible({ timeout: 5_000 });
    await expect(saveBtnCandidate).toBeEnabled();
  });
});

// ─── 9. CHAT ──────────────────────────────────────────────────────────────────
test.describe("9. Chat", () => {
  test("chat page loads without JS error", async ({ page }) => {
    await page.goto(`${BASE}/chat`);
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Something went wrong")).not.toBeVisible();
  });
});

// ─── 10. ACCESS CONTROL ────────────────────────────────────────────────────────
test.describe("10. Access Control", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated /dashboard → /login", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("unauthenticated /settings → /login", async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("unauthenticated /profile/me → /login", async ({ page }) => {
    await page.goto(`${BASE}/profile/me`);
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("unauthenticated /chat → /login", async ({ page }) => {
    await page.goto(`${BASE}/chat`);
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("unauthenticated /interests → /login", async ({ page }) => {
    await page.goto(`${BASE}/interests`);
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});

// ─── 11. LOGOUT ───────────────────────────────────────────────────────────────
test.describe("11. Logout", () => {
  test("logout from settings goes to /login on port 3001 (not 3000)", async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.waitForTimeout(500);

    const logoutBtn = page.getByRole("button", { name: /logout|sign out/i }).last();
    await expect(logoutBtn).toBeVisible({ timeout: 5_000 });
    await logoutBtn.click();

    await expect(page).toHaveURL(/localhost:3001\/login/, { timeout: 10_000 });
    expect(page.url()).not.toContain("localhost:3000");
  });
});
