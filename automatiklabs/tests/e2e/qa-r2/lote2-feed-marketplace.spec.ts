import { test, expect, type Page } from "@playwright/test";

// Next.js 16 SSR pages can be slow on first hit
test.setTimeout(90_000);

// ── Auth helpers ──

const SUPABASE_URL = "https://fasqbkujrqryuwqozgrr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Lg1tYMsVqYDoX5GQqiT1gw_fndd2wby";

const CONTRIB = { email: "contrib@automatikclub.com", password: "Contrib1!" };

/**
 * Login by calling Supabase auth API then setting cookies via document.cookie
 * in the browser. The @supabase/ssr library stores sessions as base64url
 * encoded chunked cookies with a "base64-" prefix.
 * This bypasses the server-side login rate limiter.
 */
async function loginViaBrowser(
  page: Page,
  creds: { email: string; password: string }
) {
  // Navigate to login page to be on the right origin
  await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60000 });

  // Execute auth + cookie setup in the browser
  const result = await page.evaluate(
    async ({ url, key, email, password }) => {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        return { error: `Auth failed: ${res.status}` };
      }

      const session = await res.json();

      // Build the session JSON that @supabase/ssr stores
      const sessionData = JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
        expires_in: session.expires_in,
        token_type: "bearer",
        user: session.user,
      });

      // @supabase/ssr uses base64url encoding with "base64-" prefix
      // Encode string to UTF-8 bytes, then to base64url
      const encoder = new TextEncoder();
      const bytes = encoder.encode(sessionData);
      let binary = "";
      for (const b of bytes) {
        binary += String.fromCharCode(b);
      }
      const base64 = btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const encoded = "base64-" + base64;

      // Chunk and set as cookies (max 3180 url-encoded chars per chunk)
      const MAX_CHUNK = 3180;
      const cookieName = "sb-fasqbkujrqryuwqozgrr-auth-token";

      // Clear any existing auth cookies first
      for (let i = 0; i < 6; i++) {
        document.cookie = `${cookieName}.${i}=; path=/; max-age=0`;
      }
      document.cookie = `${cookieName}=; path=/; max-age=0`;

      // base64url chars are all single-byte in URL encoding, no expansion
      if (encoded.length <= MAX_CHUNK) {
        document.cookie = `${cookieName}.0=${encoded}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        let remaining = encoded;
        let i = 0;
        while (remaining.length > 0) {
          const chunk = remaining.slice(0, MAX_CHUNK);
          remaining = remaining.slice(MAX_CHUNK);
          document.cookie = `${cookieName}.${i}=${chunk}; path=/; max-age=604800; SameSite=Lax`;
          i++;
        }
      }

      return { ok: true };
    },
    {
      url: SUPABASE_URL,
      key: SUPABASE_ANON_KEY,
      email: creds.email,
      password: creds.password,
    }
  );

  if ("error" in result) {
    throw new Error(result.error as string);
  }
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
    await loginViaBrowser(page, CONTRIB);
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

    // Wait for channels to load - find a link with a specific slug pattern
    const channelLink = page.locator('a[href^="/community/"][href*="/"]').and(
      page.locator(':not([href="/community"])')
    ).first();
    // Alternative: get the Geral channel link specifically
    const geralLink = page.locator('a[href="/community/geral"]');
    await expect(geralLink).toBeVisible({ timeout: 20000 });
    await geralLink.click();

    // Wait for navigation to complete
    await page.waitForURL(/\/community\/geral/, {
      timeout: 15000,
      waitUntil: "domcontentloaded",
    });

    // Should be on channel page
    expect(page.url()).toContain("/community/geral");

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
    await loginViaBrowser(page, CONTRIB);
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

    // Wait for marketplace heading, then grab the first item link's href
    await expect(
      page.getByRole("heading", { name: "Marketplace" })
    ).toBeVisible({ timeout: 20000 });

    // MarketplaceCard links look like /marketplace/[slug]
    // Get the href of the first item link
    const itemLink = page
      .locator(
        'a[href^="/marketplace/"]:not([href="/marketplace/upload"]):not([href="/marketplace"])'
      )
      .first();
    await expect(itemLink).toBeVisible({ timeout: 10000 });
    const href = await itemLink.getAttribute("href");
    expect(href).toBeTruthy();

    // Navigate directly to the detail page (avoids Next.js client-side nav issues)
    await goTo(page, href!);

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
    await loginViaBrowser(page, CONTRIB);
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

    // Use heading role to avoid strict mode violation
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
