import { test, expect } from "@playwright/test";

const GACHA_URL = "/learn/gacha";

test.describe("Gacha Accessibility", () => {
  test("pull result has aria-live assertive", async ({ page }) => {
    await page.goto(GACHA_URL);

    // Trigger a pull
    await page.locator('button:has-text("Pull x1")').click();

    // The pull result region should have aria-live="assertive"
    const liveRegion = page.locator('[aria-live="assertive"]');
    await expect(liveRegion).toBeAttached({ timeout: 10000 });

    // Verify the attribute value
    const ariaLive = await liveRegion.first().getAttribute("aria-live");
    expect(ariaLive).toBe("assertive");
  });

  test("RarityBadge has aria-label with rarity text", async ({ page }) => {
    await page.goto(GACHA_URL);

    // Banner detail should show rarity badges
    const badge = page.locator('[aria-label*="Raridade:"]').first();
    await expect(badge).toBeVisible({ timeout: 5000 });

    // Verify aria-label contains rarity name and star count
    const label = await badge.getAttribute("aria-label");
    expect(label).toMatch(/Raridade: \w+, \d+ de 5 estrelas/);
  });

  test("skip button is visible during pull animation", async ({ page }) => {
    await page.goto(GACHA_URL);

    await page.locator('button:has-text("Pull x1")').click();

    // Skip button should appear during animation
    const skipBtn = page.locator('[aria-label="Pular animação"]');
    await expect(skipBtn).toBeVisible({ timeout: 5000 });

    // Click it to end animation early
    await skipBtn.click();

    // Result should be shown
    await expect(
      page.locator('[aria-live="assertive"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test("reduced motion: animation replaced by fade", async ({ page }) => {
    // Enable prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(GACHA_URL);

    await page.locator('button:has-text("Pull x1")').click();

    // With reduced motion, the anticipation/reveal phases should NOT render
    // particle effects or complex animations. Check that the motion-safe
    // animation classes are absent.
    const particleCanvas = page.locator("canvas");
    const hasCanvas = await particleCanvas.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCanvas).toBe(false);

    // The result should still appear (via simple fade)
    await expect(
      page.locator('[aria-live="assertive"]')
    ).toBeVisible({ timeout: 10000 });
  });

  test("WCAG: no flashes above 3 per second", async ({ page }) => {
    // This test verifies structural compliance:
    // animation durations should prevent rapid flashing
    await page.goto(GACHA_URL);

    // Check that gacha CSS uses animation durations >= 333ms (3/sec threshold)
    const styles = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      const flashRisk: string[] = [];
      for (const sheet of sheets) {
        try {
          for (const rule of sheet.cssRules) {
            const text = rule.cssText;
            // Check for very short animation durations
            const match = text.match(/animation-duration:\s*([\d.]+)(ms|s)/);
            if (match) {
              const ms =
                match[2] === "s"
                  ? parseFloat(match[1]) * 1000
                  : parseFloat(match[1]);
              if (ms < 333 && text.includes("flash")) {
                flashRisk.push(text.substring(0, 100));
              }
            }
          }
        } catch {
          // Cross-origin stylesheet, skip
        }
      }
      return flashRisk;
    });

    expect(styles).toHaveLength(0);
  });

  test("rarity differentiated by shape + text + color (not color alone)", async ({
    page,
  }) => {
    await page.goto(GACHA_URL);

    // All rarity badges should have both text label and star indicators
    const badges = page.locator('[aria-label*="Raridade:"]');
    const count = await badges.count();

    for (let i = 0; i < count; i++) {
      const badge = badges.nth(i);
      const label = await badge.getAttribute("aria-label");

      // Must contain rarity name (text, not just color)
      expect(label).toMatch(/Raridade: (common|uncommon|rare|epic|legendary)/);
      // Must contain star count (shape indicator)
      expect(label).toMatch(/\d+ de 5 estrelas/);
    }
  });
});
