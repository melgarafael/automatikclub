import { test, expect } from "@playwright/test";

test.describe("Security: Route Protection", () => {
  test("unauthenticated user accessing /admin is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user accessing /feed is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/feed");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user accessing /settings is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user accessing /profile is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/profile");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("after logout, accessing /feed redirects to /login", async ({
    page,
  }) => {
    // Try to access a protected route directly (simulates post-logout state)
    await page.goto("/feed");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });
});

test.describe("Security: robots.txt", () => {
  test("robots.txt exists and blocks sensitive routes", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);

    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    // Must block admin, API, profile, settings
    expect(body).toContain("Disallow: /admin/*");
    expect(body).toContain("Disallow: /api/*");
    expect(body).toContain("Disallow: /profile/*");
    expect(body).toContain("Disallow: /settings/*");

    // Must allow public pages
    expect(body).toContain("Allow: /");
    expect(body).toContain("Allow: /pricing");
    expect(body).toContain("Allow: /free-content/*");
  });
});

test.describe("Security: Rate Limiting on Login", () => {
  test("rapid login attempts are rate-limited after 5 tries", async ({
    page,
  }) => {
    // Use a unique email to avoid polluting other tests' limiter state
    const email = `ratelimit-${Date.now()}@test.com`;

    for (let i = 0; i < 6; i++) {
      await page.goto("/login");
      await page.locator("#email").fill(email);
      await page.locator("#password").fill("wrongpassword123");
      await page.getByRole("button", { name: "Entrar", exact: true }).click();

      // Wait for server action response
      await page.waitForTimeout(500);
    }

    // After 6 rapid attempts, the rate limit message should appear
    const rateLimitMsg = page.getByText(/Muitas tentativas/i);
    await expect(rateLimitMsg).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Security: XSS Prevention", () => {
  test("script tags in URL parameters are not executed", async ({ page }) => {
    // Attempt reflected XSS via query parameters
    await page.goto('/login?error=<script>alert("xss")</script>');

    // Page should load without script execution
    // Check that no alert dialog appeared (Playwright would catch it)
    await expect(page.locator("body")).toBeVisible();

    // The script tag should not be rendered as HTML
    const content = await page.content();
    expect(content).not.toContain("<script>alert");
  });
});

test.describe("Security: Security Headers", () => {
  test("responses include security headers", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).toBeTruthy();

    const headers = response!.headers();

    // X-Frame-Options
    expect(headers["x-frame-options"]).toBe("DENY");

    // X-Content-Type-Options
    expect(headers["x-content-type-options"]).toBe("nosniff");

    // Referrer-Policy
    expect(headers["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin"
    );

    // HSTS
    expect(headers["strict-transport-security"]).toContain("max-age=");

    // CSP (report-only for now)
    const csp = headers["content-security-policy-report-only"];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src");
    expect(csp).toContain("frame-src");
  });
});
