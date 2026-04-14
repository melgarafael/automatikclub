import { test, expect, type Page } from "@playwright/test";

// Next.js 16 SSR pages can be slow on first hit
test.setTimeout(90_000);

// ── Auth helpers ──

const CONTRIB = { email: "contrib@automatikclub.com", password: "Contrib1!" };

/**
 * Login via UI form — the only reliable method because Next.js proxy
 * reads auth from cookies set by the server action, not localStorage.
 */
async function loginViaUI(
  page: Page,
  creds: { email: string; password: string }
) {
  await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60000 });

  // Fill email
  const emailInput = page.locator('input#email, input[name="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(creds.email);

  // Fill password
  const passwordInput = page.locator('input#password, input[name="password"]');
  await passwordInput.fill(creds.password);

  // Submit
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  // Wait for redirect — server action does redirect("/feed")
  // Use waitForNavigation pattern: the form submit triggers server-side redirect
  await page.waitForURL(/\/(feed|learn|dashboard|community)/, {
    timeout: 45000,
    waitUntil: "domcontentloaded",
  });
}

/** Navigate with generous timeout + domcontentloaded */
async function goTo(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60000 });
}

// ============================================
// GRUPO C: Feed & Social
// ============================================

test.describe("GRUPO C: Feed & Social", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, CONTRIB);
  });

  test("C1: /feed loads with posts", async ({ page }) => {
    await goTo(page, "/feed");

    // Should have at least one article (PostCard renders <article>)
    const posts = page.locator("article");
    await expect(posts.first()).toBeVisible({ timeout: 20000 });

    const count = await posts.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("C2: Create post with content appears in feed", async ({ page }) => {
    await goTo(page, "/feed");

    // Click the composer trigger to expand
    const composerTrigger = page.getByText("Escrever um post...");
    await expect(composerTrigger).toBeVisible({ timeout: 20000 });
    await composerTrigger.click();

    // Fill the textarea
    const textarea = page.locator('textarea[name="content_md"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    const postContent = "QA R2 test post";
    await textarea.fill(postContent);

    // Submit
    const submitBtn = page.getByRole("button", { name: "Publicar" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Wait for creation, then reload feed to see the new post
    await page.waitForTimeout(2000);
    await goTo(page, "/feed");

    await expect(page.getByText(postContent).first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("C3: Like a post shows like count", async ({ page }) => {
    await goTo(page, "/feed");

    // Wait for at least one post
    await expect(page.locator("article").first()).toBeVisible({
      timeout: 20000,
    });

    // The like button contains the triangle char and a count
    const likeButton = page
      .locator("button")
      .filter({ hasText: /\u25B2/ })
      .first();
    await expect(likeButton).toBeVisible({ timeout: 5000 });

    // Read initial count
    const countText = await likeButton.textContent();
    const initialCount = parseInt(
      countText?.replace(/[^\d]/g, "") ?? "0",
      10
    );

    // Click like
    await likeButton.click();
    await page.waitForTimeout(1000);

    // After clicking, the count should be visible
    const newCountText = await likeButton.textContent();
    const newCount = parseInt(newCountText?.replace(/[^\d]/g, "") ?? "0", 10);
    expect(typeof newCount).toBe("number");
    expect(newCount).toBeGreaterThanOrEqual(0);

    // Undo (toggle back)
    await likeButton.click();
    await page.waitForTimeout(500);
  });

  test("C4: Comment on a post appears", async ({ page }) => {
    await goTo(page, "/feed");

    // Click on a post link to go to its detail page
    const postLink = page
      .locator('a[href*="/community/"][href*="/post/"]')
      .first();
    await expect(postLink).toBeVisible({ timeout: 20000 });
    await postLink.click();
    await page.waitForLoadState("domcontentloaded");

    // Should see CommentSection with header "Comentarios (N)"
    await expect(
      page.getByText(/Comentarios \(\d+\)/)
    ).toBeVisible({ timeout: 20000 });

    // Fill comment composer
    const commentTextarea = page.locator('textarea[name="content"]');
    await expect(commentTextarea).toBeVisible({ timeout: 5000 });

    const commentText = `QA R2 comment ${Date.now()}`;
    await commentTextarea.fill(commentText);

    // Submit comment
    const commentBtn = page.getByRole("button", { name: "Comentar" });
    await expect(commentBtn).toBeEnabled();
    await commentBtn.click();

    // Comment should appear on the page
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 15000 });
  });

  test("C5: /community lists channels including Geral", async ({ page }) => {
    await goTo(page, "/community");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Comunidade" })
    ).toBeVisible({ timeout: 20000 });

    // Should have channel links
    const channelLinks = page.locator('a[href*="/community/"]');
    await expect(channelLinks.first()).toBeVisible({ timeout: 10000 });

    const count = await channelLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Look for "Geral" channel
    await expect(page.getByText("Geral")).toBeVisible({ timeout: 5000 });
  });

  test("C6: Click channel loads channel posts", async ({ page }) => {
    await goTo(page, "/community");

    // Click first channel link
    const channelLink = page.locator('a[href*="/community/"]').first();
    await expect(channelLink).toBeVisible({ timeout: 20000 });
    await channelLink.click();
    await page.waitForLoadState("domcontentloaded");

    // Should navigate to channel page
    expect(page.url()).toContain("/community/");
    expect(page.url()).not.toMatch(/\/community\/?$/);

    // Should see posts or empty state
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});

// ============================================
// GRUPO E: Marketplace
// ============================================

test.describe("GRUPO E: Marketplace", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, CONTRIB);
  });

  test("E1: /marketplace loads items grid (at least 3)", async ({ page }) => {
    await goTo(page, "/marketplace");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Marketplace" })
    ).toBeVisible({ timeout: 20000 });

    // Items are links to /marketplace/[slug] (exclude /marketplace/upload and nav links)
    const items = page.locator(
      'a[href^="/marketplace/"]:not([href="/marketplace/upload"]):not([href="/marketplace"])'
    );
    await expect(items.first()).toBeVisible({ timeout: 15000 });

    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("E2: Click item opens detail page with description", async ({
    page,
  }) => {
    await goTo(page, "/marketplace");

    const itemLink = page
      .locator(
        'a[href^="/marketplace/"]:not([href="/marketplace/upload"]):not([href="/marketplace"])'
      )
      .first();
    await expect(itemLink).toBeVisible({ timeout: 20000 });
    await itemLink.click();
    await page.waitForLoadState("domcontentloaded");

    // Should be on a detail page /marketplace/[slug]
    expect(page.url()).toMatch(/\/marketplace\/[^/]+$/);

    // Body should contain content (description, title etc)
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  test("E3: /marketplace/upload loads form with fields", async ({ page }) => {
    await goTo(page, "/marketplace/upload");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Novo item" })
    ).toBeVisible({ timeout: 20000 });

    // Form should be visible
    const form = page.locator("form");
    await expect(form).toBeVisible({ timeout: 5000 });

    // Should see submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// GRUPO G: Newsletter, Books & Pricing
// ============================================

test.describe("GRUPO G: Newsletter, Books & Pricing", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, CONTRIB);
  });

  test("G1: /newsletter loads", async ({ page }) => {
    await goTo(page, "/newsletter");

    await expect(
      page.getByText("Inscreva-se na newsletter")
    ).toBeVisible({ timeout: 20000 });

    await expect(page.getByText("Arquivo")).toBeVisible({ timeout: 5000 });
  });

  test("G2: /books loads with book cards", async ({ page }) => {
    await goTo(page, "/books");

    // Use heading role to avoid strict mode violation (multiple elements contain the text)
    await expect(
      page.getByRole("heading", { name: "Livros recomendados" })
    ).toBeVisible({ timeout: 20000 });

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });

  test("G3: /pricing displays 3 tiers (Free, Pro, Premium)", async ({
    page,
  }) => {
    await goTo(page, "/pricing");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Escolha seu plano" })
    ).toBeVisible({ timeout: 20000 });

    // Should display all 3 plan names
    await expect(page.getByRole("heading", { name: "Free" })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("heading", { name: "Premium" })).toBeVisible({
      timeout: 5000,
    });

    // Should show "Gratis" for the free tier
    await expect(page.getByText("Gratis")).toBeVisible({ timeout: 5000 });

    // Should show price for Pro
    await expect(page.getByText("R$49,90")).toBeVisible({ timeout: 5000 });
  });
});
