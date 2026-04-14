import { test, expect, type Page, type BrowserContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

const SUPABASE_URL = "https://fasqbkujrqryuwqozgrr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Lg1tYMsVqYDoX5GQqiT1gw_fndd2wby";
const PROJECT_REF = "fasqbkujrqryuwqozgrr";

const ALUNO_PRO = { email: "aluno1@automatikclub.com", password: "Aluno123!" };
const ALUNO_FREE = { email: "aluno2@automatikclub.com", password: "Aluno123!" };

/**
 * Authenticate via Supabase REST API and inject session cookies
 * directly into the browser context. This bypasses the login form
 * and its rate limiter entirely.
 */
async function loginViaCookies(
  page: Page,
  context: BrowserContext,
  creds: { email: string; password: string },
) {
  // 1. Get tokens from Supabase Auth API
  const res = await page.request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      data: { email: creds.email, password: creds.password },
    },
  );

  if (!res.ok()) {
    throw new Error(
      `Supabase auth failed for ${creds.email}: ${res.status()} ${await res.text()}`,
    );
  }

  const data = await res.json();

  // 2. Build the session payload that @supabase/ssr expects in cookies
  const sessionPayload = JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    expires_in: data.expires_in,
    token_type: "bearer",
    user: data.user,
  });

  // 3. @supabase/ssr uses chunked cookies. Chunk size is 3180 chars.
  //    Cookie name pattern: sb-<ref>-auth-token.N
  const CHUNK_SIZE = 3180;
  const cookieName = `sb-${PROJECT_REF}-auth-token`;
  const chunks: string[] = [];

  for (let i = 0; i < sessionPayload.length; i += CHUNK_SIZE) {
    chunks.push(sessionPayload.slice(i, i + CHUNK_SIZE));
  }

  const cookies = chunks.map((chunk, index) => ({
    name: chunks.length === 1 ? cookieName : `${cookieName}.${index}`,
    value: chunk,
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax" as const,
  }));

  await context.addCookies(cookies);
}

// ---------------------------------------------------------------------------
// GRUPO B: Gacha (login as aluno1 - pro tier)
// ---------------------------------------------------------------------------

test.describe("GRUPO B: Gacha", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page, context }) => {
    await loginViaCookies(page, context, ALUNO_PRO);
  });

  test("B1: /learn/gacha loads (banners or empty state)", async ({ page }) => {
    await page.goto("/learn/gacha", { waitUntil: "domcontentloaded" });

    // Page should render without crash
    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    // Should NOT show an error boundary or 500
    const hasError = await page
      .locator("text=/Erro|500|Internal Server/i")
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(hasError).toBe(false);

    // Gacha page loaded — not redirected to login
    expect(page.url()).toContain("/learn/gacha");
  });

  test("B2: /learn/gacha/inventory loads", async ({ page }) => {
    await page.goto("/learn/gacha/inventory", {
      waitUntil: "domcontentloaded",
    });

    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    const hasError = await page
      .locator("text=/Erro|500|Internal Server/i")
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(hasError).toBe(false);

    expect(page.url()).toContain("/learn/gacha/inventory");
  });

  test("B3: /learn/gacha/marketplace loads", async ({ page }) => {
    await page.goto("/learn/gacha/marketplace", {
      waitUntil: "domcontentloaded",
    });

    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    const hasError = await page
      .locator("text=/Erro|500|Internal Server/i")
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(hasError).toBe(false);

    expect(page.url()).toContain("/learn/gacha/marketplace");
  });
});

// ---------------------------------------------------------------------------
// GRUPO F: Settings & Profile (login as aluno1)
// ---------------------------------------------------------------------------

