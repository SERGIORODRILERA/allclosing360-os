import type { EngineId } from "@ac360/types";

export interface DirectorConfig {
  id: EngineId;
  name: string;
  shortName: string;
  description: string;
  color: string;
  icon: string;
  humanName: string;
  initials: string;
  department: string;
}

export const DIRECTORS: DirectorConfig[] = [
  {
    id: "ceo_advisor",
    name: "CEO Advisor",
    shortName: "CEO",
    description: "Estrategia, visión y reportes ejecutivos",
    color: "#f59e0b",
    icon: "👑",
    humanName: "Alejandro R.",
    initials: "AR",
    department: "Dirección General",
  },
  {
    id: "director_comercial",
    name: "Director Comercial",
    shortName: "Comercial",
    description: "Ofertas, propuestas y cierre de ventas",
    color: "#3b82f6",
    icon: "💼",
    humanName: "Carlos M.",
    initials: "CM",
    department: "Ventas",
  },
  {
    id: "director_marketing",
    name: "Director de Marketing",
    shortName: "Marketing",
    description: "Estrategia y campañas de marketing integral",
    color: "#ec4899",
    icon: "📣",
    humanName: "Sofía V.",
    initials: "SV",
    department: "Marketing",
  },
  {
    id: "director_embudos",
    name: "Director de Embudos",
    shortName: "Embudos",
    description: "Diseño y optimización de funnels",
    color: "#06b6d4",
    icon: "🎯",
    humanName: "Diego P.",
    initials: "DP",
    department: "Conversión",
  },
  {
    id: "director_seo",
    name: "Director SEO",
    shortName: "SEO",
    description: "Posicionamiento orgánico en buscadores",
    color: "#22c55e",
    icon: "🔍",
    humanName: "Ana G.",
    initials: "AG",
    department: "SEO",
  },
  {
    id: "director_sem",
    name: "Director SEM",
    shortName: "SEM",
    description: "Publicidad de pago en buscadores",
    color: "#84cc16",
    icon: "🔎",
    humanName: "Marco T.",
    initials: "MT",
    department: "SEM",
  },
  {
    id: "director_meta_ads",
    name: "Director Meta Ads",
    shortName: "Meta Ads",
    description: "Campañas en Facebook e Instagram",
    color: "#6366f1",
    icon: "📘",
    humanName: "Laura S.",
    initials: "LS",
    department: "Paid Social",
  },
  {
    id: "director_google_ads",
    name: "Director Google Ads",
    shortName: "Google Ads",
    description: "Campañas en Google y YouTube",
    color: "#ef4444",
    icon: "🔴",
    humanName: "Javier L.",
    initials: "JL",
    department: "Search Ads",
  },
  {
    id: "director_contenido",
    name: "Director de Contenido",
    shortName: "Contenido",
    description: "Creación y estrategia de contenido",
    color: "#a855f7",
    icon: "✍️",
    humanName: "Isabel R.",
    initials: "IR",
    department: "Contenido",
  },
  {
    id: "director_llamadas_ia",
    name: "Director de Llamadas IA",
    shortName: "Llamadas IA",
    description: "Análisis y scripts de llamadas con IA",
    color: "#f97316",
    icon: "📞",
    humanName: "Tomás A.",
    initials: "TA",
    department: "Voice AI",
  },
  {
    id: "director_automatizaciones",
    name: "Director de Automatizaciones",
    shortName: "Automatiz.",
    description: "Flujos y automatizaciones de negocio",
    color: "#14b8a6",
    icon: "⚡",
    humanName: "Elena M.",
    initials: "EM",
    department: "Automatizaciones",
  },
  {
    id: "director_crm_ghl",
    name: "Director CRM/GHL",
    shortName: "CRM/GHL",
    description: "Gestión de contactos y pipelines en GHL",
    color: "#eab308",
    icon: "🗂️",
    humanName: "Roberto K.",
    initials: "RK",
    department: "CRM",
  },
  {
    id: "director_financiero",
    name: "Director Financiero",
    shortName: "Finanzas",
    description: "Control financiero y proyecciones de revenue",
    color: "#10b981",
    icon: "💰",
    humanName: "Patricia N.",
    initials: "PN",
    department: "Finanzas",
  },
  {
    id: "director_operaciones",
    name: "Director de Operaciones",
    shortName: "Operaciones",
    description: "SOPs, procesos y eficiencia operativa",
    color: "#8b5cf6",
    icon: "⚙️",
    humanName: "Fernando C.",
    initials: "FC",
    department: "Operaciones",
  },
];

export const DIRECTOR_MAP = Object.fromEntries(
  DIRECTORS.map((d) => [d.id, d]),
) as Record<EngineId, DirectorConfig>;

// Backward-compat aliases
export const ENGINES = DIRECTORS;
export const ENGINE_MAP = DIRECTOR_MAP;
export type EngineConfig = DirectorConfig;
