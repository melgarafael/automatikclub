import { test, expect } from "@playwright/test";

const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("#email").fill(adminEmail!);
  await page.locator("#password").fill(adminPassword!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/(feed|admin)/, { timeout: 15000 });
}

test.describe("Admin User Management", () => {
  test.skip(!adminEmail || !adminPassword, "Requires PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD env vars");

  test("admin can view user list", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/users");

    await expect(page).toHaveURL(/admin\/users/);
    // Should show users table
    await expect(page.locator("table").or(page.getByText("Usuarios"))).toBeVisible({
      timeout: 10000,
    });
  });

  test("user list shows role column", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/users");

    // Table should have role-related content
    await expect(
      page.getByText(/aluno|admin|contribuidor|moderador/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin Access Protection", () => {
  test("non-admin cannot access /admin/users", async ({ page }) => {
    // Without auth, should redirect to login
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/login/);
  });
});
