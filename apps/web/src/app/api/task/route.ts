import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { writeFileSync, mkdirSync } from "fs"; // best-effort; skipped on Vercel
import path from "path";
import { DIRECTOR_MAP } from "../../../lib/engines";
import { SKILL_MAP } from "../../../lib/skills";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SONNET = "claude-sonnet-4-6";
const HAIKU  = "claude-haiku-4-5-20251001";

const POWER_SKILLS = new Set([
  "crear_landing", "crear_reporte_ejecutivo", "crear_sop_operativo",
  "crear_campana_meta_ads", "crear_estrategia_seo", "crear_propuesta_comercial",
  "leer_repositorio", "crear_pull_request",
]);

function tryWriteFile(filename: string, content: string): string | null {
  try {
    const d = path.join(process.cwd(), "public", "generated");
    mkdirSync(d, { recursive: true });
    writeFileSync(path.join(d, filename), content, "utf-8");
    return "/generated/" + filename;
  } catch {
    return null;
  }
}

// ─── Tool definitions ────────────────────────────────────────────────────────

const BASE_TOOLS: Anthropic.Tool[] = [
  {
    name: "create_html_file",
    description:
      "Create a complete, self-contained HTML file. Use for: landing pages, sales pages, email templates, web forms. Must include embedded CSS (modern, dark or branded design) and be production-ready.",
    input_schema: {
      type: "object",
      properties: {
        filename: { type: "string", description: "e.g. landing_allclosing360.html" },
        html: {
          type: "string",
          description:
            "Complete HTML5 document. MUST include: DOCTYPE, head with meta tags, embedded CSS with modern design, all sections fully implemented. NO placeholders.",
        },
        description: { type: "string", description: "What this file does" },
      },
      required: ["filename", "html", "description"],
    },
  },
  {
    name: "create_document",
    description:
      "Create a structured professional document. Use for: strategies, SOPs, scripts, reports, plans, ad copy, email sequences, proposals.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: {
          type: "string",
          description: "Full document in markdown. Must be complete, professional, actionable. NO placeholders.",
        },
        doc_type: {
          type: "string",
          enum: ["strategy", "report", "sop", "script", "plan", "ad_copy", "email_sequence", "proposal", "analysis"],
        },
      },
      required: ["title", "content", "doc_type"],
    },
  },
  {
    name: "create_code_file",
    description:
      "Create working code: automation scripts, GHL workflows (JSON), n8n flows, API integrations, prompts.",
    input_schema: {
      type: "object",
      properties: {
        filename: { type: "string" },
        language: { type: "string", enum: ["javascript", "typescript", "python", "json", "yaml", "bash"] },
        code: { type: "string", description: "Complete, working code. No stubs." },
        description: { type: "string" },
      },
      required: ["filename", "language", "code", "description"],
    },
  },
];

const GITHUB_TOOLS: Anthropic.Tool[] = [
  {
    name: "github_read_repo",
    description:
      "Read files or directory tree from the GitHub repository. Use to understand the codebase before proposing changes.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path or directory path. Use empty string '' for repo root. Example: 'apps/web/src'.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "github_create_pr",
    description:
      "Create a pull request on GitHub with new or modified files. Creates a branch, commits the files, and opens the PR.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "PR title. Short, imperative." },
        body: { type: "string", description: "PR description in markdown. Explain what and why." },
        branch: { type: "string", description: "New branch name, e.g. 'feature/add-onboarding-flow'." },
        files: {
          type: "array",
          description: "Files to create or update in the PR.",
          items: {
            type: "object",
            properties: {
              path: { type: "string", description: "File path from repo root, e.g. 'apps/web/src/lib/utils.ts'" },
              content: { type: "string", description: "Full file content." },
            },
            required: ["path", "content"],
          },
        },
      },
      required: ["title", "body", "branch", "files"],
    },
  },
];

// ─── GitHub helpers ───────────────────────────────────────────────────────────

interface GHFile { path: string; content: string }

async function githubReadPath(repoFull: string, token: string, filePath: string): Promise<string> {
  const url = filePath
    ? `https://api.github.com/repos/${repoFull}/contents/${encodeURIComponent(filePath)}`
    : `https://api.github.com/repos/${repoFull}/contents`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
  });

  if (!res.ok) return `Error ${res.status}: ${await res.text()}`;
  const data: unknown = await res.json();

  if (Array.isArray(data)) {
    // Directory listing
    return (data as { name: string; type: string; size?: number }[])
      .map((f) => `${f.type === "dir" ? "📁" : "📄"} ${f.name}${f.size ? ` (${f.size}B)` : ""}`)
      .join("\n");
  }

  const item = data as { type: string; encoding?: string; content?: string };
  if (item.type === "file" && item.encoding === "base64" && item.content) {
    return Buffer.from(item.content.replace(/\n/g, ""), "base64").toString("utf-8");
  }
  return JSON.stringify(data, null, 2);
}

