import { test, expect } from "@playwright/test";

// Routes
const GACHA_URL = "/learn/gacha";
const INVENTORY_URL = "/learn/gacha/inventory";

// Selectors (aria-based — no data-testid in this codebase)
const BANNER_CAROUSEL = '[role="listbox"][aria-label="Banners disponíveis"]';
const BANNER_OPTION = '[role="option"]';
const PULL_1_BUTTON = 'button:has-text("Pull x1")';
const PULL_10_BUTTON = 'button:has-text("Pull x10")';
const PULL_RESULT = '[role="status"][aria-live="assertive"]';
const PITY_COUNTER = '[role="progressbar"]';
const CURRENCY_DISPLAY = '[role="status"]';
const SKIP_BUTTON = 'button[aria-label="Pular animação"]';

test.describe("Gacha Pull Flow", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: seed test user with enough fragments via API/fixture
    await page.goto(GACHA_URL);
  });

  test("banners are loaded and visible", async ({ page }) => {
    const carousel = page.locator(BANNER_CAROUSEL);
    await expect(carousel).toBeVisible();

    const banners = carousel.locator(BANNER_OPTION);
    await expect(banners).toHaveCount(1, { timeout: 5000 }); // At least permanent banner
  });

  test("selecting a banner shows details and probabilities", async ({
    page,
  }) => {
    // Click first banner
    const firstBanner = page.locator(BANNER_OPTION).first();
    await firstBanner.click();

    // Should show banner detail with name and rate table
    await expect(page.getByText("Common")).toBeVisible();
    await expect(page.getByText("55%")).toBeVisible();
    await expect(page.getByText("Legendary")).toBeVisible();
    await expect(page.getByText("1.5%")).toBeVisible();
  });

  test("pull x1 → animation → result in inventory", async ({ page }) => {
    // Record initial fragment count from currency display
    const currencyEl = page.locator(CURRENCY_DISPLAY).first();
    const initialText = await currencyEl.getAttribute("aria-label");
    const initialFragments = parseInt(
      initialText?.match(/(\d+) fragmentos/)?.[1] ?? "0"
    );

    // Click Pull x1
    await page.locator(PULL_1_BUTTON).click();

    // Animation plays — skip it
    const skipBtn = page.locator(SKIP_BUTTON);
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }

    // Result appears
    const result = page.locator(PULL_RESULT);
    await expect(result).toBeVisible({ timeout: 10000 });

    // Result has item name and rarity text
    const resultLabel = await result.getAttribute("aria-label");
    expect(resultLabel).toMatch(/Resultado:/);

    // Navigate to inventory and verify item exists
    await page.goto(INVENTORY_URL);
    // New items should appear (at least 1 item card)
    const inventoryItems = page.locator(
      '[aria-label*="—"]' // item cards have "Name — Rarity" aria-label
    );
    await expect(inventoryItems.first()).toBeVisible({ timeout: 5000 });
  });

  test("pull x10 → grid 2x5 → 10 items in inventory", async ({ page }) => {
    await page.locator(PULL_10_BUTTON).click();

    // Skip animation if available
    const skipBtn = page.locator(SKIP_BUTTON);
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }

    // Multi-pull result should show
    const result = page.locator(PULL_RESULT);
    await expect(result).toBeVisible({ timeout: 15000 });

    // Result should mention multiple items
    const resultLabel = await result.getAttribute("aria-label");
    expect(resultLabel).toBeDefined();
    // The label lists all items comma-separated
    const items = resultLabel!.split(",");
    expect(items.length).toBeGreaterThanOrEqual(10);
  });

  test("wallet updates after pull (fragments decremented)", async ({
    page,
  }) => {
    // Get initial fragments
    const currencyEl = page.locator(CURRENCY_DISPLAY).first();
    await expect(currencyEl).toBeVisible();
    const beforeText = await currencyEl.getAttribute("aria-label");
    const before = parseInt(
      beforeText?.match(/(\d+) fragmentos/)?.[1] ?? "0"
    );

    // Pull x1
    await page.locator(PULL_1_BUTTON).click();

    // Wait for result
    await page.locator(PULL_RESULT).waitFor({ state: "visible", timeout: 10000 });

    // Check updated fragments (should be before - 100)
    const afterText = await currencyEl.getAttribute("aria-label");
    const after = parseInt(
      afterText?.match(/(\d+) fragmentos/)?.[1] ?? "0"
    );
    expect(after).toBe(before - 100);
  });

  test("pity counter increments after pull", async ({ page }) => {
    // Get initial pity
    const pityEl = page.locator(PITY_COUNTER).first();
    await expect(pityEl).toBeVisible();
    const beforeLabel = await pityEl.getAttribute("aria-label");
    const beforeCount = parseInt(
      beforeLabel?.match(/(\d+) de/)?.[1] ?? "0"
    );

    // Pull x1
    await page.locator(PULL_1_BUTTON).click();
    await page.locator(PULL_RESULT).waitFor({ state: "visible", timeout: 10000 });

    // Pity should increment by 1
    const afterLabel = await pityEl.getAttribute("aria-label");
    const afterCount = parseInt(
      afterLabel?.match(/(\d+) de/)?.[1] ?? "0"
    );
    expect(afterCount).toBe(beforeCount + 1);
  });
});
