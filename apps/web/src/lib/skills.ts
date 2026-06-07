import type { EngineId } from "@ac360/types";

export type SkillId =
  // Oferta y estrategia
  | "crear_oferta_irresistible"
  | "crear_garantia"
  | "crear_pricing"
  | "crear_bonus_stack"
  | "crear_propuesta_de_valor"
  | "analizar_competencia"
  // Marketing
  | "crear_campana_meta_ads"
  | "crear_campana_google_ads"
  | "crear_campana_tiktok"
  | "crear_calendario_contenido"
  | "crear_guion_video"
  | "crear_newsletter"
  | "crear_estrategia_seo"
  | "crear_campana_sem"
  | "crear_campana_pr"
  // Ventas
  | "crear_script_sdr"
  | "crear_script_closer"
  | "crear_secuencia_whatsapp"
  | "crear_secuencia_email"
  | "recuperar_leads_frios"
  | "crear_plan_seguimiento"
  | "analizar_objeciones"
  // Operaciones
  | "crear_sop_operativo"
  | "crear_dashboard_ejecutivo"
  | "crear_reporte_ejecutivo"
  | "crear_checklist_operativo"
  | "crear_propuesta_comercial"
  | "crear_contrato_base"
  // IA / automatización
  | "crear_automatizacion_ghl"
  | "crear_flujo_n8n"
  | "crear_integracion_api"
  | "crear_prompt_agente"
  | "crear_base_conocimiento"
  // Análisis
  | "analizar_llamada"
  | "crear_landing";

export interface Skill {
  id: SkillId;
  name: string;
  description: string;
  icon: string;
  primaryDirector: EngineId;
  keywords: string[];
  category: string;
  outputLabel: string;
  estimatedMinutes: number;
}