async function githubCreatePR(
  repoFull: string,
  token: string,
  title: string,
  body: string,
  branch: string,
  files: GHFile[],
): Promise<{ prUrl: string; prNumber: number } | { error: string }> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  // 1. Get default branch HEAD SHA
  const repoRes = await fetch(`https://api.github.com/repos/${repoFull}`, { headers });
  if (!repoRes.ok) return { error: `Repo fetch failed: ${repoRes.status}` };
  const repo = await repoRes.json() as { default_branch: string };
  const defaultBranch = repo.default_branch;

  const refRes = await fetch(`https://api.github.com/repos/${repoFull}/git/ref/heads/${defaultBranch}`, { headers });
  if (!refRes.ok) return { error: `Ref fetch failed: ${refRes.status}` };
  const ref = await refRes.json() as { object: { sha: string } };
  const baseSha = ref.object.sha;

  // 2. Get base tree SHA
  const commitRes = await fetch(`https://api.github.com/repos/${repoFull}/git/commits/${baseSha}`, { headers });
  if (!commitRes.ok) return { error: `Commit fetch failed: ${commitRes.status}` };
  const commit = await commitRes.json() as { tree: { sha: string } };
  const baseTreeSha = commit.tree.sha;

  // 3. Create blobs + new tree
  const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];
  for (const file of files) {
    const blobRes = await fetch(`https://api.github.com/repos/${repoFull}/git/blobs`, {
      method: "POST", headers,
      body: JSON.stringify({ content: Buffer.from(file.content).toString("base64"), encoding: "base64" }),
    });
    if (!blobRes.ok) return { error: `Blob create failed for ${file.path}` };
    const blob = await blobRes.json() as { sha: string };
    treeItems.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const treeRes = await fetch(`https://api.github.com/repos/${repoFull}/git/trees`, {
    method: "POST", headers,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });
  if (!treeRes.ok) return { error: `Tree create failed: ${treeRes.status}` };
  const tree = await treeRes.json() as { sha: string };

  // 4. Create commit
  const newCommitRes = await fetch(`https://api.github.com/repos/${repoFull}/git/commits`, {
    method: "POST", headers,
    body: JSON.stringify({ message: title, tree: tree.sha, parents: [baseSha] }),
  });
  if (!newCommitRes.ok) return { error: `Commit create failed: ${newCommitRes.status}` };
  const newCommit = await newCommitRes.json() as { sha: string };

  // 5. Create branch
  const branchRes = await fetch(`https://api.github.com/repos/${repoFull}/git/refs`, {
    method: "POST", headers,
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommit.sha }),
  });
  if (!branchRes.ok) return { error: `Branch create failed: ${branchRes.status}` };

  // 6. Create PR
  const prRes = await fetch(`https://api.github.com/repos/${repoFull}/pulls`, {
    method: "POST", headers,
    body: JSON.stringify({ title, body, head: branch, base: defaultBranch }),
  });
  if (!prRes.ok) return { error: `PR create failed: ${prRes.status} — ${await prRes.text()}` };
  const pr = await prRes.json() as { html_url: string; number: number };
  return { prUrl: pr.html_url, prNumber: pr.number };
}

// ─── Tool hint ────────────────────────────────────────────────────────────────

function skillToToolHint(skillId: string, directorId: string): string {
  if (directorId === "director_producto") return "github";
  const HTML = ["crear_landing"];
  const CODE = ["crear_automatizacion_ghl", "crear_flujo_n8n", "crear_integracion_api", "crear_prompt_agente", "crear_base_conocimiento"];
  if (HTML.includes(skillId)) return "create_html_file";
  if (CODE.includes(skillId)) return "create_code_file";
  return "create_document";
}

type DirectorShape = { humanName: string; name: string; description: string };
type SkillShape    = { name: string; description: string };

