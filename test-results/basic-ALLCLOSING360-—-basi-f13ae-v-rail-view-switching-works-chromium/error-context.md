# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: basic.spec.ts >> ALLCLOSING360 — basic smoke tests >> nav rail view switching works
- Location: tests/e2e/basic.spec.ts:59:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - generic [ref=e4]: AC
    - generic [ref=e5]:
      - button "🏢" [ref=e6] [cursor=pointer]: 🏢
      - button "⚡" [active] [ref=e8] [cursor=pointer]
      - button "🎯" [ref=e9] [cursor=pointer]
      - button "🧠" [ref=e10] [cursor=pointer]
      - button "🔌" [ref=e11] [cursor=pointer]
    - generic "CEO — Tú" [ref=e12]: CEO
  - main [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]:
        - button "🚀 AllClosing360 Agencia IA ▼" [ref=e17] [cursor=pointer]:
          - generic [ref=e18]: 🚀
          - generic [ref=e19]:
            - generic [ref=e20]: AllClosing360
            - generic [ref=e21]: Agencia IA
          - generic [ref=e22]: ▼
        - generic [ref=e24]: Oficina Virtual
      - generic [ref=e26]: 0 activas
    - generic [ref=e29]:
      - generic [ref=e33]: Cargando oficina 3D…
      - generic [ref=e34]:
        - generic [ref=e35]:
          - generic [ref=e36]: Timeline
          - generic [ref=e37]:
            - text: Acciones
            - generic [ref=e38]: "1"
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e46]: ⚡ SISTEMA
            - generic [ref=e47]: hace 0s
          - generic [ref=e48]: ALLCLOSING360 OS v5 iniciado
          - generic [ref=e49]: 15 directores IA · 35 skills · oficina 3D · voz · GitHub
        - generic [ref=e50]:
          - generic [ref=e51]:
            - generic [ref=e52]: "0"
            - generic [ref=e53]: Completas
          - generic [ref=e54]:
            - generic [ref=e55]: "0"
            - generic [ref=e56]: Pasos
          - generic [ref=e57]:
            - generic [ref=e58]: "0"
            - generic [ref=e59]: Errores
  - complementary [ref=e60]:
    - generic [ref=e61]:
      - generic [ref=e62]:
        - generic [ref=e63]: Command Chat
        - generic [ref=e64]:
          - button "⬇️" [ref=e65] [cursor=pointer]
          - button "🗑️" [ref=e66] [cursor=pointer]
      - generic [ref=e70]: Online
    - generic [ref=e72]:
      - generic [ref=e74]:
        - text: ALLCLOSING360 OS v5.0 — Live AI Office
        - generic [ref=e76]: 07:31
      - generic [ref=e77]:
        - generic [ref=e78]: 🤖
        - generic [ref=e79]:
          - generic [ref=e80]: Bienvenido, CEO. Tengo 15 directores IA activos (incluye Director de Producto con GitHub), 35 skills listas y voz de entrada/salida. Escribe o dicta una orden — el sistema asigna director y skill en tiempo real.
          - generic [ref=e81]: 07:31
    - generic [ref=e83]:
      - generic [ref=e84]:
        - textbox "Escribe u ordena al sistema…" [ref=e85]
        - generic [ref=e86]:
          - button "🎙" [ref=e87] [cursor=pointer]
          - button "↑" [disabled] [ref=e88]
      - generic [ref=e89]:
        - button "Crear oferta irresistible" [ref=e90] [cursor=pointer]
        - button "Campaña Meta Ads" [ref=e91] [cursor=pointer]
        - button "Reporte ejecutivo" [ref=e92] [cursor=pointer]
        - button "SOP operativo" [ref=e93] [cursor=pointer]
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
  61 |     await page.waitForLoadState("networkidle");
  62 |     await page.waitForFunction(() => document.querySelectorAll("button").length > 3, { timeout: 10_000 });
  63 |     // Force click via locator with force:true to bypass any overlay issues
  64 |     const opsBtn = page.locator("button[title='Operaciones']");
  65 |     await opsBtn.waitFor({ state: "visible", timeout: 8_000 });
  66 |     await opsBtn.click({ force: true });
  67 |     // The VIEW_LABEL rendered inside main panel header
> 68 |     await page.waitForFunction(
     |                ^ Error: page.waitForFunction: Test timeout of 30000ms exceeded.
  69 |       () => document.body.innerText.includes("Operaciones"),
  70 |       { timeout: 10_000 }
  71 |     );
  72 |     expect(await page.locator("body").innerText()).toContain("Operaciones");
  73 |   });
  74 | 
  75 |   test("connectors panel loads", async ({ page }) => {
  76 |     await page.goto("/");
  77 |     await page.waitForLoadState("networkidle");
  78 |     await page.waitForFunction(() => document.querySelectorAll("button").length > 3, { timeout: 10_000 });
  79 |     const connBtn = page.locator("button[title='Conectores']");
  80 |     await connBtn.waitFor({ state: "visible", timeout: 8_000 });
  81 |     await connBtn.click({ force: true });
  82 |     await page.waitForFunction(
  83 |       () => document.body.innerText.includes("Conectores"),
  84 |       { timeout: 10_000 }
  85 |     );
  86 |     expect(await page.locator("body").innerText()).toContain("Conectores");
  87 |   });
  88 | });
  89 | 
```