export const SKILLS: Skill[] = [
  // ── OFERTA Y ESTRATEGIA ──────────────────────────────────────────────────
  {
    id: "crear_oferta_irresistible",
    name: "Crear oferta irresistible",
    description: "Diseña una oferta de alto valor imposible de rechazar",
    icon: "🔥",
    primaryDirector: "director_comercial",
    keywords: ["oferta", "irresistible", "precio", "valor", "paquete", "bundle", "oferta irresistible"],
    category: "Oferta y Estrategia",
    outputLabel: "Oferta estructurada",
    estimatedMinutes: 8,
  },
  {
    id: "crear_garantia",
    name: "Crear garantía",
    description: "Diseña una garantía que elimina el riesgo del comprador",
    icon: "🛡️",
    primaryDirector: "director_comercial",
    keywords: ["garantia", "garantía", "riesgo", "devolución", "devolucion", "refund"],
    category: "Oferta y Estrategia",
    outputLabel: "Garantía redactada",
    estimatedMinutes: 4,
  },
  {
    id: "crear_pricing",
    name: "Crear pricing strategy",
    description: "Define estructura de precios y modelos de monetización",
    icon: "💲",
    primaryDirector: "director_comercial",
    keywords: ["pricing", "precio", "tarifa", "plan de precios", "monetización", "modelo de negocio"],
    category: "Oferta y Estrategia",
    outputLabel: "Estructura de precios",
    estimatedMinutes: 6,
  },
  {
    id: "crear_bonus_stack",
    name: "Crear bonus stack",
    description: "Diseña el stack de bonos que maximiza el valor percibido",
    icon: "🎁",
    primaryDirector: "director_comercial",
    keywords: ["bonus", "bono", "bonos", "stack", "valor percibido", "regalo"],
    category: "Oferta y Estrategia",
    outputLabel: "Stack de bonos",
    estimatedMinutes: 5,
  },
  {
    id: "crear_propuesta_de_valor",
    name: "Crear propuesta de valor",
    description: "Define tu UVP (Unique Value Proposition) diferenciadora",
    icon: "💡",
    primaryDirector: "ceo_advisor",
    keywords: ["propuesta de valor", "uvp", "usp", "diferenciación", "unique value", "ventaja"],
    category: "Oferta y Estrategia",
    outputLabel: "UVP definida",
    estimatedMinutes: 7,
  },
  {
    id: "analizar_competencia",
    name: "Analizar competencia",
    description: "Audita y analiza competidores directos e indirectos",
    icon: "🔬",
    primaryDirector: "ceo_advisor",
    keywords: ["competencia", "competidor", "análisis competitivo", "benchmark", "mercado"],
    category: "Oferta y Estrategia",
    outputLabel: "Análisis competitivo",
    estimatedMinutes: 12,
  },
  // ── MARKETING ───────────────────────────────────────────────────────────
  {
    id: "crear_campana_meta_ads",
    name: "Crear campaña Meta Ads",
    description: "Estructura una campaña de anuncios en Facebook e Instagram",
    icon: "📘",
    primaryDirector: "director_meta_ads",
    keywords: ["meta", "facebook", "instagram", "ads", "anuncio social", "social ads", "fb ads", "meta ads"],
    category: "Marketing",
    outputLabel: "Campaña Meta Ads",
    estimatedMinutes: 15,
  },
  {
    id: "crear_campana_google_ads",
    name: "Crear campaña Google Ads",
    description: "Configura una campaña de búsqueda y display en Google",
    icon: "🎯",
    primaryDirector: "director_google_ads",
    keywords: ["google ads", "adwords", "ppc", "google", "búsqueda pagada", "display", "youtube ads"],
    category: "Marketing",
    outputLabel: "Campaña Google Ads",
    estimatedMinutes: 14,
  },
  {
    id: "crear_campana_tiktok",
    name: "Crear campaña TikTok",
    description: "Diseña una campaña de anuncios en TikTok para Business",
    icon: "🎵",
    primaryDirector: "director_meta_ads",
    keywords: ["tiktok", "tik tok", "short video", "tiktok ads", "reels"],
    category: "Marketing",
    outputLabel: "Campaña TikTok",
    estimatedMinutes: 12,
  },
  {
    id: "crear_calendario_contenido",
    name: "Crear calendario de contenido",
    description: "Diseña un calendario editorial mensual multicanal",
    icon: "📆",
    primaryDirector: "director_contenido",
    keywords: ["calendario", "contenido", "editorial", "plan de contenido", "publicaciones"],
    category: "Marketing",
    outputLabel: "Calendario editorial",
    estimatedMinutes: 10,
  },
  {
    id: "crear_guion_video",
    name: "Crear guion de video",
    description: "Escribe un guion persuasivo para video de ventas o contenido",
    icon: "🎬",
    primaryDirector: "director_contenido",
    keywords: ["video", "guion", "guión", "script", "youtube", "reel", "tiktok", "contenido audiovisual"],
    category: "Marketing",
    outputLabel: "Guion de video",
    estimatedMinutes: 9,
  },
  {
    id: "crear_newsletter",
    name: "Crear newsletter",
    description: "Escribe un newsletter de alto engagement para tu lista",
    icon: "📰",
    primaryDirector: "director_marketing",
    keywords: ["newsletter", "boletín", "boletin", "suscriptores", "lista"],
    category: "Marketing",
    outputLabel: "Newsletter listo",
    estimatedMinutes: 7,
  },
  {
    id: "crear_estrategia_seo",
    name: "Crear estrategia SEO",
    description: "Diseña una estrategia de posicionamiento orgánico completa",
    icon: "🔍",
    primaryDirector: "director_seo",
    keywords: ["seo", "orgánico", "organico", "posicionamiento", "keywords", "palabras clave", "backlinks"],
    category: "Marketing",
    outputLabel: "Estrategia SEO",
    estimatedMinutes: 18,
  },
  {
    id: "crear_campana_sem",
    name: "Crear campaña SEM",
    description: "Diseña una campaña de marketing en buscadores de pago",
    icon: "🔎",
    primaryDirector: "director_sem",
    keywords: ["sem", "search engine marketing", "buscadores", "paid search", "búsqueda de pago"],
    category: "Marketing",
    outputLabel: "Estrategia SEM",
    estimatedMinutes: 11,
  },
  {
    id: "crear_campana_pr",
    name: "Crear campaña PR",
    description: "Diseña una estrategia de relaciones públicas y prensa",
    icon: "📡",
    primaryDirector: "director_contenido",
    keywords: ["pr", "prensa", "relaciones públicas", "autoridad", "medios", "comunicado"],
    category: "Marketing",
    outputLabel: "Plan de PR",
    estimatedMinutes: 13,
  },
  // ── VENTAS ──────────────────────────────────────────────────────────────
  {
    id: "crear_script_sdr",
    name: "Crear script SDR",
    description: "Desarrolla el script de prospección para tu equipo SDR",
    icon: "📟",
    primaryDirector: "director_llamadas_ia",
    keywords: ["sdr", "prospección", "prospectar", "llamada fría", "cold call", "primer contacto"],
    category: "Ventas",
    outputLabel: "Script SDR",
    estimatedMinutes: 8,
  },
  {
    id: "crear_script_closer",
    name: "Crear script closer",
    description: "Crea el script de cierre para convertir demos en clientes",
    icon: "🎤",
    primaryDirector: "director_llamadas_ia",
    keywords: ["closer", "cierre", "cerrar venta", "demo", "sales call", "closing"],
    category: "Ventas",
    outputLabel: "Script de cierre",
    estimatedMinutes: 9,
  },
  {
    id: "crear_secuencia_whatsapp",
    name: "Crear secuencia WhatsApp",
    description: "Diseña una secuencia de mensajes de seguimiento por WhatsApp",
    icon: "💬",
    primaryDirector: "director_automatizaciones",
    keywords: ["whatsapp", "wa", "mensaje", "mensajes", "chatbot", "bot whatsapp", "secuencia de mensajes"],
    category: "Ventas",
    outputLabel: "Secuencia WhatsApp (7 mensajes)",
    estimatedMinutes: 8,
  },
  {
    id: "crear_secuencia_email",
    name: "Crear secuencia email",
    description: "Crea una secuencia de emails de nurturing o venta",
    icon: "📧",
    primaryDirector: "director_marketing",
    keywords: ["email", "correo", "newsletter", "secuencia email", "mailing", "automatización email", "nurturing"],
    category: "Ventas",
    outputLabel: "Secuencia de 5 emails",
    estimatedMinutes: 10,
  },
  {
    id: "recuperar_leads_frios",
    name: "Recuperar leads fríos",
    description: "Reactiva leads que no han respondido en más de 30 días",
    icon: "🧊",
    primaryDirector: "director_crm_ghl",
    keywords: ["leads frios", "leads fríos", "reactivar", "recuperar clientes", "base de datos fría"],
    category: "Ventas",
    outputLabel: "Campaña de reactivación",
    estimatedMinutes: 9,
  },
  {
    id: "crear_plan_seguimiento",
    name: "Crear plan de seguimiento",
    description: "Diseña un plan de follow-up sistemático para leads",
    icon: "📅",
    primaryDirector: "director_crm_ghl",
    keywords: ["seguimiento", "follow up", "followup", "crm", "pipeline", "contactar", "ghl", "lead"],
    category: "Ventas",
    outputLabel: "Plan de seguimiento (5 touchpoints)",
    estimatedMinutes: 6,
  },
  {
    id: "analizar_objeciones",
    name: "Analizar objeciones",
    description: "Identifica y prepara respuestas a las objeciones más comunes",
    icon: "🛑",
    primaryDirector: "director_comercial",
    keywords: ["objeciones", "objeción", "resistencia", "barreras de venta", "excusas"],
    category: "Ventas",
    outputLabel: "Manual de objeciones",
    estimatedMinutes: 7,
  },
  // ── OPERACIONES ─────────────────────────────────────────────────────────
  {
    id: "crear_sop_operativo",
    name: "Crear SOP operativo",
    description: "Documenta un proceso estándar de operación ejecutable",
    icon: "📝",
    primaryDirector: "director_operaciones",
    keywords: ["sop", "proceso", "procedimiento", "operativo", "manual", "documentar", "flujo de trabajo"],
    category: "Operaciones",
    outputLabel: "SOP documentado",
    estimatedMinutes: 11,
  },
  {
    id: "crear_dashboard_ejecutivo",
    name: "Crear dashboard ejecutivo",
    description: "Diseña el dashboard de KPIs para dirección",
    icon: "📊",
    primaryDirector: "director_financiero",
    keywords: ["dashboard", "panel", "kpi", "métricas clave", "cuadro de mando"],
    category: "Operaciones",
    outputLabel: "Dashboard de KPIs",
    estimatedMinutes: 9,
  },
  {
    id: "crear_reporte_ejecutivo",
    name: "Crear reporte ejecutivo",
    description: "Genera un reporte estratégico completo con métricas clave",
    icon: "📈",
    primaryDirector: "ceo_advisor",
    keywords: ["reporte", "informe", "dashboard", "métricas", "metricas", "analytics", "kpi", "revenue", "estrategia"],
    category: "Operaciones",
    outputLabel: "Reporte ejecutivo",
    estimatedMinutes: 15,
  },
  {
    id: "crear_checklist_operativo",
    name: "Crear checklist operativo",
    description: "Crea un checklist de control de calidad para procesos",
    icon: "✅",
    primaryDirector: "director_operaciones",
    keywords: ["checklist", "lista de verificación", "control", "calidad", "protocolo"],
    category: "Operaciones",
    outputLabel: "Checklist listo",
    estimatedMinutes: 4,
  },
  {
    id: "crear_propuesta_comercial",
    name: "Crear propuesta comercial",
    description: "Genera una propuesta comercial profesional y persuasiva",
    icon: "📋",
    primaryDirector: "director_comercial",
    keywords: ["propuesta", "presupuesto", "cotización", "cotizacion", "proposal", "oferta comercial"],
    category: "Operaciones",
    outputLabel: "Propuesta comercial",
    estimatedMinutes: 12,
  },
  {
    id: "crear_contrato_base",
    name: "Crear contrato base",
    description: "Genera un contrato de servicios base adaptable",
    icon: "📄",
    primaryDirector: "director_operaciones",
    keywords: ["contrato", "acuerdo", "términos", "legal", "servicio", "agreement"],
    category: "Operaciones",
    outputLabel: "Contrato base",
    estimatedMinutes: 8,
  },
  // ── IA / AUTOMATIZACIÓN ─────────────────────────────────────────────────
  {
    id: "crear_automatizacion_ghl",
    name: "Crear automatización GHL",
    description: "Diseña un flujo de automatización en GoHighLevel",
    icon: "⚡",
    primaryDirector: "director_automatizaciones",
    keywords: ["ghl", "go high level", "automatización ghl", "workflow", "pipeline automatizado"],
    category: "IA / Automatización",
    outputLabel: "Flujo GHL configurado",
    estimatedMinutes: 10,
  },
  {
    id: "crear_flujo_n8n",
    name: "Crear flujo n8n",
    description: "Construye un flujo de automatización con n8n",
    icon: "🔀",
    primaryDirector: "director_automatizaciones",
    keywords: ["n8n", "flujo", "automatización n8n", "workflow n8n", "nodo"],
    category: "IA / Automatización",
    outputLabel: "Flujo n8n",
    estimatedMinutes: 14,
  },
  {
    id: "crear_integracion_api",
    name: "Crear integración API",
    description: "Diseña la integración entre sistemas vía API",
    icon: "🔌",
    primaryDirector: "director_automatizaciones",
    keywords: ["api", "integración", "webhook", "endpoint", "conexión", "rest api"],
    category: "IA / Automatización",
    outputLabel: "Spec de integración",
    estimatedMinutes: 16,
  },
  {
    id: "crear_prompt_agente",
    name: "Crear prompt de agente IA",
    description: "Diseña el system prompt óptimo para un agente de IA",
    icon: "🤖",
    primaryDirector: "director_automatizaciones",
    keywords: ["prompt", "agente ia", "system prompt", "instrucciones ia", "gpt", "claude"],
    category: "IA / Automatización",
    outputLabel: "System prompt",
    estimatedMinutes: 8,
  },
  {
    id: "crear_base_conocimiento",
    name: "Crear base de conocimiento",
    description: "Estructura una base de conocimiento para agentes IA",
    icon: "🧠",
    primaryDirector: "director_automatizaciones",
    keywords: ["base de conocimiento", "knowledge base", "faq", "documentación", "rag"],
    category: "IA / Automatización",
    outputLabel: "Base de conocimiento",
    estimatedMinutes: 13,
  },
  // ── ANÁLISIS ─────────────────────────────────────────────────────────────
  {
    id: "analizar_llamada",
    name: "Analizar llamada de ventas",
    description: "Analiza una llamada y extrae insights con IA",
    icon: "📞",
    primaryDirector: "director_llamadas_ia",
    keywords: ["llamada", "llamar", "voz", "audio", "transcripción", "transcripcion", "análisis llamada", "analizar llamada", "grabación"],
    category: "Análisis",
    outputLabel: "Scorecard de llamada",
    estimatedMinutes: 20,
  },
  {
    id: "crear_landing",
    name: "Crear landing page",
    description: "Diseña una página de aterrizaje de alta conversión",
    icon: "🏠",
    primaryDirector: "director_embudos",
    keywords: ["landing", "página", "pagina", "aterrizaje", "funnel", "embudo", "conversión"],
    category: "Análisis",
    outputLabel: "Landing page completa",
    estimatedMinutes: 12,
  },
];

export const SKILL_MAP = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
) as Record<SkillId, Skill>;

export const SKILL_CATEGORIES = [...new Set(SKILLS.map((s) => s.category))];