test.describe("GRUPO F: Settings & Profile", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page, context }) => {
    await loginViaCookies(page, context, ALUNO_PRO);
  });

  test("F1: /settings shows 4 tabs (Conta, Assinatura, Notificacoes, Privacidade)", async ({
    page,
  }) => {
    await page.goto("/settings", { waitUntil: "domcontentloaded" });

    // Page title
    await expect(page.getByText("Configuracoes")).toBeVisible({
      timeout: 15000,
    });

    // All 4 tabs must be present
    const tabs = ["Conta", "Assinatura", "Notificacoes", "Privacidade"];
    for (const tab of tabs) {
      await expect(
        page.locator(`[role="tab"]:has-text("${tab}")`),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("F2: /profile loads with user data", async ({ page }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });

    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    // Should not crash
    const hasError = await page
      .locator("text=/Erro|500|Internal Server/i")
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(hasError).toBe(false);

    // Should have loaded without redirect to login
    expect(page.url()).toContain("/profile");
  });

  test("F3: /profile/edit has all social link fields", async ({ page }) => {
    await page.goto("/profile/edit", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Editar Perfil")).toBeVisible({
      timeout: 15000,
    });

    // Social link fields: instagram, linkedin, github, youtube, reddit
    const socialFields = [
      "instagram",
      "linkedin",
      "github",
      "youtube",
      "reddit",
    ];

    for (const field of socialFields) {
      const input = page.locator(
        `input[name="${field}"], input[id="${field}"], input[placeholder*="${field}" i]`,
      );
      await expect(input).toBeVisible({ timeout: 5000 });
    }
  });
});

// ---------------------------------------------------------------------------
// GRUPO H: Security (multi-role)
// ---------------------------------------------------------------------------

test.describe("GRUPO H: Security — Unauthenticated", () => {
  test.setTimeout(60000);

  // Ensure no stored auth state
  test.use({ storageState: { cookies: [], origins: [] } });

  test("H1: /learn without auth redirects to /login", async ({ page }) => {
    await page.goto("/learn", { waitUntil: "domcontentloaded" });
    if (!page.url().includes("/login")) {
      await page.waitForURL(/\/login/, { timeout: 15000 });
    }
    expect(page.url()).toContain("/login");
  });

  test("H2: /admin without auth redirects to /login", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    if (!page.url().includes("/login")) {
      await page.waitForURL(/\/login/, { timeout: 15000 });
    }
    expect(page.url()).toContain("/login");
  });

  test("H5: /robots.txt exists and contains Disallow entries", async ({
    page,
  }) => {
    const response = await page.goto("/robots.txt", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);

    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    expect(body).toContain("Disallow");
  });
});

test.describe("GRUPO H: Security — Free user restrictions", () => {
  test.setTimeout(60000);

  test("H3: Free user on pro-tier lesson — no crash (paywall or content)", async ({
    page,
    context,
  }) => {
    await loginViaCookies(page, context, ALUNO_FREE);

    // Navigate to /learn to find a track, then try a lesson
    await page.goto("/learn", { waitUntil: "domcontentloaded" });

    // Try to find a track link
    const trackLink = page.locator('a[href*="/learn/"][href*="/"]').first();
    const hasTrack = await trackLink
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasTrack) {
      await trackLink.click();
      await page.waitForLoadState("domcontentloaded");

      // Try to find a course/lesson link deeper
      const lessonLink = page.locator('a[href*="/learn/"]').first();
      const hasLesson = await lessonLink
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasLesson) {
        await lessonLink.click();
        await page.waitForLoadState("domcontentloaded");
      }
    }

    // Regardless of navigation depth, page should not crash
    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    // No unhandled error
    const hasError = await page
      .locator("text=/500|Internal Server Error|Unhandled/i")
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test("H4: Free user accessing /admin — redirected (no crash)", async ({
    page,
    context,
  }) => {
    await loginViaCookies(page, context, ALUNO_FREE);

    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    // Should be redirected away from /admin (to /feed?error=unauthorized)
    if (!page.url().match(/\/(feed|login)/)) {
      await page.waitForURL(/\/(feed|login)/, { timeout: 15000 });
    }

    // Page should not crash
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});