function buildSystem(director: DirectorShape | undefined, skill: SkillShape | undefined, company: string, toolHint: string): string {
  const toolInstructions: Record<string, string> = {
    create_html_file:
      "IMPORTANTE: La landing debe ser completa y vendible. Incluye: hero impactante con headline y subheadline, propuesta de valor unica, 3-5 beneficios con iconos emoji, testimonio(s) de ejemplo, seccion de garantia, precio/oferta (si aplica), CTA prominente, footer. Todo en espanol. " +
      "USA la herramienta create_html_file AHORA MISMO. El HTML debe ser completo y funcional (max 300 lineas). CSS embebido moderno y profesional. Contenido real adaptado al negocio. CERO placeholders.",
    create_code_file:
      "USA la herramienta create_code_file. El codigo debe ser funcional y completo. Sin stubs ni TODOs.",
    create_document:
      "USA la herramienta create_document AHORA. El documento debe contener:\n" +
      "1. ENCABEZADO con titulo, fecha, empresa cliente y director responsable\n" +
      "2. RESUMEN EJECUTIVO (3-5 puntos clave, concretos)\n" +
      "3. CUERPO PRINCIPAL con secciones numeradas, datos especificos, ejemplos reales\n" +
      "4. TABLAS cuando aplique (KPIs, presupuestos, timelines)\n" +
      "5. PROXIMOS PASOS: lista de 3-5 acciones especificas con responsable y fecha sugerida\n" +
      "PROHIBIDO: placeholders, [INSERTAR AQUI], 'a determinar', respuestas vagas.\n" +
      "OBLIGATORIO: incluir numeros, porcentajes, precios aproximados, tiempos especificos.",
    github:
      "Eres el Director de Producto con acceso completo a GitHub. Usa github_read_repo para explorar el repositorio y entender el codigo, luego usa github_create_pr para proponer cambios concretos. Siempre lee primero antes de crear el PR.",
  };

  return (
    "Eres " + (director?.humanName ?? "Director") + ", " + (director?.name ?? "Agente") + " de " + company + ".\n" +
    "Especialidad: " + (director?.description ?? "") + "\n\n" +
    "Skill a ejecutar: " + (skill?.name ?? "Tarea") + " — " + (skill?.description ?? "") + "\n\n" +
    "REGLA ABSOLUTA: " + (toolInstructions[toolHint] ?? toolInstructions.create_document) + "\n\n" +
    "Despues de usar la herramienta, responde en 2-3 oraciones confirmando brevemente lo que creaste.\n" +
    "Siempre en espanol profesional de negocios. Empresa cliente: " + company + "."
  );
}

export interface TaskArtifact {
  type: "html" | "code" | "document";
  url:      string;
  filename: string;
  content:  string;
  language?: string;
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const body = await req.json() as {
    text: string;
    skillId: string;
    directorId: string;
    companyName?: string;
    taskId: string;
  };

  const { text, skillId, directorId, taskId } = body;
  const companyName = body.companyName ?? "AllClosing360";
  type DirKey = keyof typeof DIRECTOR_MAP;
  type SkKey  = keyof typeof SKILL_MAP;
  const director = DIRECTOR_MAP[directorId as DirKey];
  const skill    = SKILL_MAP[skillId as SkKey];
  const toolHint = skillToToolHint(skillId, directorId);
  const isGitHub = toolHint === "github";
  const model    = POWER_SKILLS.has(skillId) || isGitHub ? SONNET : HAIKU;

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO  = process.env.GITHUB_REPO;

