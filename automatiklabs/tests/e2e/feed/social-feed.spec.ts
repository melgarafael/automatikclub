import { test, expect } from "@playwright/test";

test.describe("Social Feed", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/feed");
  });

  // ── Post creation ──

  test("create post — appears in feed", async ({ page }) => {
    // Click the composer placeholder to expand
    const composerTrigger = page.getByText("Escrever um post...");
    if (await composerTrigger.isVisible()) {
      await composerTrigger.click();
    }

    const textarea = page.locator('textarea[name="content_md"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    const postContent = `E2E test post ${Date.now()}`;
    await textarea.fill(postContent);

    const submitButton = page.getByRole("button", { name: "Publicar" });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Post should appear in feed after submission
    await expect(page.getByText(postContent)).toBeVisible({ timeout: 10000 });
  });

  test("empty post is blocked by validation", async ({ page }) => {
    const composerTrigger = page.getByText("Escrever um post...");
    if (await composerTrigger.isVisible()) {
      await composerTrigger.click();
    }

    // Submit button should be disabled when content is empty
    const submitButton = page.getByRole("button", { name: "Publicar" });
    await expect(submitButton).toBeDisabled();
  });

  // ── Like / unlike ──

  test("like post — count updates — unlike — count decrements", async ({
    page,
  }) => {
    // Wait for at least one post action bar to appear
    const likeButton = page.locator("button").filter({ hasText: /\u25B2/ }).first();
    await expect(likeButton).toBeVisible({ timeout: 10000 });

    // Read initial count
    const countText = await likeButton.textContent();
    const initialCount = parseInt(countText?.replace(/[^\d]/g, "") ?? "0", 10);

    // Like
    await likeButton.click();
    await expect(likeButton).toHaveClass(/text-blue/, { timeout: 5000 });

    // Count should increment
    await expect(likeButton).toContainText(String(initialCount + 1));

    // Unlike
    await likeButton.click();

    // Count should revert
    await expect(likeButton).toContainText(String(initialCount));
  });

  // ── Comment ──

  test("comment on post — comment appears", async ({ page }) => {
    // Navigate to the first post detail page
    const postLink = page
      .locator('article a[href*="/community/"]')
      .first();
    await expect(postLink).toBeVisible({ timeout: 10000 });
    await postLink.click();

    // Wait for comment section
    await expect(
      page.getByText(/Comentarios/i)
    ).toBeVisible({ timeout: 10000 });

    // Fill comment
    const commentContent = `E2E comment ${Date.now()}`;
    const commentTextarea = page.locator('textarea[name="content"]');
    await expect(commentTextarea).toBeVisible({ timeout: 5000 });
    await commentTextarea.fill(commentContent);

    // Submit
    const commentButton = page.getByRole("button", { name: "Comentar" });
    await expect(commentButton).toBeEnabled();
    await commentButton.click();

    // Comment should appear
    await expect(page.getByText(commentContent)).toBeVisible({
      timeout: 10000,
    });
  });

  // ── Share ──

  test("share post — clipboard has URL", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const shareButton = page
      .locator("button")
      .filter({ hasText: "share" })
      .first();
    await expect(shareButton).toBeVisible({ timeout: 10000 });
    await shareButton.click();

    // Verify toast appears
    await expect(page.getByText("Link copiado!")).toBeVisible({
      timeout: 5000,
    });

    // Verify clipboard content has the correct URL format
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toMatch(/\/community\/[\w-]+\/post\/[\w-]+/);
  });

  // ── Profile links ──

  test("click user avatar — navigates to profile", async ({ page }) => {
    // Click on the first post author avatar link
    const avatarLink = page
      .locator('article a[href*="/members"]')
      .first();
    await expect(avatarLink).toBeVisible({ timeout: 10000 });
    await avatarLink.click();

    // Should navigate to a members page
    await expect(page).toHaveURL(/\/members/, { timeout: 10000 });
  });

  // ── Filter tabs ──

  test("filter tabs work — recentes, populares", async ({ page }) => {
    // Verify Recentes tab is active by default
    const recentesTab = page.getByRole("button", { name: "Recentes" });
    await expect(recentesTab).toBeVisible({ timeout: 5000 });
    await expect(recentesTab).toHaveClass(/border-blue/);

    // Switch to Populares
    const popularesTab = page.getByRole("button", { name: "Populares" });
    await popularesTab.click();
    await expect(popularesTab).toHaveClass(/border-blue/, { timeout: 5000 });

    // Switch back to Recentes
    await recentesTab.click();
    await expect(recentesTab).toHaveClass(/border-blue/, { timeout: 5000 });
  });

  // ── AI Feed tab ──

  test("AI Feed tab shows content or empty state", async ({ page }) => {
    const aiTab = page.getByRole("button", { name: "AI Feed" });
    await expect(aiTab).toBeVisible({ timeout: 5000 });
    await aiTab.click();

    // Should show either AI posts or the empty state
    const hasContent = await page
      .getByText("Nenhum post de IA ainda")
      .or(page.locator("article").first())
      .first()
      .isVisible({ timeout: 10000 });

    expect(hasContent).toBe(true);
  });
});
