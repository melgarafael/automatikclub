import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SUPABASE_URL = "https://fasqbkujrqryuwqozgrr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Lg1tYMsVqYDoX5GQqiT1gw_fndd2wby";
const COOKIE_PREFIX = "sb-fasqbkujrqryuwqozgrr-auth-token";

const ADMIN = { email: "admin@automatikclub.com", password: "Admin123!" };
const ALUNO = { email: "aluno1@automatikclub.com", password: "Aluno123!" };

/**
 * Login via Supabase REST API, then inject the session cookie so the
 * Next.js middleware / server components recognise the user.
 * This bypasses the in-memory rate limiter on the login server action.
 */
async function login(page: Page, creds: { email: string; password: string }) {
  const res = await page.request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      data: { email: creds.email, password: creds.password },
    }
  );
  expect(res.ok(), `Supabase login failed for ${creds.email}`).toBeTruthy();

  const data = await res.json();
  const sessionPayload = JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: "bearer",
    expires_in: data.expires_in,
    expires_at: data.expires_at,
    user: data.user,
  });

  // @supabase/ssr stores the session as a base64-encoded cookie.
  // For tokens > ~3180 chars, it chunks into .0, .1, etc.
  const encoded = Buffer.from(sessionPayload).toString("base64");
  const CHUNK_SIZE = 3180;

  const cookieDomain = "localhost";
  const cookieBase = {
    domain: cookieDomain,
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax" as const,
  };

  if (encoded.length <= CHUNK_SIZE) {
    await page.context().addCookies([
      { ...cookieBase, name: COOKIE_PREFIX, value: `base64-${encoded}` },
    ]);
  } else {
    // Chunk the cookie
    const chunks: string[] = [];
    for (let i = 0; i < encoded.length; i += CHUNK_SIZE) {
      chunks.push(encoded.slice(i, i + CHUNK_SIZE));
    }
    const cookies = chunks.map((chunk, idx) => ({
      ...cookieBase,
      name: `${COOKIE_PREFIX}.${idx}`,
      value: `base64-${chunk}`,
    }));
    await page.context().addCookies(cookies);
  }

  // Navigate so the cookie takes effect
  await page.goto("/feed");
  // Authenticated user should NOT be redirected to /login
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
}

// ============================================================================
// GRUPO A: Admin CMS
// ============================================================================

