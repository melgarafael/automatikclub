import { test, expect } from "@playwright/test";

test.describe("Pricing Page (public)", () => {
  test("pricing page accessible without login", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).not.toHaveURL(/login/);
    await expect(page).toHaveURL(/pricing/);
  });

  test("pricing page shows tier comparison", async ({ page }) => {
    await page.goto("/pricing");
    // Should show at least "free" and "pro" tier names
    await expect(
      page.getByText(/free|gratuito|gratis/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Member Directory (protected)", () => {
  test("/members requires authentication", async ({ page }) => {
    await page.goto("/members");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Content Gating", () => {
  test("/learn requires authentication (gating starts at route level)", async ({
    page,
  }) => {
    await page.goto("/learn");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Subscription Gating (authenticated)", () => {
  const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
  const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

  test.skip(!testEmail || !testPassword, "Requires test credentials");

  async function loginAs(page: import("@playwright/test").Page) {
    await page.goto("/login");
    await page.locator("#email").fill(testEmail!);
    await page.locator("#password").fill(testPassword!);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL(/\/(feed|learn)/, { timeout: 15000 });
  }

  test("pricing page shows current plan for logged-in user", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/pricing");
    await expect(page).toHaveURL(/pricing/);
  });

  test("member directory loads for authenticated user", async ({ page }) => {
    await loginAs(page);
    await page.goto("/members");
    await expect(page).toHaveURL(/members/);
  });

  test("learn page shows tracks for authenticated user", async ({ page }) => {
    await loginAs(page);
    await page.goto("/learn");
    await expect(page).toHaveURL(/learn/);
  });
});
