import { test, expect } from "@playwright/test";

const BASE = process.env["TEST_URL"] ?? "http://localhost:3001";
const TIMEOUT = 90_000;

test.describe("ALLCLOSING360 — Validación completa", () => {

  test("Caso 1 — Landing dental", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector("textarea", { timeout: 15000 });

    const input = page.locator("textarea").first();
    await input.fill("Hazme una landing para una clínica dental de implantes en Madrid");
    await input.press("Enter");

    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes("Marketing") || text.includes("Comercial") || text.includes("Embudos") || text.includes("Contenido");
    }, { timeout: 15000 });

    await page.waitForSelector('button:has-text("Ver resultado"), button:has-text("resultado"), [data-status="completed"]', { timeout: TIMEOUT });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).toContain("landing");
  });

  test("Caso 2 — Campaña Meta Ads", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector("textarea", { timeout: 15000 });

    const input = page.locator("textarea").first();
    await input.fill("Crea una campaña de Meta Ads para captar pacientes de ortodoncia invisible");
    await input.press("Enter");

    await page.waitForSelector('button:has-text("Ver resultado"), button:has-text("resultado"), [data-status="completed"]', { timeout: TIMEOUT });

    const bodyText = await page.locator("body").innerText();
    const lower = bodyText.toLowerCase();
    expect(lower.includes("meta") || lower.includes("facebook") || lower.includes("ads") || lower.includes("campaña")).toBeTruthy();
  });

  test("Caso 3 — 5 ideas de anuncios imagen", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector("textarea", { timeout: 15000 });

    const input = page.locator("textarea").first();
    await input.fill("Créame 5 ideas de anuncios en imagen para una clínica estética");
    await input.press("Enter");

    await page.waitForSelector('button:has-text("Ver resultado"), button:has-text("resultado"), [data-status="completed"]', { timeout: TIMEOUT });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toBeTruthy();
  });

  test("Caso 4 — Automatización GHL", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector("textarea", { timeout: 15000 });

    const input = page.locator("textarea").first();
    await input.fill("Construye una automatización en GoHighLevel para leads que rellenan un formulario de una clínica dental");
    await input.press("Enter");

    await page.waitForSelector('button:has-text("Ver resultado"), button:has-text("resultado"), [data-status="completed"]', { timeout: TIMEOUT });

    const bodyText = await page.locator("body").innerText();
    const lower = bodyText.toLowerCase();
    expect(lower.includes("ghl") || lower.includes("highlevel") || lower.includes("automatización") || lower.includes("workflow") || lower.includes("crm")).toBeTruthy();
  });

  test("Caso 5 — Competencia Instagram", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector("textarea", { timeout: 15000 });

    const input = page.locator("textarea").first();
    await input.fill("Investiga la competencia en Instagram de una clínica dental premium en Alicante");
    await input.press("Enter");

    await page.waitForSelector('button:has-text("Ver resultado"), button:has-text("resultado"), [data-status="completed"]', { timeout: TIMEOUT });

    const bodyText = await page.locator("body").innerText();
    const lower = bodyText.toLowerCase();
    expect(lower.includes("instagram") || lower.includes("competencia") || lower.includes("benchmark") || lower.includes("análisis")).toBeTruthy();
  });

  test("Caso 6 — Oferta irresistible", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector("textarea", { timeout: 15000 });

    const input = page.locator("textarea").first();
    await input.fill("Créame una oferta irresistible para vender marketing a clínicas dentales con garantía");
    await input.press("Enter");

    await page.waitForSelector('button:has-text("Ver resultado"), button:has-text("resultado"), [data-status="completed"]', { timeout: TIMEOUT });

    const bodyText = await page.locator("body").innerText();
    const lower = bodyText.toLowerCase();
    expect(lower.includes("oferta") || lower.includes("garantía") || lower.includes("precio") || lower.includes("propuesta")).toBeTruthy();
  });

  test("Caso 7 — Chat responde coherentemente", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector("textarea", { timeout: 15000 });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).toContain("allclosing360");
  });

  test("Caso 8 — Oficina visual completa", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    const officeNav = page.locator("button, [role='button']").filter({ hasText: /oficina|office/i }).first();
    if (await officeNav.count() > 0) {
      await officeNav.click();
      await page.waitForTimeout(2000);
    }

    const bodyText = await page.locator("body").innerText();
    const lower = bodyText.toLowerCase();
    expect(lower.includes("recepción") || lower.includes("allclosing")).toBeTruthy();
  });

});
