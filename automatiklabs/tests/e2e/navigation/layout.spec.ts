import { test, expect } from "@playwright/test";

/**
 * E2E tests for Epic E5 — Navigation & Layout.
 *
 * These tests require a running dev server with a valid Supabase backend.
 * Protected routes redirect unauthenticated users to /login, so we test
 * structural elements on the login-gated pages via authenticated state
 * where possible, and also verify unauthenticated behavior.
 */

test.describe("NAV-01: Sidebar Toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Go to a public page first, then try to navigate to feed
    // Feed is protected, so we test sidebar on the login page if needed
    // or rely on test user auth setup
    await page.goto("/login");
  });

  test("login page loads correctly as baseline", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });
});

test.describe("NAV-01: Sidebar Toggle (Authenticated)", () => {
  // Use auth state from environment or skip
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    "Requires TEST_USER_EMAIL and TEST_USER_PASSWORD env vars"
  );

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.locator("#email").fill(process.env.TEST_USER_EMAIL!);
    await page.locator("#password").fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    // Wait for redirect to /feed
    await page.waitForURL("**/feed**", { timeout: 15000 });
  });

  test("sidebar starts collapsed at 56px", async ({ page }) => {
    const sidebar = page.getByTestId("left-sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveAttribute("data-expanded", "false");

    const box = await sidebar.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeCloseTo(56, -1);
  });

  test("clicking toggle expands sidebar to ~220px", async ({ page }) => {
    const toggle = page.getByTestId("sidebar-toggle");
    await expect(toggle).toBeVisible();

    await toggle.click();

    const sidebar = page.getByTestId("left-sidebar");
    await expect(sidebar).toHaveAttribute("data-expanded", "true");

    // Wait for CSS transition
    await page.waitForTimeout(300);

    const box = await sidebar.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThanOrEqual(200);
    expect(box!.width).toBeLessThanOrEqual(240);
  });

  test("expanded sidebar shows text labels", async ({ page }) => {
    const toggle = page.getByTestId("sidebar-toggle");
    await toggle.click();

    // Wait for transition
    await page.waitForTimeout(300);

    const feedLabel = page.getByTestId("nav-label-feed");
    await expect(feedLabel).toBeVisible();
    await expect(feedLabel).toHaveText("Feed");
  });

  test("clicking toggle again collapses sidebar", async ({ page }) => {
    const toggle = page.getByTestId("sidebar-toggle");

    // Expand
    await toggle.click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId("left-sidebar")).toHaveAttribute(
      "data-expanded",
      "true"
    );

    // Collapse
    await toggle.click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId("left-sidebar")).toHaveAttribute(
      "data-expanded",
      "false"
    );

    const box = await page.getByTestId("left-sidebar").boundingBox();
    expect(box!.width).toBeCloseTo(56, -1);
  });

  test("nav links navigate correctly", async ({ page }) => {
    const feedLink = page.getByTestId("nav-feed");
    await expect(feedLink).toBeVisible();

    // Click learn link
    const learnLink = page.getByTestId("nav-learn");
    await learnLink.click();
    await expect(page).toHaveURL(/\/learn/);

    // Click ranking link
    const rankingLink = page.getByTestId("nav-ranking");
    await rankingLink.click();
    await expect(page).toHaveURL(/\/ranking/);
  });

  test("active nav item has active style", async ({ page }) => {
    // We're on /feed after login
    const feedLink = page.getByTestId("nav-feed");
    const feedClasses = await feedLink.getAttribute("class");
    expect(feedClasses).toContain("bg-blue-dim");

    // Non-active item should NOT have active class
    const learnLink = page.getByTestId("nav-learn");
    const learnClasses = await learnLink.getAttribute("class");
    expect(learnClasses).not.toContain("bg-blue-dim");
  });
});

test.describe("NAV-02: User Avatar", () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    "Requires TEST_USER_EMAIL and TEST_USER_PASSWORD env vars"
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(process.env.TEST_USER_EMAIL!);
    await page.locator("#password").fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL("**/feed**", { timeout: 15000 });
  });

  test("user avatar is visible in sidebar", async ({ page }) => {
    const avatar = page.getByTestId("user-avatar");
    await expect(avatar).toBeVisible();
  });

  test("clicking avatar navigates to /profile", async ({ page }) => {
    const avatar = page.getByTestId("user-avatar");
    await avatar.click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test("expanded sidebar shows user display name", async ({ page }) => {
    const toggle = page.getByTestId("sidebar-toggle");
    await toggle.click();
    await page.waitForTimeout(300);

    const displayName = page.getByTestId("user-display-name");
    await expect(displayName).toBeVisible();
    // Should have some text (not empty)
    const text = await displayName.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});

test.describe("NAV-03 & NAV-04: Right Panel Data", () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    "Requires TEST_USER_EMAIL and TEST_USER_PASSWORD env vars"
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(process.env.TEST_USER_EMAIL!);
    await page.locator("#password").fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL("**/feed**", { timeout: 15000 });
  });

  test("right panel is visible", async ({ page }) => {
    const panel = page.getByTestId("right-panel");
    await expect(panel).toBeVisible();
  });

  test("leaderboard section loads with entries or empty state", async ({
    page,
  }) => {
    const section = page.getByTestId("leaderboard-section");
    await expect(section).toBeVisible({ timeout: 10000 });

    // Either entries or "Nenhum dado disponivel"
    const entries = page.getByTestId("leaderboard-entry");
    const emptyText = page.getByText("Nenhum dado disponivel");

    const hasEntries = (await entries.count()) > 0;
    const hasEmpty = await emptyText.isVisible().catch(() => false);

    expect(hasEntries || hasEmpty).toBeTruthy();
  });

  test("leaderboard shows 'Ver ranking completo' link", async ({ page }) => {
    await page.getByTestId("leaderboard-section").waitFor({ timeout: 10000 });

    const rankingLink = page.getByText("Ver ranking completo");
    await expect(rankingLink).toBeVisible();
  });

  test("active users section loads", async ({ page }) => {
    const section = page.getByTestId("active-users-section");
    await expect(section).toBeVisible({ timeout: 10000 });
  });

  test("active users shows entries or empty state", async ({ page }) => {
    const section = page.getByTestId("active-users-section");
    await expect(section).toBeVisible({ timeout: 10000 });

    const users = page.getByTestId("active-user");
    const emptyText = page.getByText("Nenhum usuario ativo");

    const hasUsers = (await users.count()) > 0;
    const hasEmpty = await emptyText.isVisible().catch(() => false);

    expect(hasUsers || hasEmpty).toBeTruthy();
  });
});
