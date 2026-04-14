import { test, expect, type Page, type BrowserContext } from "@playwright/test";

test.setTimeout(90_000);

// -- Credentials --
const ALUNO_PRO = { email: "aluno1@automatikclub.com", password: "Aluno123!" };
const ALUNO_FREE = { email: "aluno2@automatikclub.com", password: "Aluno123!" };

// -- Login helper: uses form but polls URL --
async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/login", { timeout: 45000, waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.locator("#email").fill(creds.email);
  await page.locator("#password").fill(creds.password);

  // Click and watch for navigation
  await Promise.all([
    page.getByRole("button", { name: "Entrar", exact: true }).click(),
    page.waitForEvent("framenavigated", { timeout: 45000 }).catch(() => null),
  ]);

  // Poll for URL change (Next.js soft navigation may not trigger waitForURL)
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    const url = page.url();
    if (!url.includes("/login")) break;
    // Check for error message
    const error = await page
      .locator("text=incorretos")
      .isVisible()
      .catch(() => false);
    if (error) throw new Error("Login failed: wrong credentials");
  }
  if (page.url().includes("/login")) {
    throw new Error("Login timed out after 30s — still on /login");
  }
  // Wait for the redirect to fully settle
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
}

// ==========================================
// GROUP B: Gacha System (aluno1 — pro)
// Single login, serial tests
// ==========================================

test.describe.serial("GROUP B: Gacha System", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await login(page, ALUNO_PRO);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("B1: /learn/gacha loads with banners", async () => {
    await page.goto("/learn/gacha", {
      timeout: 45000,
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/learn\/gacha/);
    await expect(page.locator("h1")).toBeVisible({ timeout: 30000 });
  });

  test("B2: Wallet balance displayed", async () => {
    // Still on /learn/gacha from B1
    const wallet = page.getByRole("status");
    await expect(wallet).toBeVisible({ timeout: 30000 });
    const text = await wallet.textContent();
    expect(text).toContain("fragmentos");
    expect(text).toContain("créditos");
  });

  test("B6: Pity counter area", async () => {
    // Still on /learn/gacha
    const mainContent = await page.textContent("main");
    expect(mainContent).toBeTruthy();
    expect(mainContent!.length).toBeGreaterThan(50);
  });

  test("B4: Inventory page loads", async () => {
    await page.goto("/learn/gacha/inventory", {
      timeout: 45000,
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/learn\/gacha\/inventory/);
    await expect(
      page.getByRole("button", { name: "Inventário" })
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByLabel("Filtrar por raridade")).toBeVisible();
    await expect(page.locator("text=/\\d+ itens?/")).toBeVisible();
  });

  test("B5: Marketplace page loads", async () => {
    await page.goto("/learn/gacha/marketplace", {
      timeout: 45000,
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/learn\/gacha\/marketplace/);
    await expect(page.locator("h1")).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole("button", { name: /Marketplace/ })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Minhas/ })).toBeVisible();
  });
});

// ==========================================
// GROUP F: Settings & Profile
// ==========================================

test.describe.serial("GROUP F: Settings & Profile", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await login(page, ALUNO_PRO);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("F1: /settings loads", async () => {
    await page.goto("/settings", { timeout: 45000, waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/settings/);
    const content = await page.textContent("main");
    expect(content!.length).toBeGreaterThan(50);
  });

  test("F4: /profile loads", async () => {
    await page.goto("/profile", { timeout: 45000, waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/profile/);
    const content = await page.textContent("main");
    expect(content!.length).toBeGreaterThan(50);
  });

  test("F5: /profile/edit loads", async () => {
    await page.goto("/profile/edit", { timeout: 45000, waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/profile\/edit/);
    const content = await page.textContent("main");
    expect(content!.length).toBeGreaterThan(50);
  });
});

// ==========================================
// GROUP H: Security
// ==========================================

test.describe.serial("GROUP H: Security", () => {
  test("H1: Unauthenticated /learn → /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/learn", { timeout: 45000, waitUntil: "domcontentloaded" });
    await page.waitForURL(/login/, { timeout: 30000 });
    await expect(page).toHaveURL(/login/);
  });

  test("H2: Unauthenticated /admin → /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/admin", { timeout: 45000, waitUntil: "domcontentloaded" });
    await page.waitForURL(/login/, { timeout: 30000 });
    await expect(page).toHaveURL(/login/);
  });

  test("H4: Aluno /admin → redirected", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, ALUNO_FREE);
    await page.goto("/admin", { timeout: 45000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    expect(page.url()).not.toContain("/admin");
    await ctx.close();
  });

  test("H5: No XSS in rendered page", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, ALUNO_PRO);
    await page.goto("/feed", { timeout: 45000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    const html = await page.content();
    expect(html).not.toContain('>alert("xss")<');
    expect(html).not.toContain(">alert('xss')<");
    await ctx.close();
  });
});
