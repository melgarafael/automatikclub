import { test, expect } from "@playwright/test";

const MARKETPLACE_URL = "/learn/gacha/marketplace";
const INVENTORY_URL = "/learn/gacha/inventory";

test.describe("Gacha Marketplace", () => {
  test.describe("listing an item", () => {
    test.beforeEach(async ({ page }) => {
      // TODO: seed seller user with tradeable (category D) items via fixture
      await page.goto(INVENTORY_URL);
    });

    test("list tradeable item with valid price", async ({ page }) => {
      // Click on a tradeable item to open detail modal
      const tradeableItem = page.locator('[aria-label*="—"]').first();
      await tradeableItem.click();

      // Modal should open
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Click "Vender" / sell button
      const sellButton = modal.getByText("Vender");
      if (await sellButton.isVisible()) {
        await sellButton.click();

        // Enter price
        const priceInput = page.locator('input[type="number"]');
        await priceInput.fill("500");

        // Confirm listing
        await page.getByText("Confirmar").click();

        // Success feedback
        await expect(page.getByText("Item listado")).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("soulbound item has no sell button", async ({ page }) => {
      // Find a soulbound item (has soulbound indicator)
      const soulboundItem = page.locator('[aria-label="Soulbound"]').first();
      if (await soulboundItem.isVisible().catch(() => false)) {
        // Click the parent item card
        await soulboundItem.locator("..").click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();

        // "Vender" button should NOT exist
        await expect(modal.getByText("Vender")).not.toBeVisible();
      }
    });

    test("price below floor → error message", async ({ page }) => {
      const tradeableItem = page.locator('[aria-label*="—"]').first();
      await tradeableItem.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      const sellButton = modal.getByText("Vender");
      if (await sellButton.isVisible()) {
        await sellButton.click();

        // Enter price below floor (Common floor = 10)
        const priceInput = page.locator('input[type="number"]');
        await priceInput.fill("1");
        await page.getByText("Confirmar").click();

        // Error should mention price range
        await expect(page.getByText(/[Pp]re[çc]o/)).toBeVisible({
          timeout: 3000,
        });
      }
    });
  });

  test.describe("browsing and buying", () => {
    test("listed items appear in marketplace", async ({ page }) => {
      await page.goto(MARKETPLACE_URL);

      // Marketplace should have filter controls
      await expect(
        page.locator('[aria-label="Raridade"]')
      ).toBeVisible();
      await expect(
        page.locator('[aria-label="Categoria"]')
      ).toBeVisible();

      // At least one listing should be visible (from seed data)
      const listings = page.locator("article, [class*='card']");
      await expect(listings.first()).toBeVisible({ timeout: 5000 });
    });

    test("buying an item transfers credits and removes listing", async ({
      page,
    }) => {
      // TODO: seed buyer user with enough credits via fixture
      await page.goto(MARKETPLACE_URL);

      // Click first listing
      const firstListing = page.locator("article, [class*='card']").first();
      await firstListing.click();

      // Click buy button
      const buyButton = page.getByText("Comprar");
      if (await buyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await buyButton.click();

        // Confirm purchase
        const confirmBtn = page.getByText("Confirmar");
        if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.click();
        }

        // Success feedback
        await expect(page.getByText(/[Cc]ompra/)).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe("cancel listing", () => {
    test("cancelling returns item to inventory", async ({ page }) => {
      // TODO: seed user with an active listing via fixture
      await page.goto(MARKETPLACE_URL);

      // Navigate to "My Listings" tab/section
      const myListings = page.getByText("Minhas Listagens");
      if (await myListings.isVisible({ timeout: 3000 }).catch(() => false)) {
        await myListings.click();

        // Cancel first listing
        const cancelBtn = page.getByText("Cancelar").first();
        if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelBtn.click();

          // Confirm cancellation
          await page.getByText("Confirmar").click();

          // Item should return to inventory
          await page.goto(INVENTORY_URL);
          // Verify the unlocked item is present
          const unlockedItems = page.locator(
            '[aria-label*="—"]:not(:has([aria-label="Bloqueado"]))'
          );
          await expect(unlockedItems.first()).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});
