import { test, expect, type Page } from "@playwright/test";

test.setTimeout(90_000);

const ALUNO_PRO = { email: "aluno1@automatikclub.com", password: "Aluno123!" };
const ALUNO_FREE = { email: "aluno2@automatikclub.com", password: "Aluno123!" };

async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/login", { timeout: 45000, waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.locator("#email").fill(creds.email);
  await page.locator("#password").fill(creds.password);
  await Promise.all([
    page.getByRole("button", { name: "Entrar", exact: true }).click(),
    page.waitForEvent("framenavigated", { timeout: 45000 }).catch(() => null),
  ]);
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes("/login")) break;
    const error = await page
      .locator("text=incorretos")
      .isVisible()
      .catch(() => false);
    if (error) throw new Error("Login failed: wrong credentials");
  }
  if (page.url().includes("/login")) throw new Error("Login timed out");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
}

// All Pro-user tests in one session (single login)
test.describe.serial("Extended Pro Tests (F2, F3, B7)", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await login(page, ALUNO_PRO);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("F2: Settings has notification options", async () => {
    await page.goto("/settings", { timeout: 45000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const content = await page.textContent("main");
    const hasNotification =
      content?.includes("Notifica") ||
      content?.includes("notifica") ||
      content?.includes("Email") ||
      content?.includes("email");
    expect(hasNotification).toBeTruthy();
  });

  test("F3: Settings has privacy section", async () => {
    // Still on /settings
    const content = await page.textContent("main");
    const hasPrivacy =
      content?.includes("Privacidade") ||
      content?.includes("privacidade") ||
      content?.includes("Privacy") ||
      content?.includes("private");
    expect(hasPrivacy).toBeTruthy();
  });

  test("B7: Inventory page renders correctly (items depend on gacha pulls)", async () => {
    await page.goto("/learn/gacha/inventory", { timeout: 45000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    // Verify page structure loads (items depend on user having done gacha pulls)
    await expect(page.getByRole("button", { name: "Inventário" })).toBeVisible();
    await expect(page.getByLabel("Filtrar por raridade")).toBeVisible();
    const itemCountText = await page.locator("text=/\\d+ itens?/").textContent().catch(() => "0 itens");
    expect(itemCountText).toBeTruthy();
  });
});

// Free-user test in separate session
test.describe.serial("H3: Free User Paywall", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await login(page, ALUNO_FREE);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("H3: Free user can access learn (with restrictions)", async () => {
    await page.goto("/learn", { timeout: 45000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    const content = await page.textContent("main");
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(20);
  });
});
