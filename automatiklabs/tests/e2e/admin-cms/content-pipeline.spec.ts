import { test, expect } from "@playwright/test";

// These tests require admin credentials
const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("#email").fill(adminEmail!);
  await page.locator("#password").fill(adminPassword!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/(feed|admin)/, { timeout: 15000 });
}

test.describe("Admin Content Pipeline", () => {
  test.skip(!adminEmail || !adminPassword, "Requires PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD env vars");

  test("admin dashboard loads with stats", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");

    await expect(page).toHaveURL(/admin/);
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("admin content page loads with tabs", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/content");

    await expect(page).toHaveURL(/admin\/content/);
  });

  test("non-admin redirected from admin routes", async ({ page }) => {
    // Access admin without auth → should redirect to login
    await page.goto("/admin");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Admin Access Control (no auth needed)", () => {
  test("unauthenticated user redirected from /admin to /login", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/login/);
  });

  test("unauthenticated user redirected from /admin/content to /login", async ({
    page,
  }) => {
    await page.goto("/admin/content");
    await expect(page).toHaveURL(/login/);
  });

  test("unauthenticated user redirected from /admin/users to /login", async ({
    page,
  }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/login/);
  });
});