test.describe("GRUPO A: Admin CMS", () => {
  test("A1: Login admin -> /admin dashboard loads with stats", async ({ page }) => {
    await login(page, ADMIN);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);

    // Dashboard heading
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });

    // Stats cards should be present
    await expect(page.getByText("Total usuarios")).toBeVisible();
    await expect(page.getByText("Cursos publicados")).toBeVisible();
    await expect(page.getByText("Aulas total")).toBeVisible();
  });

  test("A2: /admin/content -> tracks listed (at least 'Trilha IA para Renda')", async ({ page }) => {
    await login(page, ADMIN);
    await page.goto("/admin/content");
    await expect(page).toHaveURL(/\/admin\/content/);

    // Content management heading
    await expect(
      page.getByRole("heading", { name: /Gerenciamento de Conteudo/i })
    ).toBeVisible({ timeout: 10000 });

    // Tracks tab should be active by default and show at least 1 track
    await expect(page.getByText(/Trilhas \(\d+\)/)).toBeVisible();

    // The seed track should be listed
    await expect(page.getByText("Trilha IA para Renda")).toBeVisible({ timeout: 5000 });
  });

  test("A3: Create new track 'QA Test Track R2'", async ({ page }) => {
    await login(page, ADMIN);
    await page.goto("/admin/content/tracks/new");
    await expect(page).toHaveURL(/\/admin\/content\/tracks\/new/);

    // Fill form
    await page.getByRole("heading", { name: "Nova Trilha" }).waitFor({ timeout: 10000 });

    // Use timestamp to avoid duplicate slug conflicts on re-runs
    const trackTitle = `QA Test Track R2 ${Date.now()}`;

    await page.locator('input[name="title"]').fill(trackTitle);
    await page.locator('textarea[name="description"]').fill("Test");
    await page.locator('input[name="category"]').fill("qa-testing");
    await page.locator('select[name="difficulty"]').selectOption("beginner");
    await page.locator('select[name="tier_required"]').selectOption("free");

    // Submit
    await page.getByRole("button", { name: "Criar trilha" }).click();

    // Wait for the server action to complete and React to re-render
    await expect(page.getByText("Salvo com sucesso")).toBeVisible({ timeout: 30000 });

    // Navigate to content list and verify the track appears
    await page.goto("/admin/content");
    await expect(page.getByText(/QA Test Track R2/).first()).toBeVisible({ timeout: 10000 });
  });

  test("A4: /admin/users -> user list loads with roles and tiers", async ({ page }) => {
    await login(page, ADMIN);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/);

    // Users heading
    await expect(
      page.getByRole("heading", { name: /Gerenciamento de Usuarios/i })
    ).toBeVisible({ timeout: 10000 });

    // Should show at least one user row with role info
    await expect(page.getByText(/admin/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("A5: Non-admin (aluno1) accessing /admin -> redirected to /feed", async ({ page }) => {
    await login(page, ALUNO);
    await page.goto("/admin");

    // Non-admin should be redirected to /feed
    await expect(page).toHaveURL(/\/feed/, { timeout: 10000 });
  });
});

// ============================================================================
// GRUPO D: Gamification
// ============================================================================

test.describe("GRUPO D: Gamification", () => {
  test("D1: Login aluno1 -> /profile -> XP, level, streak displayed", async ({ page }) => {
    await login(page, ALUNO);
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/);

    // Profile heading
    await expect(page.getByText("Meu Perfil")).toBeVisible({ timeout: 10000 });

    // XP display
    await expect(page.getByText(/XP/)).toBeVisible({ timeout: 5000 });

    // Level display (Nivel or Lv or Level)
    await expect(page.getByText(/Nivel|N[ií]vel|Lv|Level/i).first()).toBeVisible({ timeout: 5000 });

    // Streak display (dias)
    await expect(page.getByText(/dias/i)).toBeVisible({ timeout: 5000 });
  });

  test("D2: /ranking -> leaderboard shows ranked users", async ({ page }) => {
    await login(page, ALUNO);
    await page.goto("/ranking");
    await expect(page).toHaveURL(/\/ranking/);

    // Ranking heading
    await expect(page.getByRole("heading", { name: "Ranking" })).toBeVisible({ timeout: 10000 });

    // Should show description text
    await expect(page.getByText(/membros mais ativos/i)).toBeVisible();
  });

  test("D3: /learn/progresso -> progress dashboard loads with stats", async ({ page }) => {
    await login(page, ALUNO);
    await page.goto("/learn/progresso");
    await expect(page).toHaveURL(/\/learn\/progresso/, { timeout: 10000 });

    // Should load the progress page (either dashboard or empty state)
    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    // The Topbar title or breadcrumb should be visible
    await expect(page.getByText(/progresso/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("D4: Complete a lesson -> 'Marcar completa' button works", async ({ page }) => {
    await login(page, ALUNO);

    // Navigate directly to a known seed lesson (free tier)
    await page.goto("/learn/trilha-ia-para-renda/chatgpt-zero-avancado/o-que-e-chatgpt");
    await page.waitForLoadState("networkidle");

    // Should be on the lesson page (not redirected to login)
    await expect(page).toHaveURL(/o-que-e-chatgpt/, { timeout: 10000 });

    // Look for the "Marcar completa" button or already-completed state
    const markCompleteBtn = page.getByRole("button", { name: /Marcar completa/i });
    const completedBtn = page.getByRole("button").filter({ hasText: "Completa" });

    // Wait for either button to appear
    await expect(markCompleteBtn.or(completedBtn)).toBeVisible({ timeout: 10000 });

    if (await markCompleteBtn.isVisible().catch(() => false)) {
      await markCompleteBtn.click();

      // After clicking, button should change to "Completa" state
      await expect(completedBtn).toBeVisible({ timeout: 10000 });
    } else {
      // Already completed from a previous run — verify it shows "Completa"
      await expect(completedBtn).toBeVisible();
    }
  });
});
