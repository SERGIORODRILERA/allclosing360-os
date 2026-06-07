import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { DIRECTOR_MAP } from "../../../lib/engines";
import { SKILL_MAP } from "../../../lib/skills";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const HAIKU  = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";

// Only truly long deliverables use Sonnet — everything else uses Haiku
const HEAVY_SKILLS = new Set(["crear_reporte_ejecutivo", "crear_sop_operativo"]);

function extractSection(text: string, marker: string): string {
  const openTag  = `[${marker}]`;
  const closeTag = `[/${marker}]`;
  const start = text.indexOf(openTag);
  if (start === -1) return "";
  const contentStart = start + openTag.length;
  const end = text.indexOf(closeTag, contentStart);
  // If closing tag is missing (truncated response), take everything after the opening tag
  const contentEnd = end !== -1 ? end : text.length;
  return text.slice(contentStart, contentEnd).trim();
}

function buildPrompt(
  directorName: string, role: string, dept: string, desc: string,
  company: string, skillName: string, skillDesc: string
): string {
  return (
    "Eres " + directorName + ", " + role + " de " + company + ".\n" +
    "Especialidad: " + desc + ". Departamento: " + dept + ".\n\n" +
    "El CEO te ha dado una orden. Ejecutaras la skill: " + skillName + " - " + skillDesc + ".\n\n" +
    "REGLA CRITICA: Responde SOLO con los marcadores de abajo, sin texto adicional, sin bloques de codigo.\n\n" +
    "Formato exacto (rellena entre los marcadores):\n\n" +
    "[chatResponse]\n" +
    "Tu respuesta conversacional al CEO. 2-3 oraciones confirmando la orden, quien la ejecuta y el enfoque.\n" +
    "[/chatResponse]\n\n" +
    "[taskTitle]\n" +
    "Titulo de la tarea, maximo 7 palabras, empezando con verbo de accion\n" +
    "[/taskTitle]\n\n" +
    "[taskResult]\n" +
    "Resultado completo y profesional de ejecutar " + skillName + ". Minimo 400 palabras.\n" +
    "Usa secciones numeradas, bullets, metricas, KPIs, pasos concretos y proximas acciones.\n" +
    "[/taskResult]\n\n" +
    "Contexto: " + company + " usa IA para optimizar operaciones y marketing. Responde siempre en espanol profesional de negocios."
  );
}

export async function POST(req: NextRequest) {
  try {
    const { text, skillId, directorId, companyName } = await req.json();

    const director = DIRECTOR_MAP[directorId as keyof typeof DIRECTOR_MAP];
    const skill    = SKILL_MAP[skillId as keyof typeof SKILL_MAP];

    if (!director || !skill) {
      return NextResponse.json({ error: "Director o skill no encontrado" }, { status: 400 });
    }

    const model   = HEAVY_SKILLS.has(skillId) ? SONNET : HAIKU;
    const company = (companyName as string) ?? "AllClosing360";

    const systemPrompt = buildPrompt(
      director.humanName, director.name, director.department,
      director.description, company, skill.name, skill.description
    );

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: text as string }],
    });

    const block = response.content[0]!;
    if (block.type !== "text") throw new Error("Respuesta inesperada de la API");

    const raw = block.text;

    const chatResponse = extractSection(raw, "chatResponse") || director.humanName + " esta ejecutando: " + skill.name + ".";
    const taskTitle    = extractSection(raw, "taskTitle")    || skill.name;
    const taskResult   = extractSection(raw, "taskResult")   || raw;

    return NextResponse.json({
      chatResponse,
      taskTitle,
      taskResult,
      model,
      inputTokens:  response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[/api/chat]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
