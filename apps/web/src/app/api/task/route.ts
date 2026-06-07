import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { writeFileSync, mkdirSync } from "fs"; // best-effort; skipped on Vercel
import path from "path";
import { DIRECTOR_MAP } from "../../../lib/engines";
import { SKILL_MAP } from "../../../lib/skills";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SONNET = "claude-sonnet-4-6";
const HAIKU  = "claude-haiku-4-5-20251001";

// Skills that need deeper model
const POWER_SKILLS = new Set([
  "crear_landing", "crear_reporte_ejecutivo", "crear_sop_operativo",
  "crear_campana_meta_ads", "crear_estrategia_seo", "crear_propuesta_comercial",
]);

// On Vercel, public/ is read-only → files won't be serveable via URL.
// We always return content inline; file write is best-effort (works on VPS, skipped on Vercel).
function tryWriteFile(filename: string, content: string): string | null {
  try {
    const d = path.join(process.cwd(), "public", "generated");
    mkdirSync(d, { recursive: true });
    writeFileSync(path.join(d, filename), content, "utf-8");
    return "/generated/" + filename;
  } catch {
    return null; // Vercel or read-only FS — content returned inline
  }
}

// ─── Tool definitions ────────────────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
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

function skillToToolHint(skillId: string): string {
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
      "USA la herramienta create_html_file AHORA MISMO. El HTML debe ser completo y funcional pero conciso (max 200 lineas). Incluye: hero section, 3 beneficios, CTA, footer. CSS embebido moderno. Contenido real adaptado al negocio. CERO placeholders.",
    create_code_file:
      "USA la herramienta create_code_file. El codigo debe ser funcional y completo. Sin stubs ni TODOs.",
    create_document:
      "USA la herramienta create_document. El documento debe ser completo, profesional y totalmente accionable. Sin [INSERTAR AQUI]. Incluye numeros, ejemplos reales y proximas acciones.",
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

// ─── Artifact type ────────────────────────────────────────────────────────────
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
  const toolHint = skillToToolHint(skillId);
  const model    = POWER_SKILLS.has(skillId) ? SONNET : HAIKU;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode("event: " + event + "\ndata: " + JSON.stringify(data) + "\n\n"));
      }

      try {
        send("step", { label: "Iniciando tarea…", index: 0 });

        const systemPrompt = buildSystem(director, skill, companyName, toolHint);

        const messages: Anthropic.MessageParam[] = [
          { role: "user", content: text },
        ];

        send("step", { label: "Analizando solicitud con IA…", index: 1 });

        let response = await client.messages.create({
          model,
          max_tokens: 8000,
          system: systemPrompt,
          tools: TOOLS,
          tool_choice: { type: "any" },
          messages,
        });

        let artifact: TaskArtifact | null = null;
        let chatResponse = "";
        let taskTitle = skill?.name ?? "Tarea";
        let iterations = 0;

        // ── Agentic tool-use loop ─────────────────────────────────────────────
        while (response.stop_reason === "tool_use" && iterations < 4) {
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
            }
          }

          messages.push({ role: "assistant", content: response.content });
          messages.push({ role: "user", content: toolResults });

          send("step", { label: "Finalizando entregable…", index: 3 });

          response = await client.messages.create({
            model,
            max_tokens: 512,
            system: systemPrompt,
            tools: TOOLS,
            messages,
          });
        }

        // Final text
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
