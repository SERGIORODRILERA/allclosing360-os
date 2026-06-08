# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: basic.spec.ts >> ALLCLOSING360 — basic smoke tests >> nav rail view switching works
- Location: tests/e2e/basic.spec.ts:59:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Centro de Operaciones').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=Centro de Operaciones').first()

```

```yaml
- navigation:
  - text: AC
  - button "🏢"
  - button "⚡"
  - button "🎯"
  - button "🧠"
  - button "🔌"
  - text: CEO
- main:
  - button "🚀 AllClosing360 Agencia IA ▼"
  - text: Oficina Virtual 0 activas Cargando oficina 3D… Timeline Acciones 1 ⚡ SISTEMA hace 0s ALLCLOSING360 OS v5 iniciado 15 directores IA · 35 skills · oficina 3D · voz · GitHub 0 Completas 0 Pasos 0 Errores
- complementary:
  - text: Command Chat
  - button "⬇️"
  - button "🗑️"
  - text: Online ALLCLOSING360 OS v5.0 — Live AI Office 07:31 🤖 Bienvenido, CEO. Tengo 15 directores IA activos (incluye Director de Producto con GitHub), 35 skills listas y voz de entrada/salida. Escribe o dicta una orden — el sistema asigna director y skill en tiempo real. 07:31
  - textbox "Escribe u ordena al sistema…"
  - button "🎙"
  - button "↑" [disabled]
  - button "Crear oferta irresistible"
  - button "Campaña Meta Ads"
  - button "Reporte ejecutivo"
  - button "SOP operativo"
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("ALLCLOSING360 — basic smoke tests", () => {
  4  |   test("app loads with correct title", async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await expect(page).toHaveTitle(/ALLCLOSING360/i);
  7  |   });
  8  | 
  9  |   test("main shell renders: nav rail visible", async ({ page }) => {
  10 |     await page.goto("/");
  11 |     // The OS shell should have content within 5 seconds
  12 |     await page.waitForLoadState("networkidle");
  13 |     // NavRail has aria-label or a div with fixed width of 56px
  14 |     const body = page.locator("body");
  15 |     await expect(body).toBeVisible();
  16 |     // Check the app rendered something (not a blank/error page)
  17 |     const osShell = page.locator(".os-shell");
  18 |     await expect(osShell).toBeVisible({ timeout: 10_000 });
  19 |   });
  20 | 
  21 |   test("office view renders without errors", async ({ page }) => {
  22 |     await page.goto("/");
  23 |     await page.waitForLoadState("networkidle");
  24 |     // Default view is "office" — the OfficeScene3D should load
  25 |     // Since we replaced Three.js with CSS, it should render reliably
  26 |     const officeContainer = page.locator(".os-shell");
  27 |     await expect(officeContainer).toBeVisible({ timeout: 10_000 });
  28 |     // Check no critical error boundaries fired
  29 |     const errorMsg = page.locator("text=Oficina 3D no disponible en este dispositivo");
  30 |     await expect(errorMsg).not.toBeVisible({ timeout: 5_000 });
  31 |   });
  32 | 
  33 |   test("chat panel is visible on right side", async ({ page }) => {
  34 |     await page.goto("/");
  35 |     await page.waitForLoadState("networkidle");
  36 |     // Chat panel header text
  37 |     const chatHeader = page.locator("text=Command Chat");
  38 |     await expect(chatHeader).toBeVisible({ timeout: 8_000 });
  39 |   });
  40 | 
  41 |   test("welcome message appears in chat", async ({ page }) => {
  42 |     await page.goto("/");
  43 |     await page.waitForLoadState("networkidle");
  44 |     // Boot message should appear
  45 |     const welcomeMsg = page.locator("text=ALLCLOSING360 OS v5.0");
  46 |     await expect(welcomeMsg).toBeVisible({ timeout: 8_000 });
  47 |   });
  48 | 
  49 |   test("can type in chat textarea", async ({ page }) => {
  50 |     await page.goto("/");
  51 |     await page.waitForLoadState("networkidle");
  52 |     // Find the textarea
  53 |     const textarea = page.locator("textarea").first();
  54 |     await expect(textarea).toBeVisible({ timeout: 8_000 });
  55 |     await textarea.fill("Crear oferta irresistible");
  56 |     await expect(textarea).toHaveValue("Crear oferta irresistible");
  57 |   });
  58 | 
  59 |   test("nav rail view switching works", async ({ page }) => {
  60 |     await page.goto("/");
  61 |     // Wait for React full hydration
  62 |     await page.waitForFunction(() => document.querySelectorAll("button").length > 3);
  63 |     await page.waitForTimeout(1000);
  64 |     // Try clicking on the ops view button — React handles this via onClick
  65 |     await page.click("button[title='Operaciones']");
  66 |     // Wait for React to update the view
  67 |     await page.waitForTimeout(1000);
  68 |     // Check that the main content area changed (header shows Operaciones)
  69 |     const viewLabel = page.locator("text=Centro de Operaciones").first();
> 70 |     await expect(viewLabel).toBeVisible({ timeout: 10_000 });
     |                             ^ Error: expect(locator).toBeVisible() failed
  71 |   });
  72 | 
  73 |   test("connectors panel loads", async ({ page }) => {
  74 |     await page.goto("/");
  75 |     // Wait for React full hydration
  76 |     await page.waitForFunction(() => document.querySelectorAll("button").length > 3);
  77 |     await page.waitForTimeout(1000);
  78 |     await page.click("button[title='Conectores']");
  79 |     await page.waitForTimeout(1000);
  80 |     const hubTitle = page.locator("text=Hub de Conectores");
  81 |     await expect(hubTitle).toBeVisible({ timeout: 10_000 });
  82 |   });
  83 | });
  84 | 
```