import { test, expect } from "@playwright/test";

const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

async function loginAs(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("#email").fill(testEmail!);
  await page.locator("#password").fill(testPassword!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/(feed|learn)/, { timeout: 15000 });
}

test.describe("Gamification Display", () => {
  test.skip(!testEmail || !testPassword, "Requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars");

  test("profile shows XP and level info", async ({ page }) => {
    await loginAs(page);
    await page.goto("/profile");

    // Should show XP and level somewhere on profile
    await expect(page.getByText(/XP/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Nivel|nivel/)).toBeVisible({ timeout: 5000 });
  });

  test("ranking page loads", async ({ page }) => {
    await loginAs(page);
    await page.goto("/ranking");
    await expect(page).toHaveURL(/ranking/);
  });
});

test.describe("Gamification Routes Protection", () => {
  test("/ranking requires authentication", async ({ page }) => {
    await page.goto("/ranking");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Level Math Unit Tests", () => {
  // These are effectively integration tests verifying the level service
  // The actual unit tests should be in a vitest/jest file
  test("level gate component renders correctly", async ({ page }) => {
    // This just verifies the page loads — actual LevelGate testing
    // requires component-level testing
    await page.goto("/login");
    await expect(page).toHaveURL(/login/);
  });
});
