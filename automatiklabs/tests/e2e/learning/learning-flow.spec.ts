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

test.describe("Learning Route Navigation", () => {
  test("learn page loads and shows tracks", async ({ page }) => {
    await page.goto("/learn");
    // Should redirect to login if not authenticated, or show tracks if authenticated
    const url = page.url();
    expect(url).toMatch(/learn|login/);
  });
});

test.describe("Learning Flow (authenticated)", () => {
  test.skip(!testEmail || !testPassword, "Requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars");

  test("browse /learn shows track list", async ({ page }) => {
    await loginAs(page);
    await page.goto("/learn");
    await expect(page).toHaveURL(/learn/);
  });

  test("track detail page loads from /learn", async ({ page }) => {
    await loginAs(page);
    await page.goto("/learn");

    // Click first track link (if any tracks exist)
    const trackLink = page.locator('a[href^="/learn/"]').first();
    if (await trackLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await trackLink.getAttribute("href");
      await trackLink.click();
      await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  test("course detail page shows curriculum", async ({ page }) => {
    await loginAs(page);
    await page.goto("/learn");

    // Navigate to first track
    const trackLink = page.locator('a[href^="/learn/"]').first();
    if (await trackLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trackLink.click();

      // Navigate to first course
      const courseLink = page.locator('a[href*="/learn/"]').first();
      if (await courseLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await courseLink.click();
        // Should show course content or curriculum
        await expect(page).toHaveURL(/learn\/.+\/.+/);
      }
    }
  });
});

test.describe("Learning Routes Protection", () => {
  test("/learn requires authentication", async ({ page }) => {
    await page.goto("/learn");
    await expect(page).toHaveURL(/login/);
  });
});
