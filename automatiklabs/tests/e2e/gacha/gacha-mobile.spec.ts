import { test, expect, devices } from "@playwright/test";

const GACHA_URL = "/learn/gacha";
const INVENTORY_URL = "/learn/gacha/inventory";
const MARKETPLACE_URL = "/learn/gacha/marketplace";

// iPhone SE viewport: 375x667
test.use({ ...devices["iPhone SE"] });

test.describe("Gacha Mobile (375px)", () => {
  test("banner carousel stacks vertically", async ({ page }) => {
    await page.goto(GACHA_URL);

    const carousel = page.locator(
      '[role="listbox"][aria-label="Banners disponíveis"]'
    );
    await expect(carousel).toBeVisible();

    // Banners should be stacked (each banner takes full width)
    const firstBanner = page.locator('[role="option"]').first();
    const bannerBox = await firstBanner.boundingBox();

    // Banner width should be close to viewport width (375px minus padding)
    expect(bannerBox!.width).toBeGreaterThan(300);
  });

  test("pull buttons are full width with adequate touch targets", async ({
    page,
  }) => {
    await page.goto(GACHA_URL);

    const pull1 = page.locator('button:has-text("Pull x1")');
    const pull10 = page.locator('button:has-text("Pull x10")');

    await expect(pull1).toBeVisible();
    await expect(pull10).toBeVisible();

    // Min touch target: 44px height (Apple HIG / WCAG 2.5.5)
    const box1 = await pull1.boundingBox();
    const box10 = await pull10.boundingBox();

    expect(box1!.height).toBeGreaterThanOrEqual(44);
    expect(box10!.height).toBeGreaterThanOrEqual(44);
  });

  test("inventory grid adapts to 3 columns on mobile", async ({ page }) => {
    await page.goto(INVENTORY_URL);

    // Wait for items to load
    const items = page.locator('[aria-label*="—"]');
    await expect(items.first()).toBeVisible({ timeout: 5000 });

    // Check that items wrap into multiple rows (not horizontal overflow)
    const firstItem = await items.nth(0).boundingBox();
    const count = await items.count();

    if (count >= 4) {
      const fourthItem = await items.nth(3).boundingBox();

      // Fourth item should be on a new row (y > first item's y)
      expect(fourthItem!.y).toBeGreaterThan(firstItem!.y);
    }

    // No horizontal overflow: page width should not exceed viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test("marketplace filters accessible via drawer (not sidebar)", async ({
    page,
  }) => {
    await page.goto(MARKETPLACE_URL);

    // On mobile, filters should either be in a collapsible drawer/sheet
    // or stacked vertically at the top — not as a fixed sidebar
    const filterRaridade = page.locator('[aria-label="Raridade"]');

    // If a filter toggle/button exists, click it to reveal filters
    const filterToggle = page.getByText(/[Ff]iltros/);
    if (await filterToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterToggle.click();
    }

    // Filters should be visible after toggle (or always visible on mobile)
    await expect(filterRaridade).toBeVisible({ timeout: 3000 });

    // Filters should not overflow horizontally
    const pageWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(pageWidth).toBeLessThanOrEqual(375);
  });

  test("10-pull grid does not overflow on mobile", async ({ page }) => {
    await page.goto(GACHA_URL);

    // Trigger 10-pull
    const pull10 = page.locator('button:has-text("Pull x10")');
    if (await pull10.isEnabled()) {
      await pull10.click();

      // Skip animation
      const skipBtn = page.locator('[aria-label="Pular animação"]');
      if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await skipBtn.click();
      }

      // Result grid should be contained within viewport
      const scrollWidth = await page.evaluate(
        () => document.body.scrollWidth
      );
      expect(scrollWidth).toBeLessThanOrEqual(375);
    }
  });
});
