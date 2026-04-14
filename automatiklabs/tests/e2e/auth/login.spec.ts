import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("login page renders correctly", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  });

  test("shows forgot password link", async ({ page }) => {
    const forgotLink = page.getByRole("link", { name: "Esqueci minha senha" });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/recuperar-senha/);
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.locator("#email").fill("nonexistent@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    // Should show error message (Supabase returns invalid credentials)
    await expect(
      page.getByText(/invalido|incorreto|credenciais|Invalid/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("link to registration page works", async ({ page }) => {
    await page.getByRole("link", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/registro/);
  });

  test("magic link mode toggles correctly", async ({ page }) => {
    // Toggle to magic link mode
    const magicButton = page.getByRole("button", { name: /magic link/i });
    await expect(magicButton).toBeVisible();
    await magicButton.click();

    // Should show magic link form with email-only
    await expect(page.locator("#magic-email")).toBeVisible();
    // Password field should NOT be visible
    await expect(page.locator("#password")).not.toBeVisible();
    // Should show "Enviar link magico" button
    await expect(page.getByRole("button", { name: /Enviar link magico/i })).toBeVisible();
  });
});

test.describe("Auth Protection", () => {
  test("protected route redirects to login", async ({ page }) => {
    await page.goto("/feed");
    await expect(page).toHaveURL(/login.*redirectTo/);
  });

  test("protected route /learn redirects to login", async ({ page }) => {
    await page.goto("/learn");
    await expect(page).toHaveURL(/login/);
  });

  test("protected route /settings redirects to login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/login/);
  });

  test("protected route /admin redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/login/);
  });

  test("public route / loads without redirect", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/login/);
  });

  test("public route /pricing loads without redirect", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).not.toHaveURL(/login/);
  });
});

test.describe("Password Reset", () => {
  test("password reset page renders correctly", async ({ page }) => {
    await page.goto("/recuperar-senha");
    await expect(page.locator("#email")).toBeVisible();
  });

  test("submitting empty email shows validation", async ({ page }) => {
    await page.goto("/recuperar-senha");
    const submitButton = page.getByRole("button", { name: /enviar|recuperar/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // HTML5 required should prevent submission
      await expect(page).toHaveURL(/recuperar-senha/);
    }
  });
});
