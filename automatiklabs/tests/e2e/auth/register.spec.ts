import { test, expect } from "@playwright/test";

test.describe("Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/registro");
  });

  test("registration page renders correctly", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Criar conta" })).toBeVisible();
    await expect(page.locator("#full_name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirm_password")).toBeVisible();
    await expect(page.locator('input[name="terms"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible();
  });

  test("validation: empty form shows required errors", async ({ page }) => {
    // HTML5 required prevents submission, so let's check that
    const nameInput = page.locator("#full_name");
    await nameInput.focus();
    await nameInput.blur();

    // Try submitting with required fields empty — form should not submit
    const submitButton = page.getByRole("button", { name: "Criar conta" });
    await submitButton.click();

    // Should stay on /registro (not redirect)
    await expect(page).toHaveURL(/registro/);
  });

  test("validation: weak password shows error", async ({ page }) => {
    await page.locator("#full_name").fill("Test User");
    await page.locator("#email").fill("test@example.com");
    await page.locator("#password").fill("123"); // Too short
    await page.locator("#confirm_password").fill("123");
    await page.locator('input[name="terms"]').check();

    await page.getByRole("button", { name: "Criar conta" }).click();

    // Should show validation error for short password
    await expect(
      page.getByText("minimo 8 caracteres")
    ).toBeVisible({ timeout: 5000 });
  });

  test("validation: mismatched passwords shows error", async ({ page }) => {
    await page.locator("#full_name").fill("Test User");
    await page.locator("#email").fill("test@example.com");
    await page.locator("#password").fill("password123");
    await page.locator("#confirm_password").fill("differentpass");
    await page.locator('input[name="terms"]').check();

    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(
      page.getByText("senhas nao coincidem")
    ).toBeVisible({ timeout: 5000 });
  });

  test("validation: short name shows error", async ({ page }) => {
    await page.locator("#full_name").fill("A"); // Too short (min 2)
    await page.locator("#email").fill("test@example.com");
    await page.locator("#password").fill("password123");
    await page.locator("#confirm_password").fill("password123");
    await page.locator('input[name="terms"]').check();

    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(
      page.getByText("minimo 2 caracteres")
    ).toBeVisible({ timeout: 5000 });
  });

  test("link to login page works", async ({ page }) => {
    await page.getByRole("link", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/login/);
  });
});