  const tools: Anthropic.Tool[] = isGitHub ? GITHUB_TOOLS : BASE_TOOLS;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode("event: " + event + "\ndata: " + JSON.stringify(data) + "\n\n"));
      }

      try {
        send("step", { label: "Iniciando tarea…", index: 0 });

        const systemPrompt = buildSystem(director, skill, companyName, toolHint);
        const messages: Anthropic.MessageParam[] = [{ role: "user", content: text }];

        send("step", { label: isGitHub ? "Explorando repositorio GitHub…" : "Analizando solicitud con IA…", index: 1 });

        let response = await client.messages.create({
          model,
          max_tokens: 8000,
          system: systemPrompt,
          tools,
          tool_choice: { type: "any" },
          messages,
        });

        let artifact: TaskArtifact | null = null;
        let chatResponse = "";
        let taskTitle = skill?.name ?? "Tarea";
        let iterations = 0;
        let prUrl: string | undefined;
        let prNumber: number | undefined;

        while (response.stop_reason === "tool_use" && iterations < 6) {
          iterations++;
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of response.content) {
            if (block.type === "text" && block.text) chatResponse = block.text;

            if (block.type === "tool_use") {
              // ── create_html_file ──────────────────────────────────────────
              if (block.name === "create_html_file") {
                const inp = block.input as { filename: string; html: string; description: string };
                send("step", { label: "Generando archivo HTML…", index: 2 });
                const url = tryWriteFile(taskId + ".html", inp.html) ?? null;
                artifact = { type: "html", url: url ?? "", filename: inp.filename, content: inp.html };
                taskTitle = inp.description.slice(0, 70);
                send("artifact", { type: "html", url, filename: inp.filename });
                toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "HTML file created." });
              }

              // ── create_document ───────────────────────────────────────────
              else if (block.name === "create_document") {
                const inp = block.input as { title: string; content: string; doc_type: string };
                send("step", { label: "Generando documento…", index: 2 });
                const mdContent = "# " + inp.title + "\n\n" + inp.content;
                const url = tryWriteFile(taskId + ".md", mdContent) ?? null;
                artifact = { type: "document", url: url ?? "", filename: inp.title, content: inp.content };
                taskTitle = inp.title;
                send("artifact", { type: "document", filename: inp.title, docType: inp.doc_type });
                toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "Document created: " + inp.title });
              }

              // ── create_code_file ──────────────────────────────────────────
              else if (block.name === "create_code_file") {
                const inp = block.input as { filename: string; language: string; code: string; description: string };
                send("step", { label: "Generando código…", index: 2 });
                const extMap: Record<string, string> = { javascript: "js", typescript: "ts", python: "py", json: "json", yaml: "yaml", bash: "sh" };
                const url = tryWriteFile(taskId + "." + (extMap[inp.language] ?? "txt"), inp.code) ?? null;
                artifact = { type: "code", url: url ?? "", filename: inp.filename, content: inp.code, language: inp.language };
                taskTitle = inp.description.slice(0, 70);
                send("artifact", { type: "code", url, filename: inp.filename, language: inp.language });
                toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "Code file created." });
              }

              // ── github_read_repo ──────────────────────────────────────────
              else if (block.name === "github_read_repo") {
                const inp = block.input as { path: string };
                if (!GITHUB_TOKEN || !GITHUB_REPO) {
                  toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "Error: GITHUB_TOKEN o GITHUB_REPO no configurados en el servidor." });
                  continue;
                }
                send("step", { label: `Leyendo ${inp.path || "raíz del repo"}…`, index: 2 });
                const content = await githubReadPath(GITHUB_REPO, GITHUB_TOKEN, inp.path);
                toolResults.push({ type: "tool_result", tool_use_id: block.id, content });
              }

              // ── github_create_pr ──────────────────────────────────────────
              else if (block.name === "github_create_pr") {
                const inp = block.input as { title: string; body: string; branch: string; files: GHFile[] };
                if (!GITHUB_TOKEN || !GITHUB_REPO) {
                  toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "Error: GITHUB_TOKEN o GITHUB_REPO no configurados." });
                  continue;
                }
                send("step", { label: "Creando Pull Request…", index: 3 });
                taskTitle = inp.title;
                const result = await githubCreatePR(GITHUB_REPO, GITHUB_TOKEN, inp.title, inp.body, inp.branch, inp.files);
                if ("error" in result) {
                  toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "Error: " + result.error });
                } else {
                  prUrl = result.prUrl;
                  prNumber = result.prNumber;
                  send("artifact", { type: "pr", prUrl, prNumber });
                  toolResults.push({ type: "tool_result", tool_use_id: block.id, content: `PR #${result.prNumber} creado: ${result.prUrl}` });
                }
              }
            }
          }

          messages.push({ role: "assistant", content: response.content });
          messages.push({ role: "user", content: toolResults });

          send("step", { label: "Finalizando entregable…", index: 4 });

          response = await client.messages.create({
            model,
            max_tokens: 1024,
            system: systemPrompt,
            tools,
            messages,
          });
        }

        for (const block of response.content) {
          if (block.type === "text" && block.text.length > chatResponse.length) {
            chatResponse = block.text;
          }
        }

        const taskResult = artifact?.content ?? chatResponse;

        send("complete", {
          chatResponse: chatResponse || director?.humanName + " ha completado la tarea.",
          taskTitle,
          taskResult,
          artifact,
          model,
          inputTokens:  response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          prUrl,
          prNumber,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        console.error("[/api/task]", message);
        send("error", { message });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
