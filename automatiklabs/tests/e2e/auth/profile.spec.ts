import { test, expect } from "@playwright/test";

test.describe("Profile Management", () => {
  // These tests require an authenticated session.
  // Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars, or skip.
  const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
  const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

  test.skip(!testEmail || !testPassword, "Requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars");

  async function loginAs(
    page: import("@playwright/test").Page,
    email: string,
    password: string
  ) {
    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    // Wait for redirect to /feed or profile
    await page.waitForURL(/\/(feed|profile)/, { timeout: 15000 });
  }

  test("profile page loads for authenticated user", async ({ page }) => {
    await loginAs(page, testEmail!, testPassword!);
    await page.goto("/profile");

    // Should not redirect to login
    await expect(page).toHaveURL(/profile/);

    // Should show profile header elements
    await expect(page.getByText("Meu Perfil")).toBeVisible();
  });

  test("profile edit page loads and has form fields", async ({ page }) => {
    await loginAs(page, testEmail!, testPassword!);
    await page.goto("/profile/edit");

    await expect(page).toHaveURL(/profile\/edit/);
    await expect(page.getByText("Editar Perfil")).toBeVisible();

    // Verify all social link fields exist
    await expect(page.locator("#full_name")).toBeVisible();
    await expect(page.locator("#bio")).toBeVisible();
    await expect(page.locator("#whatsapp")).toBeVisible();
    await expect(page.locator("#instagram")).toBeVisible();
    await expect(page.locator("#linkedin")).toBeVisible();
    await expect(page.locator("#github")).toBeVisible();
    await expect(page.locator("#youtube")).toBeVisible();
    await expect(page.locator("#reddit")).toBeVisible();
    await expect(page.locator("#portfolio_url")).toBeVisible();
  });

  test("editing profile bio persists after save", async ({ page }) => {
    await loginAs(page, testEmail!, testPassword!);
    await page.goto("/profile/edit");

    const testBio = `E2E test bio - ${Date.now()}`;
    await page.locator("#bio").fill(testBio);
    await page.getByRole("button", { name: "Salvar alteracoes" }).click();

    // Wait for success
    await expect(page.getByText("Perfil atualizado")).toBeVisible({
      timeout: 10000,
    });

    // Verify on profile page
    await page.goto("/profile");
    await expect(page.getByText(testBio)).toBeVisible();
  });

  test("adding social link persists", async ({ page }) => {
    await loginAs(page, testEmail!, testPassword!);
    await page.goto("/profile/edit");

    await page.locator("#github").fill("@testuser");
    await page.getByRole("button", { name: "Salvar alteracoes" }).click();

    await expect(page.getByText("Perfil atualizado")).toBeVisible({
      timeout: 10000,
    });

    // Verify on profile page
    await page.goto("/profile");
    await expect(page.getByText("testuser")).toBeVisible();
  });

  test("empty social links don't render broken icons", async ({ page }) => {
    await loginAs(page, testEmail!, testPassword!);
    await page.goto("/profile/edit");

    // Clear youtube field
    await page.locator("#youtube").fill("");
    await page.getByRole("button", { name: "Salvar alteracoes" }).click();

    await expect(page.getByText("Perfil atualizado")).toBeVisible({
      timeout: 10000,
    });

    // Verify on profile page — no YouTube link visible
    await page.goto("/profile");
    const youtubeLink = page.getByRole("link", { name: "YouTube" });
    await expect(youtubeLink).not.toBeVisible();
  });
});

test.describe("Settings Page", () => {
  const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
  const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

  test.skip(!testEmail || !testPassword, "Requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars");

  async function loginAs(
    page: import("@playwright/test").Page,
    email: string,
    password: string
  ) {
    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL(/\/(feed|profile)/, { timeout: 15000 });
  }

  test("settings page loads with tabs", async ({ page }) => {
    await loginAs(page, testEmail!, testPassword!);
    await page.goto("/settings");

    await expect(page).toHaveURL(/settings/);
    await expect(page.getByText("Configuracoes")).toBeVisible();
  });

  test("notification preferences tab has toggles", async ({ page }) => {
    await loginAs(page, testEmail!, testPassword!);
    await page.goto("/settings");

    // Find notification-related text
    await expect(
      page.getByText("Notificacoes por email")
    ).toBeVisible({ timeout: 5000 });
  });

  test("privacy settings tab has visibility options", async ({ page }) => {
    await loginAs(page, testEmail!, testPassword!);
    await page.goto("/settings");

    // Click Privacy tab (if tabbed)
    const privacyTab = page.getByText("Privacidade");
    if (await privacyTab.isVisible()) {
      await privacyTab.click();
    }

    await expect(
      page.getByText("Visibilidade do perfil")
    ).toBeVisible({ timeout: 5000 });
  });
});
