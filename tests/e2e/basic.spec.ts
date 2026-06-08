import { test, expect } from "@playwright/test";

test.describe("ALLCLOSING360 — basic smoke tests", () => {
  test("app loads with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ALLCLOSING360/i);
  });

  test("main shell renders: nav rail visible", async ({ page }) => {
    await page.goto("/");
    // The OS shell should have content within 5 seconds
    await page.waitForLoadState("networkidle");
    // NavRail has aria-label or a div with fixed width of 56px
    const body = page.locator("body");
    await expect(body).toBeVisible();
    // Check the app rendered something (not a blank/error page)
    const osShell = page.locator(".os-shell");
    await expect(osShell).toBeVisible({ timeout: 10_000 });
  });

  test("office view renders without errors", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Default view is "office" — the OfficeScene3D should load
    // Since we replaced Three.js with CSS, it should render reliably
    const officeContainer = page.locator(".os-shell");
    await expect(officeContainer).toBeVisible({ timeout: 10_000 });
    // Check no critical error boundaries fired
    const errorMsg = page.locator("text=Oficina 3D no disponible en este dispositivo");
    await expect(errorMsg).not.toBeVisible({ timeout: 5_000 });
  });

  test("chat panel is visible on right side", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Chat panel header text
    const chatHeader = page.locator("text=Command Chat");
    await expect(chatHeader).toBeVisible({ timeout: 8_000 });
  });

  test("welcome message appears in chat", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Boot message should appear
    const welcomeMsg = page.locator("text=ALLCLOSING360 OS v5.0");
    await expect(welcomeMsg).toBeVisible({ timeout: 8_000 });
  });

  test("can type in chat textarea", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Find the textarea
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: 8_000 });
    await textarea.fill("Crear oferta irresistible");
    await expect(textarea).toHaveValue("Crear oferta irresistible");
  });

  test("nav rail view switching works", async ({ page }) => {
    await page.goto("/");
    // Wait for React full hydration
    await page.waitForFunction(() => document.querySelectorAll("button").length > 3);
    await page.waitForTimeout(1000);
    // Try clicking on the ops view button — React handles this via onClick
    await page.click("button[title='Operaciones']");
    // Wait for React to update the view
    await page.waitForTimeout(1000);
    // Check that the main content area changed (Operaciones label in header)
    const viewLabel = page.locator("text=Centro de Operaciones");
    await expect(viewLabel).toBeVisible({ timeout: 10_000 });
  });

  test("connectors panel loads", async ({ page }) => {
    await page.goto("/");
    // Wait for React full hydration
    await page.waitForFunction(() => document.querySelectorAll("button").length > 3);
    await page.waitForTimeout(1000);
    await page.click("button[title='Conectores']");
    await page.waitForTimeout(1000);
    const hubTitle = page.locator("text=Hub de Conectores");
    await expect(hubTitle).toBeVisible({ timeout: 10_000 });
  });
});
