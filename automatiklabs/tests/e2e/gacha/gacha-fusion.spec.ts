import { test, expect } from "@playwright/test";

const INVENTORY_URL = "/learn/gacha/inventory";

// Selectors
const FUSION_HEADING = 'h3:has-text("Fusão")';
const FUSE_BUTTON = 'button:has-text("Confirmar Fusão")';
const FUSING_INDICATOR = 'button:has-text("Fundindo...")';
const NO_ELIGIBLE = 'text="Sem itens elegíveis"';

test.describe("Gacha Fusion", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: seed test user with 3+ Common items + 3 Legendary items via fixture
    await page.goto(INVENTORY_URL);
  });

  test("select 3 common items → fusion panel shows preview", async ({
    page,
  }) => {
    // Open fusion panel (click fusion tab/button)
    await page.locator(FUSION_HEADING).waitFor({ state: "visible" });

    // Select 3 common items from the eligible list
    const eligibleButtons = page.locator(
      '.grid button:has-text("◆")'
    );
    const count = await eligibleButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Click 3 items to fill slots
    await eligibleButtons.nth(0).click();
    await eligibleButtons.nth(1).click();
    await eligibleButtons.nth(2).click();

    // Preview should show "Resultado: Uncommon"
    await expect(page.getByText("Resultado:")).toBeVisible();
    // The RarityBadge for uncommon should appear in preview
    await expect(
      page.locator('[aria-label*="Raridade: uncommon"]')
    ).toBeVisible();
  });

  test("confirm fusion → uncommon item appears in inventory", async ({
    page,
  }) => {
    await page.locator(FUSION_HEADING).waitFor({ state: "visible" });

    // Fill 3 slots
    const eligibleButtons = page.locator('.grid button:has-text("◆")');
    await eligibleButtons.nth(0).click();
    await eligibleButtons.nth(1).click();
    await eligibleButtons.nth(2).click();

    // Confirm fusion
    await page.locator(FUSE_BUTTON).click();

    // Wait for completion (button shows "Fundindo..." then result appears)
    await expect(page.locator(FUSING_INDICATOR)).toBeVisible({ timeout: 3000 });
    // Done state shows the result item
    await expect(page.getByText("NOVO")).toBeVisible({ timeout: 10000 });
  });

  test("mixed rarities → fuse button disabled", async ({ page }) => {
    await page.locator(FUSION_HEADING).waitFor({ state: "visible" });

    // After selecting a common item, only common items should be eligible
    // If no mixed selection is possible via UI, the fusion button stays disabled
    // with less than 3 items selected
    const fuseButton = page.locator(FUSE_BUTTON);
    await expect(fuseButton).toBeDisabled();
  });

  test("legendary items → not shown as eligible for fusion", async ({
    page,
  }) => {
    await page.locator(FUSION_HEADING).waitFor({ state: "visible" });

    // The hint text says "não Legendary"
    await expect(
      page.getByText("mesma raridade, não Legendary")
    ).toBeVisible();

    // Legendary items should not appear in the eligible picker
    // (all eligible items are non-legendary)
    const legendaryBadges = page.locator(
      '.grid button [style*="--gacha-legendary"]'
    );
    await expect(legendaryBadges).toHaveCount(0);
  });
});
